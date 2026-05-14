import { useRef, useState } from 'react';
import { Image, Check, X } from 'lucide-react';
import { analyzeChat, createInteraction } from '../lib/api';
import type { ChatAnalysis } from '../lib/types';

interface Props {
  personId: string;
  platform: string;
  onSaved: () => void;
  onClose: () => void;
}

export default function ScreenshotUpload({ personId, platform, onSaved, onClose }: Props) {
  const [phase, setPhase] = useState<'input' | 'processing' | 'confirm'>('input');
  const [analysis, setAnalysis] = useState<ChatAnalysis | null>(null);
  const [textMode, setTextMode] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setPhase('processing');
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append('images', f));
    try {
      const result = await analyzeChat(fd);
      setAnalysis(result);
      setPhase('confirm');
    } catch {
      setError('Analysis failed');
      setPhase('input');
    }
  };

  const handleText = async () => {
    if (!pastedText.trim()) return;
    setPhase('processing');
    const fd = new FormData();
    fd.append('text', pastedText);
    try {
      const result = await analyzeChat(fd);
      setAnalysis(result);
      setPhase('confirm');
    } catch {
      setError('Analysis failed');
      setPhase('input');
    }
  };

  const handleSave = async () => {
    if (!analysis) return;
    setSaving(true);
    try {
      await createInteraction(personId, {
        platform,
        summary: analysis.conversationSummary,
        aiInterestScore: analysis.interestScore,
        aiInterestReason: analysis.interestReason,
        screenshotUrls: analysis.imageUrls,
        rawChatText: pastedText || undefined,
      } as any);
      onSaved();
    } catch {
      setError('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {phase === 'input' && (
        <>
          <div className="flex gap-2 mb-1">
            <button
              className={`text-xs px-3 py-1 rounded border ${!textMode ? 'border-white/30 text-white' : 'border-white/10 text-zinc-500'}`}
              onClick={() => setTextMode(false)}
            >
              Screenshots
            </button>
            <button
              className={`text-xs px-3 py-1 rounded border ${textMode ? 'border-white/30 text-white' : 'border-white/10 text-zinc-500'}`}
              onClick={() => setTextMode(true)}
            >
              Paste text
            </button>
          </div>

          {!textMode ? (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
              <button
                className="w-full border-2 border-dashed border-white/15 rounded-xl py-8 flex flex-col items-center gap-2 text-zinc-500 active:bg-white/5"
                onClick={() => fileRef.current?.click()}
              >
                <Image size={28} />
                <span className="text-sm">Tap to select screenshots</span>
                <span className="text-xs">From camera roll or files</span>
              </button>
            </>
          ) : (
            <>
              <textarea
                className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 min-h-[120px] resize-none"
                placeholder="Paste conversation text here..."
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
              />
              <button
                className="w-full bg-white text-black py-3 rounded-lg text-sm font-semibold"
                onClick={handleText}
              >
                Analyze
              </button>
            </>
          )}

          {error && <p className="text-xs text-red-400">{error}</p>}
        </>
      )}

      {phase === 'processing' && (
        <div className="text-center py-8 space-y-2">
          <div className="text-2xl animate-pulse">👁️</div>
          <p className="text-sm text-zinc-400">Claude is reading the conversation...</p>
        </div>
      )}

      {phase === 'confirm' && analysis && (
        <div className="space-y-3">
          <div className="bg-zinc-900 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-zinc-500">Interest Score</p>
              <span className="font-mono text-lg font-bold text-white">{analysis.interestScore.toFixed(1)}</span>
            </div>
            <p className="text-xs text-zinc-300">{analysis.conversationSummary}</p>
            <p className="text-[11px] text-zinc-500 italic">{analysis.interestReason}</p>
          </div>

          <div className="bg-zinc-900 rounded-lg p-3 space-y-1">
            <p className="text-[11px] text-zinc-500 mb-1">Signals</p>
            {[
              ['Initiates topics', analysis.signals.initiatesTopics],
              ['Asks questions', analysis.signals.asksQuestions],
              ['Suggests plans', analysis.signals.suggestsPlans],
            ].map(([label, val]) => (
              <div key={label as string} className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">{label as string}</span>
                <span className={`text-xs font-mono ${val ? 'text-green-400' : 'text-red-400'}`}>
                  {val ? 'yes' : 'no'}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">Reply length</span>
              <span className="text-xs font-mono text-zinc-300">{analysis.signals.replyLength}</span>
            </div>
          </div>

          {analysis.suggestedFollowUpAngle && (
            <div className="bg-zinc-900 rounded-lg p-3">
              <p className="text-[11px] text-zinc-500 mb-1">Follow-up angle</p>
              <p className="text-xs text-zinc-300">{analysis.suggestedFollowUpAngle}</p>
            </div>
          )}

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex gap-2">
            <button
              className="flex-1 flex items-center justify-center gap-2 bg-white text-black py-3 rounded-lg text-sm font-semibold"
              onClick={handleSave}
              disabled={saving}
            >
              <Check size={16} /> Add to timeline
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
