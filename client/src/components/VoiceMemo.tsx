import { useRef, useState, useEffect } from 'react';
import { Mic, Square, Check, X } from 'lucide-react';
import { sendVoiceMemo, applyVoiceMemo, getPeople } from '../lib/api';
import type { Person, VoiceMemoResult } from '../lib/types';

interface Props {
  onSaved: () => void;
  onClose: () => void;
  defaultPersonId?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecognition = any;

// Bar heights cycle through these percentages for a natural-looking wave
const BAR_CYCLES = [0.3, 0.5, 0.8, 0.6, 1.0, 0.7, 0.4, 0.9, 0.5, 0.7,
                   0.3, 0.6, 1.0, 0.4, 0.8, 0.5, 0.3, 0.9, 0.6, 0.4];

function Waveform({ active }: { active: boolean }) {
  return (
    <div className="w-full h-16 bg-zinc-900 rounded-lg flex items-end justify-center gap-[3px] px-4 py-2"
      style={{ opacity: active ? 1 : 0.3, transition: 'opacity 0.3s' }}
    >
      {BAR_CYCLES.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm bg-white"
          style={{
            height: active ? `${h * 100}%` : '15%',
            animation: active ? `waveBar 0.${6 + (i % 4)}s ease-in-out ${(i * 0.05).toFixed(2)}s infinite alternate` : 'none',
            transition: 'height 0.3s',
          }}
        />
      ))}
    </div>
  );
}

export default function VoiceMemo({ onSaved, onClose, defaultPersonId }: Props) {
  const [phase, setPhase] = useState<'record' | 'processing' | 'confirm'>('record');
  const [recording, setRecording] = useState(false);
  const [result, setResult] = useState<VoiceMemoResult | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState(defaultPersonId ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const recognitionRef = useRef<AnyRecognition>(null);
  const fullTranscriptRef = useRef('');
  const stoppedByUserRef = useRef(false);

  useEffect(() => {
    getPeople(true).then(setPeople).catch(() => {});
    return () => { recognitionRef.current?.abort(); };
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SpeechRecognitionAPI = typeof window !== 'undefined'
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

  const processTranscript = async (transcript: string) => {
    if (!transcript.trim()) {
      setError('No speech detected. Try again.');
      setRecording(false);
      return;
    }
    setRecording(false);
    setPhase('processing');
    setError('');
    try {
      const data = await sendVoiceMemo(transcript.trim(), selectedPersonId || undefined);
      setResult(data);
      setPhase('confirm');
    } catch {
      setError('Failed to process. Check your API key.');
      setPhase('record');
    }
  };

  const startRecording = () => {
    if (!SpeechRecognitionAPI) {
      setError('Speech recognition not supported. Try Safari on iOS or Chrome.');
      return;
    }

    setError('');
    fullTranscriptRef.current = '';
    stoppedByUserRef.current = false;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (e: any) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          fullTranscriptRef.current += e.results[i][0].transcript + ' ';
        }
      }
    };

    recognition.onend = () => {
      if (stoppedByUserRef.current) {
        processTranscript(fullTranscriptRef.current);
      }
    };

    recognition.onerror = (e: any) => {
      if (e.error === 'no-speech') return;
      setError(`Mic error: ${e.error}`);
      setRecording(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setRecording(true);
  };

  const stopRecording = () => {
    stoppedByUserRef.current = true;
    recognitionRef.current?.stop();
    // processTranscript is called from recognition.onend once results are flushed
  };

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    try {
      await applyVoiceMemo({
        extracted: result.extracted,
        personId: selectedPersonId || undefined,
        transcript: result.transcript,
      });
      onSaved();
    } catch {
      setError('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {phase === 'record' && (
        <>
          <div className="space-y-2">
            <label className="text-xs text-zinc-500">Update existing person (or leave blank for new)</label>
            <select
              className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
              value={selectedPersonId}
              onChange={(e) => setSelectedPersonId(e.target.value)}
            >
              <option value="">— New person —</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <Waveform active={recording} />

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            className={`w-full flex items-center justify-center gap-3 py-5 rounded-xl font-semibold text-sm transition-colors ${
              recording ? 'bg-red-500 text-white' : 'bg-white text-black'
            }`}
            onClick={recording ? stopRecording : startRecording}
          >
            {recording ? (
              <><Square size={18} /> Stop recording</>
            ) : (
              <><Mic size={18} /> Start recording</>
            )}
          </button>

          <p className="text-[11px] text-zinc-600 text-center">
            Speak naturally — say a name, platform, notes, follow-up date
          </p>
        </>
      )}

      {phase === 'processing' && (
        <div className="text-center py-8 space-y-2">
          <div className="text-2xl animate-pulse">🧠</div>
          <p className="text-sm text-zinc-400">Claude is extracting info...</p>
        </div>
      )}

      {phase === 'confirm' && result && (
        <div className="space-y-3">
          <div className="bg-zinc-900 rounded-lg p-3">
            <p className="text-[11px] text-zinc-500 mb-1">Transcript</p>
            <p className="text-xs text-zinc-300">{result.transcript}</p>
          </div>

          <div className="bg-zinc-900 rounded-lg p-3 space-y-1">
            <p className="text-[11px] text-zinc-500 mb-1">Ready to save</p>
            {selectedPersonId ? (
              <p className="text-xs font-mono text-green-400">
                ✓ Update: {people.find(p => p.id === selectedPersonId)?.name ?? 'Selected person'}
              </p>
            ) : (
              <p className="text-xs font-mono text-green-400">
                + New person: {result.extracted.person?.name ?? result.extracted.personNameHint ?? 'Unknown'}
              </p>
            )}
            {result.extracted.person?.platform && !selectedPersonId && (
              <p className="text-xs text-zinc-400">Platform: {result.extracted.person.platform}</p>
            )}
            {result.extracted.person?.age && (
              <p className="text-xs text-zinc-400">Age: {result.extracted.person.age}</p>
            )}
            {result.extracted.person?.dateNotes && (
              <p className="text-xs text-zinc-400">Notes: {result.extracted.person.dateNotes}</p>
            )}
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex gap-2">
            <button
              className="flex-1 flex items-center justify-center gap-2 bg-white text-black py-3 rounded-lg text-sm font-semibold"
              onClick={handleSave}
              disabled={saving}
            >
              <Check size={16} /> {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              className="flex items-center justify-center px-4 bg-zinc-900 border border-white/10 text-zinc-400 rounded-lg"
              onClick={onClose}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
