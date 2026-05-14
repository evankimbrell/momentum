import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/followups/today — overdue or due today
router.get('/today', async (req: Request, res: Response, next) => {
  try {
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    const people = await prisma.person.findMany({
      where: {
        followUpDate: { lte: endOfToday },
        status: { notIn: ['ARCHIVED', 'GHOSTED'] },
      },
      include: { interactions: { orderBy: { date: 'desc' }, take: 1 } },
      orderBy: { followUpDate: 'asc' },
    });
    res.json(people);
  } catch (err) { next(err); }
});

// PATCH /api/followups/:personId/done — clears followUpDate
router.patch('/:personId/done', async (req: Request, res: Response, next) => {
  try {
    const person = await prisma.person.update({
      where: { id: req.params.personId as string },
      data: {
        followUpDate: null,
        followUpNote: null,
        lastContactDate: new Date(),
      },
    });
    res.json(person);
  } catch (err) { next(err); }
});

export default router;
