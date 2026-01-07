'use client';

import { useEffect, useState, useRef, type FormEvent } from 'react';
import { apiFetch } from '@/lib/api';

type Product = {
  id: string;
  name: string;
  manufacturer: string | null;
  model: string | null;
  quantity: number;
  nchagpc?: string | null;
  sector?: string | null;
  unit?: string | null;
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
  const today = new Date().toISOString().slice(0, 10);
  const [entryForm, setEntryForm] = useState({
    name: '',
    manufacturer: '',
    model: '',
    nfe: '',
    dtNfe: today,
    quantity: 1,
    nchagpc: '',
    sector: '',
    unit: '',
  });
  const [dtNfeError, setDtNfeError] = useState('');
  const dtNfeRef = useRef<HTMLInputElement | null>(null);
  const openDatePicker = () => {
    const el = dtNfeRef.current;
    if (!el) return;
    // Prefer native showPicker() when available (Chromium)
    if (typeof (el as any).showPicker === 'function') {
      try {
        (el as any).showPicker();
        return;
      } catch (e) {
        // ignore and fallback to focus
      }
    }
    el.focus();
  };

  // Units and sectors fetched from backend
  type UnitOption = { id: string; name: string; sectors: { id: string; name: string }[] };
  const [availableUnits, setAvailableUnits] = useState<UnitOption[]>([]);
  const [availableSectors, setAvailableSectors] = useState<{ id: string; name: string }[]>([]);

  // exitForm stores unitId and sectorId (IDs from /units API) and nchagpc
  const [exitForm, setExitForm] = useState({ nchagpc: '', sectorId: '', unitId: '' });
  const [filters, setFilters] = useState({
    name: '',
    manufacturer: '',
    model: '',
    unitId: '',
    sectorId: '',
  });


  useEffect(() => {
    if (!productId) {
      setExitForm({ nchagpc: '', sectorId: '', unitId: '' });
      setAvailableSectors([]);
      return;
    }
    const p = products.find((x) => x.id === productId);
    if (p) {
      // find unit by name (product.unit stores unit name)
      const unit = availableUnits.find((u) => u.name === p.unit);
      const unitId = unit?.id ?? '';
      const sectorId = unit ? unit.sectors.find((s) => s.name === p.sector)?.id ?? '' : '';
      setExitForm({ nchagpc: p.nchagpc ?? '', sectorId, unitId });
      if (unit) {
        setAvailableSectors(unit.sectors ?? []);
      } else {
        setAvailableSectors([]);
      }
    }
  }, [productId, products, availableUnits]);
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

      // fetch units with sectors to populate exit select
      try {
        const units = await apiFetch<UnitOption[]>('/units');
        setAvailableUnits(units);
      } catch (uErr) {
        console.error('failed to load units', uErr);
        setAvailableUnits([]);
      }
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
    const matchUnit = filters.unitId
      ? item.unit === (availableUnits.find((u) => u.id === filters.unitId)?.name ?? '')
      : true;
    const matchSector = filters.sectorId
      ? item.sector === (availableSectors.find((s) => s.id === filters.sectorId)?.name ?? '')
      : true;
    return matchName && matchManufacturer && matchModel && matchUnit && matchSector;
  });

  // Helpers to detect whether typed manufacturer/model have matching products
  const manufacturerHasProducts = filters.manufacturer
    ? products.some((p) => (p.manufacturer || '').toLowerCase().includes(filters.manufacturer.toLowerCase()))
    : true;
  const modelHasProducts = filters.model
    ? products.some((p) => (p.model || '').toLowerCase().includes(filters.model.toLowerCase()))
    : true;
  const hasMatchingProducts = filteredProducts.length > 0;
  const selectedProduct = products.find((p) => p.id === productId);

  // editable identifiers for exit (allow typing and auto-select if a product matches)
  const [exitIdent, setExitIdent] = useState({ name: '', manufacturer: '', model: '' });

  useEffect(() => {
    // when a product is selected, reflect its values in the editable fields
    if (selectedProduct) {
      setExitIdent({ name: selectedProduct.name, manufacturer: selectedProduct.manufacturer ?? '', model: selectedProduct.model ?? '' });
    } else {
      setExitIdent({ name: '', manufacturer: '', model: '' });
    }
  }, [selectedProduct]);

  const normalize = (s?: string) => (s || '').trim().toLowerCase();
  const tryMatchExitProduct = (name: string, manufacturer: string, model: string) => {
    // only attempt match when all three fields have values
    if (!name || !manufacturer || !model) return;
    const found = products.find((p) => (
      normalize(p.name) === normalize(name) &&
      normalize(p.manufacturer as any) === normalize(manufacturer) &&
      normalize(p.model as any) === normalize(model)
    ));
    if (found) {
      setProductId(found.id);
      // set exit form identifiers like when user selects from list
      const unit = availableUnits.find((u) => u.name === found.unit);
      const unitId = unit?.id ?? '';
      const sectorId = unit ? unit.sectors.find((s) => s.name === found.sector)?.id ?? '' : '';
      setExitForm({ nchagpc: found.nchagpc ?? '', sectorId, unitId });
      setAvailableSectors(unit?.sectors ?? []);
    }
  };

  // When filters are applied, use names from the filtered result for the entry datalist
  const entryNameSuggestions = (filters.name || filters.manufacturer || filters.model || filters.unitId || filters.sectorId)
    ? Array.from(new Set(filteredProducts.map((p) => p.name))).sort((a, b) => a.localeCompare(b))
    : nameSuggestions;

  const handleEntry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // validação local: formata AAAA-MM-DD (ano com 4 dígitos)
    if (entryForm.dtNfe && !/^\d{4}-\d{2}-\d{2}$/.test(entryForm.dtNfe)) {
      setError('Data NFE inválida — use formato AAAA-MM-DD');
      return;
    }
    // required fields: manufacturer and model
    if (!entryForm.manufacturer || !entryForm.model) {
      setError('Fabricante e modelo são obrigatórios');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // check if a matching product already exists
      const normalize = (s?: string) => (s || '').trim().toLowerCase();
      const dateOnly = (iso?: string) => {
        if (!iso) return '';
        try {
          return new Date(iso).toISOString().slice(0, 10);
        } catch {
          return iso.slice(0, 10);
        }
      };

      // exact match including NFe and dtNfe
      const existingExact = products.find((p) => {
        const pAny = p as any;
        const pDt = dateOnly(pAny.dtNfe);
        const fDt = entryForm.dtNfe ? entryForm.dtNfe : '';
        return (
          normalize(p.name) === normalize(entryForm.name) &&
          normalize(p.manufacturer as any) === normalize(entryForm.manufacturer) &&
          normalize(p.model as any) === normalize(entryForm.model) &&
          (pAny.nfe || '') === (entryForm.nfe || '') &&
          pDt === fDt
        );
      });

      // core match (name + manufacturer + model) — used when NFe differs
      const existingCore = products.find((p) => (
        normalize(p.name) === normalize(entryForm.name) &&
        normalize(p.manufacturer as any) === normalize(entryForm.manufacturer) &&
        normalize(p.model as any) === normalize(entryForm.model)
      ));

      if (existingExact) {
        // exact match (same NFe & date) — increment quantity for that product
        await apiFetch('/stock/entry', {
          method: 'POST',
          body: {
            productId: existingExact.id,
            quantity: Number(entryForm.quantity) || 1,
          },
        });
      } else if (existingCore) {
        // same product (name/manufacturer/model) but different NFe — register only an entry movement
        await apiFetch('/stock/entry', {
          method: 'POST',
          body: {
            productId: existingCore.id,
            quantity: Number(entryForm.quantity) || 1,
          },
        });
      } else {
        // create new product + entry
        await apiFetch('/stock/entry/new', {
          method: 'POST',
          body: {
            name: entryForm.name,
            manufacturer: entryForm.manufacturer || undefined,
            model: entryForm.model || undefined,
            nfe: entryForm.nfe || undefined,
            dtNfe: entryForm.dtNfe || undefined,
            quantity: Number(entryForm.quantity) || 1,
          },
        });
      }

      setEntryForm({
        name: '',
        manufacturer: '',
        model: '',
        nfe: '',
        dtNfe: today,
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
      const body: any = { productId, quantity: Number(quantity) };
      // Do not send nchagpc/unitId/sectorId to avoid validation errors on current backend
      await apiFetch(`/stock/${type}`, {
        method: 'POST',
        body,
      });
      setQuantity(1);
      if (type === 'exit') setExitForm({ nchagpc: '', sectorId: '', unitId: '' });
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
                  required
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
                  required
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
                Data NFe
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    ref={dtNfeRef}
                    type="date"
                    className="date-input"
                    value={entryForm.dtNfe}
                    max={today}
                    onChange={(event) => {
                      const v = event.target.value;
                      // allow empty
                      if (!v) {
                        setEntryForm({ ...entryForm, dtNfe: '' });
                        setDtNfeError('');
                        return;
                      }
                      // Prevent future date
                      if (v > today) {
                        setDtNfeError('Data não pode ser no futuro');
                        return;
                      }
                      // Enforce max length YYYY-MM-DD
                      let sanitized = v.slice(0, 10);
                      // Progressive validation: year max 4 dígitos, month/day max 2
                      const partialRegex = /^\d{0,4}(-\d{0,2}(-\d{0,2})?)?$/;
                      const parts = sanitized.split('-');
                      if (parts[0] && parts[0].length > 4) {
                        setDtNfeError('O ano não pode ter mais que 4 dígitos');
                        return;
                      }
                      if (!partialRegex.test(sanitized)) {
                        setDtNfeError('Data inválida — use formato AAAA-MM-DD');
                        return;
                      }
                      // If fully formed date, validate full format
                      if (/^\d{4}-\d{2}-\d{2}$/.test(sanitized)) {
                        // simple check for month/day ranges
                        const [y, m, d] = sanitized.split('-').map(Number);
                        if (m < 1 || m > 12 || d < 1 || d > 31) {
                          setDtNfeError('Data inválida');
                          return;
                        }
                      }
                      setDtNfeError('');
                      setEntryForm({ ...entryForm, dtNfe: sanitized });
                    }}
                  />
                  <button type="button" onClick={openDatePicker} aria-label="Abrir calendário" title="Abrir calendário" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#fff', padding: 6, borderRadius: 4 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                  </button>
                </div>
                {dtNfeError ? (
                  <span className="error" style={{ display: 'block', marginTop: 6 }}>{dtNfeError}</span>
                ) : (
                  <small style={{ display: 'block', marginTop: 6, color: '#666' }}>Você pode usar o calendário ou digitar no formato <code>AAAA-MM-DD</code></small>
                )}
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
                Produto
                <input
                  list="product-names"
                  value={exitIdent.name}
                  onChange={(e) => { setExitIdent({ ...exitIdent, name: e.target.value }); tryMatchExitProduct(e.target.value, exitIdent.manufacturer, exitIdent.model); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { tryMatchExitProduct(exitIdent.name, exitIdent.manufacturer, exitIdent.model); } }}
                  placeholder="Digite ou selecione um produto"
                />
              </label>
              <label>
                Fabricante
                <input
                  list="manufacturer-names"
                  value={exitIdent.manufacturer}
                  onChange={(e) => { setExitIdent({ ...exitIdent, manufacturer: e.target.value }); tryMatchExitProduct(exitIdent.name, e.target.value, exitIdent.model); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { tryMatchExitProduct(exitIdent.name, exitIdent.manufacturer, exitIdent.model); } }}
                  placeholder="Digite o fabricante"
                />
              </label>
              <label>
                Modelo
                <input
                  list="model-names"
                  value={exitIdent.model}
                  onChange={(e) => { setExitIdent({ ...exitIdent, model: e.target.value }); tryMatchExitProduct(exitIdent.name, exitIdent.manufacturer, e.target.value); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { tryMatchExitProduct(exitIdent.name, exitIdent.manufacturer, exitIdent.model); } }}
                  placeholder="Digite o modelo"
                />
              </label>
              <label>
                Item
                <select value={productId} onChange={(event) => setProductId(event.target.value)} disabled={activeTab === 'exit' && !hasMatchingProducts}>
                  <option value="">Selecione</option>
                  {filteredProducts.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} | {item.manufacturer || '-'} | {item.model || '-'} (saldo {item.quantity})
                    </option>
                  ))}
                </select>
                {activeTab === 'exit' && !hasMatchingProducts ? (
                  <small className="error" style={{ display: 'block', marginTop: 6 }}>
                    Nenhum produto corresponde aos filtros informados
                  </small>
                ) : null}
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
              <label>
                NCHAGPC/SEI
                <input
                  value={exitForm.nchagpc}
                  onChange={(e) => setExitForm({ ...exitForm, nchagpc: e.target.value })}
                />
              </label>
              <label>
                Unidade
                <select
                  value={exitForm.unitId}
                  onChange={(e) => {
                    const unitId = e.target.value;
                    setExitForm({ ...exitForm, unitId, sectorId: '' });
                    const unit = availableUnits.find((u) => u.id === unitId);
                    setAvailableSectors(unit?.sectors ?? []);
                  }}
                >
                  <option value="">Selecione unidade</option>
                  {availableUnits.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Setor
                <select
                  value={exitForm.sectorId}
                  onChange={(e) => setExitForm({ ...exitForm, sectorId: e.target.value })}
                >
                  <option value="">Selecione setor</option>
                  {availableSectors.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
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
          {(activeTab === 'entry' ? entryNameSuggestions : nameSuggestions).map((item) => (
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
        <h3>Itens recomendados</h3>
        <table>
          <thead>
            <tr>
              <th>Codigo</th>
              <th>Produto</th>
              <th>Fabricante</th>
              <th>Modelo</th>
              <th>NFE</th>
              <th>Data NFE</th>
              <th>Quantidade</th>
              <th>Unidade</th>
              <th>Setor</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={10}>Nenhum produto recomendado com os filtros atuais.</td>
              </tr>
            ) : (
              filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td>{(product as any).code ?? '-'}</td>
                  <td>{product.name}</td>
                  <td>{product.manufacturer || '-'}</td>
                  <td>{product.model || '-'}</td>
                  <td>{(product as any).nfe || '-'}</td>
                  <td>{(product as any).dtNfe ? new Date((product as any).dtNfe).toLocaleDateString('pt-BR') : '-'}</td>
                  <td>{product.quantity}</td>
                  <td>{product.unit || '-'}</td>
                  <td>{product.sector || '-'}</td>
                  <td>
                    {activeTab === 'entry' ? (
                      <button
                        className="ghost"
                        type="button"
                        onClick={() => {
                          setEntryForm({
                            ...entryForm,
                            name: product.name,
                            manufacturer: product.manufacturer ?? '',
                            model: product.model ?? '',
                            nfe: (product as any).nfe ?? '',
                            dtNfe: (product as any).dtNfe ? new Date((product as any).dtNfe).toISOString().slice(0,10) : today,
                            quantity: 1,
                          });
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        Usar
                      </button>
                    ) : (
                      <button
                        className="ghost"
                        type="button"
                        onClick={() => {
                          // select for exit
                          setProductId(product.id);
                          // find unit and sector ids
                          const unit = availableUnits.find((u) => u.name === product.unit);
                          const unitId = unit?.id ?? '';
                          const sectorId = unit ? unit.sectors.find((s) => s.name === product.sector)?.id ?? '' : '';
                          setExitForm({ nchagpc: product.nchagpc ?? '', sectorId, unitId });
                          setAvailableSectors(unit?.sectors ?? []);
                          setQuantity(1);
                          setError('');
                          // scroll to form
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        Selecionar
                      </button>
                    )}
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
