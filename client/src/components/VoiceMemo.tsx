import { useRef, useState, useEffect, useCallback } from 'react';
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

  // Waveform refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    getPeople(true).then(setPeople).catch(() => {});
    return () => {
      stopWaveform();
      recognitionRef.current?.abort();
    };
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SpeechRecognitionAPI = typeof window !== 'undefined'
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

  const stopWaveform = () => {
    cancelAnimationFrame(animFrameRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioCtxRef.current?.close().catch(() => {});
    streamRef.current = null;
    audioCtxRef.current = null;
    analyserRef.current = null;

    // Clear canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d')!;
    const data = new Uint8Array(analyser.frequencyBinCount);

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(data);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barW = canvas.width / data.length;
      data.forEach((v, i) => {
        const h = Math.max(2, (v / 255) * canvas.height);
        const alpha = 0.25 + (v / 255) * 0.75;
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.beginPath();
        ctx.roundRect(i * barW + 1, canvas.height - h, barW - 2, h, 2);
        ctx.fill();
      });
    };
    draw();
  }, []);

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

  const startRecording = async () => {
    if (!SpeechRecognitionAPI) {
      setError('Speech recognition not supported. Try Safari on iOS or Chrome.');
      return;
    }

    setError('');
    fullTranscriptRef.current = '';
    stoppedByUserRef.current = false;

    // Acquire mic FIRST so iOS shares the audio session with SpeechRecognition
    // (if getUserMedia runs after recognition.start(), iOS may deny it)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;
      drawWaveform();
    } catch {
      // Waveform unavailable — canvas stays dim, transcription still works
    }

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
    stopWaveform();
    // processTranscript is called from recognition.onend once results are flushed
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

          <canvas
            ref={canvasRef}
            width={320}
            height={64}
            className="w-full rounded-lg bg-zinc-900 transition-opacity duration-300"
            style={{ opacity: recording ? 1 : 0.3 }}
          />

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
