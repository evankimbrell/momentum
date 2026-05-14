import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFollowupsToday, markFollowupDone } from '../lib/api';
import type { Person } from '../lib/types';
import { flagEmoji, platformBadgeClass } from '../lib/utils';
import { Check } from 'lucide-react';

export default function Followups() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getFollowupsToday();
    setPeople(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDone = async (e: React.MouseEvent, personId: string) => {
    e.stopPropagation();
    await markFollowupDone(personId);
    load();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-10 bg-[#0a0a0a] border-b border-white/8 px-4 py-3"
        style={{ paddingTop: 'calc(12px + env(safe-area-inset-top))' }}
      >
        <h1 className="text-base font-semibold text-white">Follow-ups</h1>
        <p className="text-[11px] text-zinc-500">Due today or overdue</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 pb-24 space-y-2">
        {loading ? (
          <div className="text-center py-12 text-zinc-600 text-sm">Loading...</div>
        ) : people.length === 0 ? (
          <div className="text-center py-12 text-zinc-600 text-sm">
            All caught up. No follow-ups due.
          </div>
        ) : (
          people.map((p) => {
            const isOverdue = p.followUpDate && new Date(p.followUpDate) < new Date();
            return (
              <div
                key={p.id}
                className={`border rounded-xl p-4 cursor-pointer ${
                  isOverdue ? 'border-red-500/30 bg-red-900/10' : 'border-white/8 bg-[#141414]'
                }`}
                onClick={() => navigate(`/people/${p.id}`)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-white">{p.name}</span>
                      <span>{flagEmoji(p.nationality)}</span>
                      <span className={`text-[11px] px-1.5 py-0.5 rounded border font-mono ${platformBadgeClass(p.platform)}`}>
                        {p.platform}
                      </span>
                    </div>
                    {p.followUpNote && (
                      <p className="text-xs text-zinc-300">{p.followUpNote}</p>
                    )}
                    {p.followUpDate && (
                      <p className={`text-[11px] font-mono mt-1 ${isOverdue ? 'text-red-400' : 'text-zinc-500'}`}>
                        {isOverdue ? 'Overdue — ' : ''}
                        {new Date(p.followUpDate).toLocaleDateString('en-US', {
                          weekday: 'short', month: 'short', day: 'numeric',
                        })}
                      </p>
                    )}
                  </div>
                  <button
                    className="shrink-0 flex items-center gap-1 text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-1 rounded min-h-[44px] min-w-[44px] justify-center"
                    onClick={(e) => handleDone(e, p.id)}
                  >
                    <Check size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
