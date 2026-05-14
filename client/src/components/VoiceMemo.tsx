import { useRef, useState, useEffect } from 'react';
import { Mic, Square, Check, X } from 'lucide-react';
import { sendVoiceMemo, applyVoiceMemo, getPeople } from '../lib/api';
import type { Person, VoiceMemoResult } from '../lib/types';

interface Props {
  onSaved: () => void;
  onClose: () => void;
  defaultPersonId?: string;
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export default function VoiceMemo({ onSaved, onClose, defaultPersonId }: Props) {
  const [phase, setPhase] = useState<'record' | 'processing' | 'confirm'>('record');
  const [recording, setRecording] = useState(false);
  const [result, setResult] = useState<VoiceMemoResult | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState(defaultPersonId ?? '');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const fullTranscriptRef = useRef('');

  useEffect(() => {
    getPeople(true).then(setPeople).catch(() => {});
  }, []);

  const SpeechRecognitionAPI =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  const startRecording = () => {
    if (!SpeechRecognitionAPI) {
      setError('Speech recognition not supported in this browser. Try Chrome or Safari.');
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    fullTranscriptRef.current = '';

    recognition.onresult = (e) => {
      let interim = '';
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const text = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          final += text + ' ';
          fullTranscriptRef.current += text + ' ';
        } else {
          interim += text;
        }
      }
      setLiveTranscript(fullTranscriptRef.current + interim);
    };

    recognition.onerror = (e) => {
      if (e.error !== 'no-speech') setError(`Mic error: ${e.error}`);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setLiveTranscript('');
    setRecording(true);
  };

  const stopRecording = async () => {
    recognitionRef.current?.stop();
    setRecording(false);

    const transcript = fullTranscriptRef.current.trim();
    if (!transcript) {
      setError('No speech detected. Try again.');
      return;
    }

    setPhase('processing');
    try {
      const data = await sendVoiceMemo(transcript, selectedPersonId || undefined);
      setResult(data);
      setPhase('confirm');
    } catch {
      setError('Failed to process. Check your API key.');
      setPhase('record');
    }
  };

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    try {
      await applyVoiceMemo({
        extracted: result.extracted,
        personId: selectedPersonId || undefined,
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

          {/* Live transcript display */}
          <div className={`min-h-[64px] bg-zinc-900 rounded-lg px-3 py-2 text-xs text-zinc-400 transition-opacity ${recording ? 'opacity-100' : 'opacity-40'}`}>
            {liveTranscript || (recording ? 'Listening...' : 'Transcript will appear here')}
          </div>

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
            <p className="text-[11px] text-zinc-500 mb-1">Extracted</p>
            <p className="text-xs font-mono text-green-400">
              {result.extracted.action === 'create' ? '+ New person' : '↻ Update'}:{' '}
              {result.extracted.person?.name ?? result.extracted.personNameHint}
            </p>
            {result.extracted.person?.platform && (
              <p className="text-xs text-zinc-400">Platform: {result.extracted.person.platform}</p>
            )}
            {result.extracted.person?.age && (
              <p className="text-xs text-zinc-400">Age: {result.extracted.person.age}</p>
            )}
            {result.extracted.person?.dateNotes && (
              <p className="text-xs text-zinc-400">Notes: {result.extracted.person.dateNotes}</p>
            )}
            {result.extracted.interactionSummary && (
              <p className="text-xs text-zinc-400">Interaction: {result.extracted.interactionSummary}</p>
            )}
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex gap-2">
            <button
              className="flex-1 flex items-center justify-center gap-2 bg-white text-black py-3 rounded-lg text-sm font-semibold"
              onClick={handleSave}
              disabled={saving}
            >
              <Check size={16} /> Save
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
