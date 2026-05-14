import { Person, Interaction, PersonStatus } from '@prisma/client';

type PersonWithInteractions = Person & { interactions: Interaction[] };

export function urgencyScore(person: PersonWithInteractions): number {
  const daysSinceContact = person.lastContactDate
    ? (Date.now() - new Date(person.lastContactDate).getTime()) / 86400000
    : 999;

  const lastInteraction = person.interactions.at(-1);
  const interestScore = lastInteraction?.aiInterestScore ?? 5;

  const followUpOverdue =
    person.followUpDate && new Date(person.followUpDate) <= new Date() ? 100 : 0;

  return followUpOverdue + daysSinceContact * (interestScore / 5);
}

export function urgencyBadge(score: number, person: PersonWithInteractions): string {
  if (person.followUpDate && new Date(person.followUpDate) <= new Date()) return 'critical';
  const daysSince = person.lastContactDate
    ? (Date.now() - new Date(person.lastContactDate).getTime()) / 86400000
    : 999;
  if (daysSince > 5) return 'critical';
  if (daysSince > 2) return 'followup';
  if (daysSince > 1) return 'warm';
  return 'active';
}

export const ACTIVE_STATUSES: PersonStatus[] = [
  PersonStatus.ACTIVE,
  PersonStatus.NEEDS_PING,
  PersonStatus.DATE_PLANNED,
];
