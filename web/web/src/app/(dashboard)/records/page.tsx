'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

type Movement = {
  id: string;
  type: 'IN' | 'OUT';
  quantity: number;
  createdAt: string;
  product: {
    code: number;
    name: string;
    manufacturer: string | null;
    model: string | null;
    nfe: string | null;
    dtNfe: string | null;
    dtInclu: string | null;
    horaInclu: string | null;
    nchagpc: string | null;
    sector: string | null;
    unit: string | null;
  };
  user: { name: string | null; matricula: string | null };
};

type Product = {
  name: string;
  manufacturer: string | null;
  model: string | null;
};

export default function RecordsPage() {
  const [activeTab, setActiveTab] = useState<'IN' | 'OUT'>('IN');
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    name: '',
    manufacturer: '',
    model: '',
    user: '',
    matricula: '',
    from: '',
    to: '',
  });
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [manufacturerSuggestions, setManufacturerSuggestions] = useState<string[]>([]);
  const [modelSuggestions, setModelSuggestions] = useState<string[]>([]);

  const loadSuggestions = async () => {
    try {
      const products = await apiFetch<Product[]>('/products');
      const names = Array.from(new Set(products.map((p) => p.name))).sort((a, b) =>
        a.localeCompare(b),
      );
      const manufacturers = Array.from(
        new Set(products.map((p) => p.manufacturer).filter((v): v is string => !!v)),
      ).sort((a, b) => a.localeCompare(b));
      const models = Array.from(
        new Set(products.map((p) => p.model).filter((v): v is string => !!v)),
      ).sort((a, b) => a.localeCompare(b));
      setNameSuggestions(names);
      setManufacturerSuggestions(manufacturers);
      setModelSuggestions(models);
    } catch (err) {
      console.error(err);
    }
  };

  const loadMovements = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.set('type', activeTab);
      params.set('limit', '200');
      if (filters.from) {
        params.set('from', filters.from);
      }
      if (filters.to) {
        params.set('to', filters.to);
      }
      const data = await apiFetch<Movement[]>(`/stock/movements?${params.toString()}`);
      const filtered = data.filter((item) => {
        const matchName = filters.name
          ? item.product.name.toLowerCase().includes(filters.name.toLowerCase())
          : true;
        const matchManufacturer = filters.manufacturer
          ? (item.product.manufacturer || '')
              .toLowerCase()
              .includes(filters.manufacturer.toLowerCase())
          : true;
        const matchModel = filters.model
          ? (item.product.model || '').toLowerCase().includes(filters.model.toLowerCase())
          : true;
        const matchUser = filters.user
          ? (item.user?.name || '').toLowerCase().includes(filters.user.toLowerCase())
          : true;
        const matchMatricula = filters.matricula
          ? (item.user?.matricula || '')
              .toLowerCase()
              .includes(filters.matricula.toLowerCase())
          : true;
        return matchName && matchManufacturer && matchModel && matchUser && matchMatricula;
      });
      setMovements(filtered);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar registros';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuggestions();
  }, []);

  useEffect(() => {
    loadMovements();
  }, [activeTab]);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Registros</h1>
          <p>Consulta de entradas e saídas com filtros e busca.</p>
        </div>
      </header>

      <section className="form-card">
        <div className="tabs">
          <button
            type="button"
            className={activeTab === 'IN' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('IN')}
          >
            Entradas
          </button>
          <button
            type="button"
            className={activeTab === 'OUT' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('OUT')}
          >
            saídas
          </button>
        </div>

        <div className="grid-form">
          <label>
            Produto
            <input
              value={filters.name}
              onChange={(event) => setFilters({ ...filters, name: event.target.value })}
              list="record-products"
            />
          </label>
          <label>
            Fabricante
            <input
              value={filters.manufacturer}
              onChange={(event) =>
                setFilters({ ...filters, manufacturer: event.target.value })
              }
              list="record-manufacturers"
            />
          </label>
          <label>
            Modelo
            <input
              value={filters.model}
              onChange={(event) => setFilters({ ...filters, model: event.target.value })}
              list="record-models"
            />
          </label>
          <label>
            Usuario
            <input
              value={filters.user}
              onChange={(event) => setFilters({ ...filters, user: event.target.value })}
            />
          </label>
          <label>
            Matricula
            <input
              value={filters.matricula}
              onChange={(event) => setFilters({ ...filters, matricula: event.target.value })}
            />
          </label>
          <label>
            De
            <input
              type="date"
              value={filters.from}
              onChange={(event) => setFilters({ ...filters, from: event.target.value })}
            />
          </label>
          <label>
            Ate
            <input
              type="date"
              value={filters.to}
              onChange={(event) => setFilters({ ...filters, to: event.target.value })}
            />
          </label>
          <div className="actions">
            <button
              type="button"
              className="ghost"
              disabled={loading}
              onClick={loadMovements}
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </div>

        <datalist id="record-products">
          {nameSuggestions.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
        <datalist id="record-manufacturers">
          {manufacturerSuggestions.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
        <datalist id="record-models">
          {modelSuggestions.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
        {error ? <span className="error">{error}</span> : null}
      </section>

      <section className="table-card">
        <table>
          <thead>
            <tr>
              <th>Codigo</th>
              <th>Produto</th>
              <th>Tipo</th>
              <th>Fabricante</th>
              <th>Modelo</th>
              <th>NFE</th>
              <th>Data NFE</th>
              <th>Data inclusão</th>
              <th>Hora inclusão</th>
              <th>Quantidade</th>
              <th>NCHAGPC</th>
              <th>Setor</th>
              <th>Unidade</th>
              <th>Usuario</th>
              <th>Matricula</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {movements.length === 0 ? (
              <tr>
                <td colSpan={16}>Nenhum registro encontrado.</td>
              </tr>
            ) : (
              movements.map((item) => (
                <tr key={item.id}>
                  <td>{item.product.code}</td>
                  <td>{item.product.name}</td>
                  <td>{item.type === 'IN' ? 'Entrada' : 'Saida'}</td>
                  <td>{item.product.manufacturer || '-'}</td>
                  <td>{item.product.model || '-'}</td>
                  <td>{item.product.nfe || '-'}</td>
                  <td>
                    {item.product.dtNfe
                      ? new Date(item.product.dtNfe).toLocaleDateString('pt-BR')
                      : '-'}
                  </td>
                  <td>
                    {item.product.dtInclu
                      ? new Date(item.product.dtInclu).toLocaleDateString('pt-BR')
                      : '-'}
                  </td>
                  <td>{item.product.horaInclu || '-'}</td>
                  <td>{item.quantity}</td>
                  <td>{item.product.nchagpc || '-'}</td>
                  <td>{item.product.sector || '-'}</td>
                  <td>{item.product.unit || '-'}</td>
                  <td>{item.user?.name || '-'}</td>
                  <td>{item.user?.matricula || '-'}</td>
                  <td>{new Date(item.createdAt).toLocaleString('pt-BR')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
