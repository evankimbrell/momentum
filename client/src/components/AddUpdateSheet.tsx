import { useRef, useState } from 'react';
import { X, ImagePlus } from 'lucide-react';
import VoiceMemo from './VoiceMemo';
import { uploadPersonPhotos } from '../lib/api';

interface Props {
  onClose: () => void;
  onSaved: () => void;
}

export default function AddUpdateSheet({ onClose, onSaved }: Props) {
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const combined = [...photos, ...files].slice(0, 5);
    setPhotos(combined);
    setPreviews(combined.map((f) => URL.createObjectURL(f)));
  };

  const removePhoto = (i: number) => {
    URL.revokeObjectURL(previews[i]);
    const newPhotos = photos.filter((_, idx) => idx !== i);
    const newPreviews = previews.filter((_, idx) => idx !== i);
    setPhotos(newPhotos);
    setPreviews(newPreviews);
  };

  const handleSaved = async (personId: string) => {
    if (photos.length > 0) {
      try { await uploadPersonPhotos(personId, photos); } catch { /* non-fatal */ }
    }
    previews.forEach((u) => URL.revokeObjectURL(u));
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#141414] border-t border-white/10 rounded-t-2xl p-5 pb-10 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white">Add person</h2>
          <button className="text-zinc-500 p-1" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Photo picker */}
        <div className="mb-5">
          <p className="text-xs text-zinc-500 mb-2">Profile photos (up to 5)</p>
          <div className="flex gap-2 flex-wrap">
            {previews.map((src, i) => (
              <div key={i} className="relative w-16 h-16">
                <img src={src} className="w-16 h-16 rounded-lg object-cover" alt="" />
                <button
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-zinc-700 rounded-full flex items-center justify-center text-white"
                  onClick={() => removePhoto(i)}
                >
                  <X size={10} />
                </button>
              </div>
            ))}
            {photos.length < 5 && (
              <button
                className="w-16 h-16 rounded-lg border border-white/10 bg-zinc-900 flex flex-col items-center justify-center gap-1 text-zinc-600"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus size={18} />
                <span className="text-[10px]">Add</span>
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <VoiceMemo
          onSaved={handleSaved}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
