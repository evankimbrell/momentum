import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { urgencyScore, urgencyBadge, ACTIVE_STATUSES } from '../utils/urgency';

const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
});

const router = Router();
const prisma = new PrismaClient();

// GET /api/people — sorted by urgency, excludes ARCHIVED/GHOSTED by default
router.get('/', async (req: Request, res: Response, next) => {
  try {
    const includeAll = req.query.all === 'true';
    const where = includeAll ? {} : { status: { in: ACTIVE_STATUSES } };
    const people = await prisma.person.findMany({
      where,
      include: { interactions: { orderBy: { date: 'asc' } } },
    });
    const sorted = people
      .map((p) => {
        const score = urgencyScore(p);
        return { ...p, urgencyScore: score, urgencyBadge: urgencyBadge(score, p) };
      })
      .sort((a, b) => b.urgencyScore - a.urgencyScore);
    res.json(sorted);
  } catch (err) { next(err); }
});

// GET /api/people/:id
router.get('/:id', async (req: Request, res: Response, next) => {
  try {
    const person = await prisma.person.findUnique({
      where: { id: req.params.id as string },
      include: {
        interactions: { orderBy: { date: 'desc' } },
        audioNotes: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!person) return res.status(404).json({ error: 'Not found' });
    const score = urgencyScore(person);
    res.json({ ...person, urgencyScore: score, urgencyBadge: urgencyBadge(score, person) });
  } catch (err) { next(err); }
});

// POST /api/people
router.post('/', async (req: Request, res: Response, next) => {
  try {
    const person = await prisma.person.create({ data: req.body });
    res.status(201).json(person);
  } catch (err) { next(err); }
});

// PATCH /api/people/:id
router.patch('/:id', async (req: Request, res: Response, next) => {
  try {
    const person = await prisma.person.update({
      where: { id: req.params.id as string },
      data: req.body,
    });
    res.json(person);
  } catch (err) { next(err); }
});

// DELETE /api/people/:id
router.delete('/:id', async (req: Request, res: Response, next) => {
  try {
    await prisma.person.delete({ where: { id: req.params.id as string } });
    res.status(204).send();
  } catch (err) { next(err); }
});

// POST /api/people/:id/photos — upload 1-5 profile photos
router.post('/:id/photos', upload.array('photos', 5), async (req: Request, res: Response, next) => {
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) return res.status(400).json({ error: 'No files uploaded' });

    const newUrls = files.map(
      (f) => `${req.protocol}://${req.get('host')}/uploads/${f.filename}`
    );

    const person = await prisma.person.update({
      where: { id: req.params.id },
      data: { photoUrls: { push: newUrls } },
    });
    res.json(person);
  } catch (err) { next(err); }
});

export default router;
