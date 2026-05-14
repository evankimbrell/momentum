import { X } from 'lucide-react';
import VoiceMemo from './VoiceMemo';

interface Props {
  onClose: () => void;
  onSaved: () => void;
}

export default function AddUpdateSheet({ onClose, onSaved }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#141414] border-t border-white/10 rounded-t-2xl p-5 pb-10 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white">Voice memo</h2>
          <button className="text-zinc-500 p-1" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <VoiceMemo
          onSaved={() => { onSaved(); onClose(); }}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
