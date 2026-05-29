import { FormEvent, useEffect, useState } from 'react';

const ANIMALS = ['Tiger', 'Fox', 'Panda', 'Wolf'];
const COLORS = ['Blue', 'Red', 'Green', 'Purple'];

const createUsername = () =>
  `${COLORS[Math.floor(Math.random() * COLORS.length)]}${
    ANIMALS[Math.floor(Math.random() * ANIMALS.length)]
  }${Math.floor(Math.random() * 100)}`;

export function useAnonymousUser(onStatus: (message: string) => void) {
  const [username, setUsername] = useState('');
  const [draftUsername, setDraftUsername] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);

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
    const nextName = draftUsername.trim();
    if (!nextName) return;

    setUsername(nextName);
    localStorage.setItem('anon-username', nextName);
    setIsEditingName(false);
    onStatus('Username updated for new messages.');
  };

  return {
    username,
    draftUsername,
    isEditingName,
    setDraftUsername,
    setIsEditingName,
    saveUsername,
  };
}
