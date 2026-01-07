'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { apiFetch } from '@/lib/api';

type Product = {
  id: string;
  name: string;
  manufacturer: string | null;
  model: string | null;
  quantity: number;
};

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

export default function MovementsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [entryForm, setEntryForm] = useState({
    name: '',
    manufacturer: '',
    model: '',
    nfe: '',
    dtNfe: '',
    quantity: 1,
    nchagpc: '',
    sector: '',
    unit: '',
  });
  const [filters, setFilters] = useState({
    name: '',
    manufacturer: '',
    model: '',
  });
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [manufacturerSuggestions, setManufacturerSuggestions] = useState<string[]>([]);
  const [modelSuggestions, setModelSuggestions] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'entry' | 'exit'>('entry');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      const productData = await apiFetch<Product[]>('/products');
      setProducts(productData);
      const uniqueNames = Array.from(
        new Set(productData.map((item) => item.name).filter(Boolean)),
      ).sort((a, b) => a.localeCompare(b));
      const uniqueManufacturers = Array.from(
        new Set(productData.map((item) => item.manufacturer).filter((value): value is string => !!value)),
      ).sort((a, b) => a.localeCompare(b));
      const uniqueModels = Array.from(
        new Set(productData.map((item) => item.model).filter((value): value is string => !!value)),
      ).sort((a, b) => a.localeCompare(b));
      setNameSuggestions(uniqueNames);
      setManufacturerSuggestions(uniqueManufacturers);
      setModelSuggestions(uniqueModels);
      const movementData = await apiFetch<Movement[]>('/stock/movements?limit=20');
      setMovements(movementData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredProducts = products.filter((item) => {
    const matchName = filters.name
      ? item.name.toLowerCase().includes(filters.name.toLowerCase())
      : true;
    const matchManufacturer = filters.manufacturer
      ? (item.manufacturer || '').toLowerCase().includes(filters.manufacturer.toLowerCase())
      : true;
    const matchModel = filters.model
      ? (item.model || '').toLowerCase().includes(filters.model.toLowerCase())
      : true;
    return matchName && matchManufacturer && matchModel;
  });

  const handleEntry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await apiFetch('/stock/entry/new', {
        method: 'POST',
        body: {
          name: entryForm.name,
          manufacturer: entryForm.manufacturer || undefined,
          model: entryForm.model || undefined,
          nfe: entryForm.nfe || undefined,
          dtNfe: entryForm.dtNfe || undefined,
          quantity: Number(entryForm.quantity) || 1,
          nchagpc: entryForm.nchagpc || undefined,
          sector: entryForm.sector || undefined,
          unit: entryForm.unit || undefined,
        },
      });
      setEntryForm({
        name: '',
        manufacturer: '',
        model: '',
        nfe: '',
        dtNfe: '',
        quantity: 1,
        nchagpc: '',
        sector: '',
        unit: '',
      });
      await loadData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao registrar entrada';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleMovement = async (type: 'entry' | 'exit') => {
    if (!productId) {
      setError('Selecione um produto');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await apiFetch(`/stock/${type}`, {
        method: 'POST',
        body: { productId, quantity: Number(quantity) },
      });
      setQuantity(1);
      await loadData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao registrar';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Registros</h1>
          <p>Entrada cadastra o item no estoque. Saida seleciona o item correto.</p>
        </div>
      </header>

      <section className="form-card">
        <div className="tabs">
          <button
            type="button"
            className={activeTab === 'entry' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('entry')}
          >
            Entrada
          </button>
          <button
            type="button"
            className={activeTab === 'exit' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('exit')}
          >
            Saida
          </button>
        </div>

        {activeTab === 'entry' ? (
          <>
            <h3>Entrada (cadastro do item)</h3>
            <form className="grid-form" onSubmit={handleEntry}>
              <label>
                Produto
                <input
                  value={entryForm.name}
                  onChange={(event) => setEntryForm({ ...entryForm, name: event.target.value })}
                  list="product-names"
                  required
                />
              </label>
              <label>
                Fabricante
                <input
                  value={entryForm.manufacturer}
                  onChange={(event) =>
                    setEntryForm({ ...entryForm, manufacturer: event.target.value })
                  }
                  list="manufacturer-names"
                />
              </label>
              <label>
                Modelo
                <input
                  value={entryForm.model}
                  onChange={(event) => setEntryForm({ ...entryForm, model: event.target.value })}
                  list="model-names"
                />
              </label>
              <label>
                NFE
                <input
                  value={entryForm.nfe}
                  onChange={(event) => setEntryForm({ ...entryForm, nfe: event.target.value })}
                />
              </label>
              <label>
                Data NFE
                <input
                  type="date"
                  value={entryForm.dtNfe}
                  onChange={(event) => setEntryForm({ ...entryForm, dtNfe: event.target.value })}
                />
              </label>
              <label>
                Quantidade
                <input
                  type="number"
                  min={1}
                  value={entryForm.quantity}
                  onChange={(event) =>
                    setEntryForm({ ...entryForm, quantity: Number(event.target.value) })
                  }
                />
              </label>
              <label>
                NCHAGPC
                <input
                  value={entryForm.nchagpc}
                  onChange={(event) =>
                    setEntryForm({ ...entryForm, nchagpc: event.target.value })
                  }
                />
              </label>
              <label>
                Setor
                <input
                  value={entryForm.sector}
                  onChange={(event) =>
                    setEntryForm({ ...entryForm, sector: event.target.value })
                  }
                />
              </label>
              <label>
                Unidade
                <input
                  value={entryForm.unit}
                  onChange={(event) => setEntryForm({ ...entryForm, unit: event.target.value })}
                />
              </label>
              {error ? <span className="error">{error}</span> : null}
              <button className="primary" type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Registrar entrada'}
              </button>
            </form>
          </>
        ) : (
          <>
            <h3>Saida (selecionar item)</h3>
            <div className="grid-form">
              <label>
                Filtrar por produto
                <input
                  value={filters.name}
                  onChange={(event) => setFilters({ ...filters, name: event.target.value })}
                  placeholder="Nome do produto"
                  list="product-names"
                />
              </label>
              <label>
                Filtrar por fabricante
                <input
                  value={filters.manufacturer}
                  onChange={(event) =>
                    setFilters({ ...filters, manufacturer: event.target.value })
                  }
                  placeholder="Fabricante"
                  list="manufacturer-names"
                />
              </label>
              <label>
                Filtrar por modelo
                <input
                  value={filters.model}
                  onChange={(event) => setFilters({ ...filters, model: event.target.value })}
                  placeholder="Modelo"
                  list="model-names"
                />
              </label>
              <label>
                Item
                <select value={productId} onChange={(event) => setProductId(event.target.value)}>
                  <option value="">Selecione</option>
                  {filteredProducts.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} | {item.manufacturer || '-'} | {item.model || '-'} (saldo{' '}
                      {item.quantity})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Quantidade
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(event) => setQuantity(Number(event.target.value))}
                />
              </label>
              {error ? <span className="error">{error}</span> : null}
              <div className="actions">
                <button
                  className="ghost"
                  type="button"
                  disabled={loading}
                  onClick={() => handleMovement('exit')}
                >
                  Registrar saida
                </button>
              </div>
            </div>
          </>
        )}

        <datalist id="product-names">
          {nameSuggestions.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
        <datalist id="manufacturer-names">
          {manufacturerSuggestions.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
        <datalist id="model-names">
          {modelSuggestions.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
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
              <th>Data inclusao</th>
              <th>Hora inclusao</th>
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
                <td colSpan={15}>Nenhuma movimentacao registrada.</td>
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
