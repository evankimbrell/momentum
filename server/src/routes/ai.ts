import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { analyzeChat, parseVoiceMemo, suggestFollowup } from '../services/claude';

const router = Router();
const prisma = new PrismaClient();

const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
});

// POST /api/ai/analyze-chat — screenshots or pasted text
router.post('/analyze-chat', upload.array('images', 10), async (req: Request, res: Response, next) => {
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    const rawText = req.body.text as string | undefined;
    let imageUrls: string[] = [];
    if (files && files.length > 0) {
      imageUrls = files.map(
        (f) => `${req.protocol}://${req.get('host')}/uploads/${f.filename}`
      );
    }
    if (!rawText && imageUrls.length === 0) {
      return res.status(400).json({ error: 'Provide text or images' });
    }
    const analysis = await analyzeChat(rawText, imageUrls);
    res.json({ ...analysis, imageUrls });
  } catch (err) { next(err); }
});

// POST /api/ai/voice-memo — accepts browser-transcribed text
router.post('/voice-memo', async (req: Request, res: Response, next) => {
  try {
    const { transcript, personId } = req.body as { transcript: string; personId?: string };
    if (!transcript?.trim()) return res.status(400).json({ error: 'No transcript provided' });
    const extracted = await parseVoiceMemo(transcript);
    await prisma.audioNote.create({
      data: {
        audioUrl: '',
        transcript,
        aiExtractedUpdates: extracted,
        applied: false,
        ...(personId ? { personId } : {}),
      },
    });
    res.json({ transcript, extracted });
  } catch (err) { next(err); }
});

// POST /api/ai/voice-memo/apply — commit the extracted changes
router.post('/voice-memo/apply', async (req: Request, res: Response, next) => {
  try {
    const { extracted, personId, audioNoteId, transcript } = req.body;
    let person;
    if (personId) {
      // User explicitly selected a person — always update them regardless of Claude's action
      const updates = (extracted.action === 'update' ? extracted.updates : extracted.person) ?? {};
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates as object).filter(([, v]) => v !== null && v !== undefined && v !== '')
      );
      person = await prisma.person.update({
        where: { id: personId as string },
        data: cleanUpdates,
      });
    } else if (extracted.action === 'create') {
      const personData = {
        ...extracted.person,
        name: extracted.person?.name ?? extracted.personNameHint ?? 'Unknown',
        platform: extracted.person?.platform ?? 'unknown',
        status: extracted.person?.status ?? 'ACTIVE',
        dealBreakers: extracted.person?.dealBreakers ?? [],
        greenFlags: extracted.person?.greenFlags ?? [],
      };
      person = await prisma.person.create({ data: personData });
    }
    if (audioNoteId) {
      await prisma.audioNote.update({
        where: { id: audioNoteId as string },
        data: { applied: true, personId: person?.id },
      });
    }
    // Always log an interaction for the voice memo using the raw transcript
    if (person) {
      await prisma.interaction.create({
        data: {
          personId: person.id,
          platform: 'voice memo',
          summary: transcript ?? extracted.interactionSummary ?? 'Voice memo logged.',
          date: new Date(),
        },
      });
      // Keep lastContactDate fresh
      await prisma.person.update({
        where: { id: person.id },
        data: { lastContactDate: new Date() },
      });
    }
    res.json(person);
  } catch (err) { next(err); }
});

// POST /api/ai/suggest-followup
router.post('/suggest-followup', async (req: Request, res: Response, next) => {
  try {
    const { personId } = req.body;
    const person = await prisma.person.findUnique({
      where: { id: personId as string },
      include: { interactions: { orderBy: { date: 'desc' }, take: 1 } },
    });
    if (!person) return res.status(404).json({ error: 'Person not found' });
    const message = await suggestFollowup({
      name: person.name,
      lastContactDate: person.lastContactDate,
      lastSummary: person.interactions[0]?.summary,
      dateNotes: person.dateNotes,
      greenFlags: person.greenFlags,
      followUpNote: person.followUpNote,
    });
    res.json({ message });
  } catch (err) { next(err); }
});

export default router;
