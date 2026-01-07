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
      await apiFetch('/users', {
        method: 'POST',
        body: form,
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
          <h1>Usuarios</h1>
          <p>Somente administradores podem criar contas.</p>
        </div>
      </header>

      <section className="form-card">
        <h3>Novo usuario</h3>
        <form className="grid-form" onSubmit={handleSubmit}>
          <label>
            Nome
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </label>
          <label>
            Matricula
            <input
              value={form.matricula}
              onChange={(event) => setForm({ ...form, matricula: event.target.value })}
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required
            />
          </label>
          <label>
            Perfil
            <select
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
              <th>Acoes</th>
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
