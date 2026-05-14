import { useState } from 'react';
import type { Interaction } from '../lib/types';
import { platformBadgeClass } from '../lib/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  interactions: Interaction[];
}

function InteractionItem({ item }: { item: Interaction }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-white/8 rounded-lg p-3 bg-[#0f0f0f]">
      <div
        className="flex items-start justify-between gap-2 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded border ${platformBadgeClass(item.platform)}`}>
              {item.platform}
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">
              {new Date(item.date).toLocaleDateString()}
            </span>
            {item.aiInterestScore !== undefined && item.aiInterestScore !== null && (
              <span className="text-[11px] font-mono text-zinc-400">
                {item.aiInterestScore.toFixed(1)}/10
              </span>
            )}
          </div>
          {item.summary && (
            <p className="text-xs text-zinc-300">{item.summary}</p>
          )}
          {item.aiInterestReason && (
            <p className="text-[11px] text-zinc-500 mt-1 italic">{item.aiInterestReason}</p>
          )}
        </div>
        <button className="text-zinc-600 shrink-0">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 space-y-2">
          {item.rawChatText && (
            <pre className="text-[11px] text-zinc-400 whitespace-pre-wrap font-mono bg-black/30 p-2 rounded overflow-x-auto">
              {item.rawChatText}
            </pre>
          )}
          {item.screenshotUrls.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {item.screenshotUrls.map((url, i) => (
                <img key={i} src={url} alt="" className="h-40 rounded object-cover" />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function InteractionTimeline({ interactions }: Props) {
  if (interactions.length === 0) {
    return <p className="text-xs text-zinc-600 text-center py-4">No interactions logged yet.</p>;
  }

  return (
    <div className="space-y-2">
      {interactions.map((item) => (
        <InteractionItem key={item.id} item={item} />
      ))}
    </div>
  );
}
