'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { apiFetch } from '@/lib/api';

type User = {
  id: string;
  name: string;
  email: string;
  matricula: string | null;
  role: 'ADMIN' | 'USER';
  createdAt: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    matricula: '',
    password: '',
    role: 'USER',
  });

  const loadUsers = async () => {
    try {
      const data = await apiFetch<User[]>('/users');
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      // normalize and enforce domain for email
      let finalEmail = form.email ? form.email.trim().toLowerCase() : undefined;
      if (finalEmail) {
        if (finalEmail.includes('@')) {
          if (!finalEmail.endsWith('@emserh.ma.gov.br')) {
            setError('O email deve usar o domínio @emserh.ma.gov.br');
            setLoading(false);
            return;
          }
        } else {
          const localPart = finalEmail.toLowerCase();
          if (!/^[a-z0-9._-]+$/.test(localPart)) {
            setError('Digite apenas o usuário do email (ex: joao.parga)');
            setLoading(false);
            return;
          }
          finalEmail = `${localPart}@emserh.ma.gov.br`;
        }
      }

      const payload = { ...form, name: form.name.trim(), email: finalEmail };
      await apiFetch('/users', {
        method: 'POST',
        body: payload,
      });
      setForm({ name: '', email: '', matricula: '', password: '', role: 'USER' });
      await loadUsers();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar usuario';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Deseja remover este usuario?')) {
      return;
    }
    setLoading(true);
    setError('');
    try {
      await apiFetch(`/users/${id}`, { method: 'DELETE' });
      await loadUsers();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao remover usuario';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Usuários</h1>
          <p>Somente administradores podem criar contas.</p>
        </div>
      </header>

      <section className="form-card">
        <h3>Novo usuario</h3>
        <form className="inline-form-row" onSubmit={handleSubmit}>
          <label>
            Nome
            <input className="select-control"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value.toUpperCase() })}
              required
            />
          </label>
          <label>
            Email
            <div className="input-with-suffix">
              <input className="select-control"
                type="text"
                placeholder="JOAO.PARGA"
                value={form.email}
                onChange={(event) => {
                  // Always display only the local-part (username) in uppercase.
                  let v = event.target.value.toUpperCase().replace(/\s/g, '');
                  const atIdx = v.indexOf('@');
                  if (atIdx !== -1) {
                    v = v.slice(0, atIdx);
                  }
                  setForm({ ...form, email: v });
                }}
                required
              />
              <span className="suffix">@emserh.ma.gov.br</span>
            </div>
            <small className="muted">Digite apenas o usuário; o domínio <strong>@emserh.ma.gov.br</strong> será anexado automaticamente.</small>
          </label>
          <label>
            Matricula
            <input className="select-control"
              value={form.matricula}
              onChange={(event) => setForm({ ...form, matricula: event.target.value.toUpperCase() })}
            />
          </label>
          <label>
            Senha
            <input className="select-control"
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required
            />
          </label>
          <label>
            Perfil
            <select className="select-control"
              value={form.role}
              onChange={(event) =>
                setForm({ ...form, role: event.target.value as 'ADMIN' | 'USER' })
              }
            >
              <option value="USER">Usuario</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>
          {error ? <span className="error">{error}</span> : null}
          <button className="primary" type="submit" disabled={loading}>
            {loading ? 'Salvando...' : 'Criar usuario'}
          </button>
        </form>
      </section>

      <section className="table-card">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Matricula</th>
              <th>Perfil</th>
              <th>Criado em</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={6}>Nenhum usuario cadastrado.</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.matricula || '-'}</td>
                  <td>{user.role}</td>
                  <td>{new Date(user.createdAt).toLocaleDateString('pt-BR')}</td>
                  <td>
                    <button
                      type="button"
                      className="ghost danger"
                      disabled={loading}
                      onClick={() => handleDelete(user.id)}
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
