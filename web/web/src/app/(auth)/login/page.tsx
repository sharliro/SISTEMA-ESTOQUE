'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { setToken } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<{ accessToken: string }>('/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      setToken(data.accessToken);
      router.replace('/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha no login';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="logo">
          <span className="logo-mark">S C E</span>
          <span className="logo-text">| GTIC</span>
        </div>
        <p className="logo-subtitle">Sistema de Controle de Estoque</p>
        <h1>Entrar</h1>
        <p>Acesse o painel do estoque</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              placeholder="admin@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              placeholder="********"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {error ? <span className="error">{error}</span> : null}
          <button type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
