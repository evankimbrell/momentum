import type { Person, UrgencyBadge } from './types';

export const NATIONALITY_FLAGS: Record<string, string> = {
  Italian: '🇮🇹',
  German: '🇩🇪',
  French: '🇫🇷',
  Spanish: '🇪🇸',
  Indian: '🇮🇳',
  Iranian: '🇮🇷',
  Azerbaijani: '🇦🇿',
  American: '🇺🇸',
  British: '🇬🇧',
  Australian: '🇦🇺',
};

export const PLATFORM_COLORS: Record<string, string> = {
  Bumble: 'text-yellow-400 bg-yellow-400/10',
  Hinge: '#FF6A6A',
  Instagram: 'text-pink-400 bg-pink-400/10',
  WhatsApp: 'text-green-400 bg-green-400/10',
  Tinder: 'text-orange-400 bg-orange-400/10',
};

export const BADGE_CONFIG: Record<UrgencyBadge, { label: string; color: string; dot: string }> = {
  critical: { label: 'Critical', color: 'text-red-400 bg-red-400/10 border-red-400/20', dot: 'bg-red-400' },
  followup: { label: 'Follow up', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20', dot: 'bg-amber-400' },
  warm: { label: 'Warm', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20', dot: 'bg-yellow-400' },
  active: { label: 'Active', color: 'text-green-400 bg-green-400/10 border-green-400/20', dot: 'bg-green-400' },
};

export const STATUS_LABELS: Record<Person['status'], string> = {
  ACTIVE: 'Active',
  NEEDS_PING: 'Needs Ping',
  DATE_PLANNED: 'Date Planned',
  GHOSTED: 'Ghosted',
  ARCHIVED: 'Archived',
};

export function daysSince(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  return (Date.now() - new Date(dateStr).getTime()) / 86400000;
}

export function formatDaysAgo(dateStr?: string | null): string {
  const days = daysSince(dateStr);
  if (days === null) return 'never';
  if (days < 1) return 'today';
  if (days < 2) return 'yesterday';
  return `${Math.floor(days)}d ago`;
}

export function flagEmoji(nationality?: string | null): string {
  if (!nationality) return '';
  return NATIONALITY_FLAGS[nationality] ?? '';
}

export function platformBadgeClass(platform: string): string {
  const map: Record<string, string> = {
    Bumble: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    Hinge: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
    Instagram: 'text-pink-400 bg-pink-400/10 border-pink-400/20',
    WhatsApp: 'text-green-400 bg-green-400/10 border-green-400/20',
    Tinder: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  };
  return map[platform] ?? 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20';
}
