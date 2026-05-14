import { useEffect, useState, useCallback } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { getPeople } from '../lib/api';
import type { Person } from '../lib/types';
import PersonCard from '../components/PersonCard';
import AddUpdateSheet from '../components/AddUpdateSheet';

export default function Dashboard() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSheet, setShowSheet] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPeople();
      setPeople(data);
    } catch {
      // leave people empty, show empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const criticalCount = people.filter((p) => p.urgencyBadge === 'critical').length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0a0a0a] border-b border-white/8 px-4 py-3 flex items-center justify-between"
        style={{ paddingTop: 'calc(12px + env(safe-area-inset-top))' }}
      >
        <div>
          <h1 className="text-base font-semibold text-white">Momentum</h1>
          {criticalCount > 0 && (
            <p className="text-[11px] text-red-400 font-mono">{criticalCount} critical</p>
          )}
        </div>
        <button onClick={load} className="text-zinc-600 p-1">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Card list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2" style={{ paddingBottom: 'calc(112px + env(safe-area-inset-bottom))' }}>
        {loading ? (
          <div className="text-center py-12 text-zinc-600 text-sm">Loading...</div>
        ) : people.length === 0 ? (
          <div className="text-center py-12 text-zinc-600 text-sm">
            No active conversations.
            <br />
            Tap + to add someone.
          </div>
        ) : (
          people.map((p) => (
            <PersonCard key={p.id} person={p} onUpdate={load} />
          ))
        )}
      </div>

      {/* FAB */}
      <button
        className="fixed right-4 w-14 h-14 bg-white text-black rounded-full shadow-xl flex items-center justify-center z-20"
        style={{ bottom: 'calc(72px + env(safe-area-inset-bottom))' }}
        onClick={() => setShowSheet(true)}
      >
        <Plus size={24} />
      </button>

      {showSheet && (
        <AddUpdateSheet
          onClose={() => setShowSheet(false)}
          onSaved={load}
        />
      )}
    </div>
  );
}
