import { useState, useCallback } from 'react';

const STORAGE_KEY = 'pothole_reporter_name';

export function useUserName() {
  const [name, setNameState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });

  const setName = useCallback((newName) => {
    setNameState(newName);
    try {
      localStorage.setItem(STORAGE_KEY, newName);
    } catch { /* ignore */ }
  }, []);

  return [name, setName];
}
