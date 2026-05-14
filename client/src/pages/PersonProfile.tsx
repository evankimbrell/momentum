import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mic, Image, MessageSquare, Plus, Trash2 } from 'lucide-react';
import { getPerson, suggestFollowup, createInteraction, updatePerson, deletePerson } from '../lib/api';
import type { Person } from '../lib/types';
import { BADGE_CONFIG, flagEmoji, platformBadgeClass, STATUS_LABELS, formatDaysAgo } from '../lib/utils';
import FollowUpBlock from '../components/FollowUpBlock';
import InteractionTimeline from '../components/InteractionTimeline';
import VoiceMemo from '../components/VoiceMemo';
import ScreenshotUpload from '../components/ScreenshotUpload';

type Sheet = 'voice' | 'screenshot' | 'manual' | null;

export default function PersonProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [person, setPerson] = useState<Person | null>(null);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [suggestion, setSuggestion] = useState('');
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [manualNote, setManualNote] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    const data = await getPerson(id);
    setPerson(data);
    setNotesText(data.dateNotes ?? '');
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleSuggest = async () => {
    if (!person) return;
    setLoadingSuggestion(true);
    const { message } = await suggestFollowup(person.id);
    setSuggestion(message);
    setLoadingSuggestion(false);
  };

  const handleManualLog = async () => {
    if (!person || !manualNote.trim()) return;
    await createInteraction(person.id, {
      platform: person.platform,
      summary: manualNote,
    } as any);
    setManualNote('');
    setSheet(null);
    load();
  };

  const handleSaveNotes = async () => {
    if (!person) return;
    await updatePerson(person.id, { dateNotes: notesText } as any);
    setEditingNotes(false);
    load();
  };

  const handleDelete = async () => {
    if (!person) return;
    if (!window.confirm(`Delete ${person.name}? This cannot be undone.`)) return;
    await deletePerson(person.id);
    navigate(-1);
  };

  if (!person) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-600 text-sm">
        Loading...
      </div>
    );
  }

  const badge = BADGE_CONFIG[person.urgencyBadge];
  const lastInteraction = person.interactions[0];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0a0a0a] border-b border-white/8 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-zinc-400 p-1 -ml-1">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-white">{person.name}</h1>
            <span className="text-base">{flagEmoji(person.nationality)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[11px] px-1.5 py-0.5 rounded border font-mono ${platformBadgeClass(person.platform)}`}>
              {person.platform}
            </span>
            <span className={`text-[11px] px-1.5 py-0.5 rounded border font-mono flex items-center gap-1 ${badge.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
              {badge.label}
            </span>
          </div>
        </div>
        <button onClick={handleDelete} className="text-zinc-600 p-1 -mr-1">
          <Trash2 size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 'calc(120px + env(safe-area-inset-bottom))' }}>
        {/* Stats row */}
        <div className="px-4 pt-4 grid grid-cols-4 gap-2">
          {[
            ['Age', person.age],
            ['Height', person.heightCm ? `${person.heightCm}cm` : null],
            ['Rating', person.attractiveness?.toFixed(1)],
            ['Contact', formatDaysAgo(person.lastContactDate)],
          ].map(([label, val]) => (
            <div key={label as string} className="bg-[#141414] border border-white/8 rounded-lg p-2 text-center">
              <div className="font-mono text-sm text-white">{val ?? '—'}</div>
              <div className="text-[10px] text-zinc-600">{label as string}</div>
            </div>
          ))}
        </div>

        {/* Status */}
        <div className="px-4 mt-3">
          <select
            className="w-full bg-[#141414] border border-white/8 rounded-lg px-3 py-2 text-sm text-white"
            value={person.status}
            onChange={async (e) => {
              await updatePerson(person.id, { status: e.target.value as any });
              load();
            }}
          >
            {Object.entries(STATUS_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>

        {/* Flags */}
        <div className="px-4 mt-4 space-y-2">
          {person.dealBreakers.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {person.dealBreakers.map((f) => (
                <span key={f} className="text-[11px] px-2 py-1 rounded-full bg-red-900/30 text-red-400 border border-red-500/20">
                  {f.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          )}
          {person.greenFlags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {person.greenFlags.map((f) => (
                <span key={f} className="text-[11px] px-2 py-1 rounded-full bg-green-900/30 text-green-400 border border-green-500/20">
                  {f.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* AI Interest */}
        {lastInteraction?.aiInterestScore !== undefined && lastInteraction.aiInterestScore !== null && (
          <div className="px-4 mt-4">
            <div className="bg-[#141414] border border-white/8 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-zinc-500">AI Interest Assessment</span>
                <span className="font-mono text-lg font-bold text-white">
                  {lastInteraction.aiInterestScore.toFixed(1)}/10
                </span>
              </div>
              <div className="h-1 bg-zinc-800 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-zinc-500 to-white"
                  style={{ width: `${(lastInteraction.aiInterestScore / 10) * 100}%` }}
                />
              </div>
              {lastInteraction.aiInterestReason && (
                <p className="text-xs text-zinc-400 italic">{lastInteraction.aiInterestReason}</p>
              )}
            </div>
          </div>
        )}

        {/* Follow-up */}
        <div className="px-4 mt-4">
          <p className="text-xs text-zinc-500 mb-2">Follow-up</p>
          <FollowUpBlock person={person} onUpdate={load} />
        </div>

        {/* Date Notes */}
        <div className="px-4 mt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-zinc-500">Date notes</p>
            <button
              className="text-[11px] text-zinc-600 underline underline-offset-2"
              onClick={() => setEditingNotes((v) => !v)}
            >
              {editingNotes ? 'Cancel' : 'Edit'}
            </button>
          </div>
          {editingNotes ? (
            <div className="space-y-2">
              <textarea
                className="w-full bg-[#141414] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 min-h-[80px] resize-none"
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
              />
              <button
                className="text-xs bg-white text-black px-3 py-1.5 rounded font-medium"
                onClick={handleSaveNotes}
              >
                Save
              </button>
            </div>
          ) : (
            <div className="bg-[#141414] border border-white/8 rounded-lg p-3">
              <p className="text-xs text-zinc-300 whitespace-pre-wrap">
                {person.dateNotes || <span className="text-zinc-600">No notes yet.</span>}
              </p>
            </div>
          )}
        </div>

        {/* Follow-up suggestion */}
        <div className="px-4 mt-4">
          {suggestion ? (
            <div className="bg-[#141414] border border-white/8 rounded-lg p-3">
              <p className="text-[11px] text-zinc-500 mb-1">Suggested message</p>
              <p className="text-sm text-zinc-200">{suggestion}</p>
              <button
                className="mt-2 text-[11px] text-zinc-600 underline underline-offset-2"
                onClick={() => navigator.clipboard.writeText(suggestion)}
              >
                Copy
              </button>
            </div>
          ) : (
            <button
              className="w-full flex items-center justify-center gap-2 border border-white/10 text-zinc-400 py-2.5 rounded-lg text-sm"
              onClick={handleSuggest}
              disabled={loadingSuggestion}
            >
              <MessageSquare size={14} />
              {loadingSuggestion ? 'Generating...' : 'Suggest follow-up message'}
            </button>
          )}
        </div>

        {/* Timeline */}
        <div className="px-4 mt-4 mb-4">
          <p className="text-xs text-zinc-500 mb-2">Timeline</p>
          <InteractionTimeline interactions={person.interactions} />
        </div>
      </div>

      {/* Action bar */}
      <div className="fixed left-0 right-0 bg-[#0a0a0a] border-t border-white/8 px-4 py-3 flex gap-2 z-10"
        style={{ bottom: 'calc(56px + env(safe-area-inset-bottom))' }}
      >
        <ActionBtn icon={<Mic size={16} />} label="Voice" onClick={() => setSheet('voice')} />
        <ActionBtn icon={<Image size={16} />} label="Screenshot" onClick={() => setSheet('screenshot')} />
        <ActionBtn icon={<Plus size={16} />} label="Log" onClick={() => setSheet('manual')} />
        <ActionBtn icon={<MessageSquare size={16} />} label="Suggest" onClick={handleSuggest} />
      </div>

      {/* Bottom sheet */}
      {sheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSheet(null)} />
          <div className="relative bg-[#141414] border-t border-white/10 rounded-t-2xl p-5 pb-10 max-h-[85vh] overflow-y-auto">
            {sheet === 'voice' && (
              <>
                <h2 className="text-base font-semibold text-white mb-4">Voice memo</h2>
                <VoiceMemo
                  defaultPersonId={person.id}
                  onSaved={() => { setSheet(null); load(); }}
                  onClose={() => setSheet(null)}
                />
              </>
            )}
            {sheet === 'screenshot' && (
              <>
                <h2 className="text-base font-semibold text-white mb-4">Upload conversation</h2>
                <ScreenshotUpload
                  personId={person.id}
                  platform={person.platform}
                  onSaved={() => { setSheet(null); load(); }}
                  onClose={() => setSheet(null)}
                />
              </>
            )}
            {sheet === 'manual' && (
              <>
                <h2 className="text-base font-semibold text-white mb-4">Log interaction</h2>
                <textarea
                  className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 min-h-[100px] resize-none mb-3"
                  placeholder="What happened? How did it go?"
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                />
                <button
                  className="w-full bg-white text-black py-3 rounded-lg text-sm font-semibold"
                  onClick={handleManualLog}
                >
                  Save
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ActionBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      className="flex-1 flex flex-col items-center gap-1 py-2 text-zinc-400 active:text-white transition-colors"
      onClick={onClick}
    >
      {icon}
      <span className="text-[10px]">{label}</span>
    </button>
  );
}
