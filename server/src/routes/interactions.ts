import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router({ mergeParams: true });
const prisma = new PrismaClient();

// GET /api/people/:personId/interactions
router.get('/', async (req: Request, res: Response, next) => {
  try {
    const interactions = await prisma.interaction.findMany({
      where: { personId: req.params.personId as string },
      orderBy: { date: 'desc' },
    });
    res.json(interactions);
  } catch (err) { next(err); }
});

// POST /api/people/:personId/interactions
router.post('/', async (req: Request, res: Response, next) => {
  try {
    const interaction = await prisma.interaction.create({
      data: { ...req.body, personId: req.params.personId as string },
    });
    await prisma.person.update({
      where: { id: req.params.personId as string },
      data: { lastContactDate: new Date() },
    });
    res.status(201).json(interaction);
  } catch (err) { next(err); }
});

export default router;
