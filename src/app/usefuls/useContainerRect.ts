import { useEffect, useState, useRef, MutableRefObject } from 'react';

export const useContainerRect = <T extends HTMLElement>() => {
  const ref = useRef<T | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setRect(entry.contentRect as DOMRect);
      }
    });

    observer.observe(ref.current);

    setRect(ref.current.getBoundingClientRect());

    return () => observer.disconnect();
  }, []);

  return { ref: ref as MutableRefObject<T | null>, rect };
};
