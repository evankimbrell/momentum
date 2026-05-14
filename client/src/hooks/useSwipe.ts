import { useRef, useState } from 'react';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}

export function useSwipe({ onSwipeLeft, onSwipeRight, threshold = 80 }: SwipeHandlers) {
  const startX = useRef<number | null>(null);
  const [offsetX, setOffsetX] = useState(0);
  const [swiping, setSwiping] = useState(false);

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setSwiping(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (startX.current === null) return;
    const delta = e.touches[0].clientX - startX.current;
    setOffsetX(Math.max(-120, Math.min(120, delta)));
  };

  const onTouchEnd = () => {
    if (offsetX >= threshold && onSwipeRight) onSwipeRight();
    else if (offsetX <= -threshold && onSwipeLeft) onSwipeLeft();
    setOffsetX(0);
    setSwiping(false);
    startX.current = null;
  };

  return { onTouchStart, onTouchMove, onTouchEnd, offsetX, swiping };
}
