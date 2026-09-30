import { useState, useEffect } from 'react';
import { get, set } from 'idb-keyval';

export function usePersistentState<T>(key: string, initialValue: T) {
  const [state, setState] = useState<T>(initialValue);
  const [isReady, setIsReady] = useState(false);

  // Load from IndexedDB on mount
  useEffect(() => {
    get(key).then((val) => {
      if (val !== undefined) {
        setState(val as T);
      }
      setIsReady(true);
    }).catch((err) => {
      console.error('Failed to load state from IndexedDB:', err);
      setIsReady(true);
    });
  }, [key]);

  // Save to IndexedDB on state change
  useEffect(() => {
    if (isReady) {
      set(key, state).catch((err) => {
        console.error('Failed to save state to IndexedDB:', err);
      });
    }
  }, [state, isReady, key]);

  return [state, setState, isReady] as const;
}
