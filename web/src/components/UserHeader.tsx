'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import LogoutButton from './LogoutButton';

type User = {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
};

export default function UserHeader() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    apiFetch<User>('/users/me')
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  if (!user) return null;

  return (
    <div className="user-info">
      <span>{user.name}</span>
      <LogoutButton />
    </div>
  );
}