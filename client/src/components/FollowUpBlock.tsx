import { useState } from 'react';
import type { Person } from '../lib/types';
import { markFollowupDone, updatePerson } from '../lib/api';
import { Calendar, Check } from 'lucide-react';

interface Props {
  person: Person;
  onUpdate: () => void;
}

export default function FollowUpBlock({ person, onUpdate }: Props) {
  const [rescheduleMode, setRescheduleMode] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newNote, setNewNote] = useState(person.followUpNote ?? '');
  const [saving, setSaving] = useState(false);

  const isOverdue = person.followUpDate && new Date(person.followUpDate) <= new Date();

  const handleDone = async () => {
    setSaving(true);
    await markFollowupDone(person.id);
    onUpdate();
    setSaving(false);
  };

  const handleReschedule = async () => {
    if (!newDate) return;
    setSaving(true);
    await updatePerson(person.id, {
      followUpDate: new Date(newDate).toISOString() as any,
      followUpNote: newNote as any,
    });
    setRescheduleMode(false);
    onUpdate();
    setSaving(false);
  };

  if (!person.followUpDate) {
    return (
      <div className="border border-white/8 rounded-lg p-3">
        <p className="text-xs text-zinc-600">No follow-up scheduled.</p>
        <button
          className="mt-2 text-xs text-zinc-400 underline underline-offset-2"
          onClick={() => setRescheduleMode(true)}
        >
          + Schedule follow-up
        </button>
        {rescheduleMode && (
          <div className="mt-2 space-y-2">
            <input
              type="date"
              className="w-full bg-zinc-900 border border-white/10 rounded px-2 py-1 text-xs text-white"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
            />
            <input
              type="text"
              placeholder="Note (optional)"
              className="w-full bg-zinc-900 border border-white/10 rounded px-2 py-1 text-xs text-white placeholder:text-zinc-600"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
            />
            <button
              className="text-xs bg-white text-black px-3 py-1 rounded font-medium"
              onClick={handleReschedule}
            >
              Save
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`border rounded-lg p-3 ${isOverdue ? 'border-red-500/40 bg-red-900/10' : 'border-white/8'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={12} className={isOverdue ? 'text-red-400' : 'text-zinc-400'} />
            <span className={`text-xs font-mono ${isOverdue ? 'text-red-400' : 'text-zinc-300'}`}>
              {isOverdue ? 'OVERDUE — ' : ''}
              {new Date(person.followUpDate!).toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric',
              })}
            </span>
          </div>
          {person.followUpNote && (
            <p className="text-xs text-zinc-300">{person.followUpNote}</p>
          )}
        </div>
        <button
          className="shrink-0 flex items-center gap-1 text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-1 rounded"
          onClick={handleDone}
          disabled={saving}
        >
          <Check size={12} /> Done
        </button>
      </div>

      {!rescheduleMode ? (
        <button
          className="mt-2 text-[11px] text-zinc-600 underline underline-offset-2"
          onClick={() => setRescheduleMode(true)}
        >
          Reschedule
        </button>
      ) : (
        <div className="mt-2 space-y-2">
          <input
            type="date"
            className="w-full bg-zinc-900 border border-white/10 rounded px-2 py-1 text-xs text-white"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
          />
          <input
            type="text"
            placeholder="Note"
            className="w-full bg-zinc-900 border border-white/10 rounded px-2 py-1 text-xs text-white placeholder:text-zinc-600"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              className="text-xs bg-white text-black px-3 py-1 rounded font-medium"
              onClick={handleReschedule}
              disabled={saving}
            >
              Save
            </button>
            <button
              className="text-xs text-zinc-500"
              onClick={() => setRescheduleMode(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
