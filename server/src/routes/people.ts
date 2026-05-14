import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { urgencyScore, urgencyBadge, ACTIVE_STATUSES } from '../utils/urgency';

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

export default router;
