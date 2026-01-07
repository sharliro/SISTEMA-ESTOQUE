'use client';

import { useRouter } from 'next/navigation';
import { clearToken } from '@/lib/auth';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    clearToken();
    router.replace('/login');
  };

  return (
    <button type="button" className="ghost logout" onClick={handleLogout}>
      Sair
    </button>
  );
}
