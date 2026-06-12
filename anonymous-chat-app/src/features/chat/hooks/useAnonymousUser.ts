import { FormEvent, useCallback, useEffect, useState } from 'react';

const NAME_WORDS = ['Echo', 'Nova', 'Pixel', 'Comet', 'Spark', 'Cipher', 'Drift', 'Orbit'];
const NAME_TONES = ['Blue', 'Red', 'Green', 'Violet', 'Amber', 'Silver', 'Cyan', 'Indigo'];

const createUsername = () =>
  `${NAME_TONES[Math.floor(Math.random() * NAME_TONES.length)]}${
    NAME_WORDS[Math.floor(Math.random() * NAME_WORDS.length)]
  }${Math.floor(Math.random() * 100)}`;

export function useAnonymousUser(onStatus: (message: string) => void) {
  const [username, setUsername] = useState('');
  const [draftUsername, setDraftUsername] = useState('');

  const persistUsername = useCallback(
    (name: string, statusMessage: string) => {
      const nextName = name.trim();
      if (!nextName) return false;

      setUsername(nextName);
      setDraftUsername(nextName);
      localStorage.setItem('anon-username', nextName);
      onStatus(statusMessage);
      return true;
    },
    [onStatus]
  );

  useEffect(() => {
    let stored = localStorage.getItem('anon-username');
    if (!stored) {
      stored = createUsername();
      localStorage.setItem('anon-username', stored);
    }

    setUsername(stored);
    setDraftUsername(stored);
  }, []);

  const saveUsername = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    persistUsername(draftUsername, 'Name saved.');
  };

  const commitDraftUsername = () => {
    persistUsername(draftUsername, 'Name ready.');
  };

  const randomizeUsername = () => {
    persistUsername(createUsername(), 'Random name ready.');
  };

  return {
    username,
    draftUsername,
    setDraftUsername,
    saveUsername,
    commitDraftUsername,
    randomizeUsername,
  };
}
