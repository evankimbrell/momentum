import { useNavigate } from 'react-router-dom';
import type { Person } from '../lib/types';
import { BADGE_CONFIG, flagEmoji, formatDaysAgo, platformBadgeClass } from '../lib/utils';
import { useSwipe } from '../hooks/useSwipe';
import { updatePerson } from '../lib/api';

interface Props {
  person: Person;
  onUpdate: () => void;
}

export default function PersonCard({ person, onUpdate }: Props) {
  const navigate = useNavigate();
  const badge = BADGE_CONFIG[person.urgencyBadge];

  const { onTouchStart, onTouchMove, onTouchEnd, offsetX } = useSwipe({
    threshold: 80,
    onSwipeRight: async () => {
      await updatePerson(person.id, { lastContactDate: new Date().toISOString() } as any);
      onUpdate();
    },
    onSwipeLeft: async () => {
      await updatePerson(person.id, { status: 'ARCHIVED' } as any);
      onUpdate();
    },
  });

  const swipeColor =
    offsetX > 40 ? 'bg-green-900/40' : offsetX < -40 ? 'bg-red-900/40' : '';

  const lastInteraction = person.interactions[person.interactions.length - 1];
  const interestScore = lastInteraction?.aiInterestScore;

  return (
    <div
      className={`relative rounded-xl border border-white/8 p-4 cursor-pointer select-none transition-colors ${swipeColor} ${
        person.urgencyBadge === 'critical'
          ? 'bg-[#1a1010]'
          : 'bg-[#141414]'
      }`}
      style={{ transform: `translateX(${offsetX}px)`, transition: offsetX === 0 ? 'transform 0.2s ease' : 'none' }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onClick={() => navigate(`/people/${person.id}`)}
    >
      {/* Swipe hints */}
      {offsetX > 40 && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-green-400 text-xs font-mono">✓ contacted</div>
      )}
      {offsetX < -40 && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 text-xs font-mono">archive →</div>
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base font-semibold text-white">
              {person.name}
            </span>
            <span className="text-sm">{flagEmoji(person.nationality)}</span>
            {person.age && (
              <span className="font-mono text-xs text-zinc-500">{person.age}</span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${platformBadgeClass(person.platform)}`}>
              {person.platform}
            </span>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded border flex items-center gap-1 ${badge.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
              {badge.label}
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">
              {formatDaysAgo(person.lastContactDate)}
            </span>
          </div>

          {person.followUpNote && person.urgencyBadge === 'critical' && (
            <p className="text-xs text-red-300 mb-1 truncate">{person.followUpNote}</p>
          )}

          {lastInteraction?.summary && (
            <p className="text-xs text-zinc-400 truncate">{lastInteraction.summary}</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          {interestScore !== undefined && interestScore !== null && (
            <div className="text-right">
              <div className="font-mono text-sm font-semibold text-white">{interestScore.toFixed(1)}</div>
              <div className="text-[10px] text-zinc-600 font-mono">interest</div>
            </div>
          )}
        </div>
      </div>

      {/* Interest bar */}
      {interestScore !== undefined && interestScore !== null && (
        <div className="mt-2 h-0.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-zinc-500 to-white transition-all"
            style={{ width: `${(interestScore / 10) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}
