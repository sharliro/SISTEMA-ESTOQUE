'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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

export default function MovementsExit() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);

  const [filters, setFilters] = useState({
    name: '',
    manufacturer: '',
    model: '',
    unitId: '',
    sectorId: '',
  });

  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);

  type UnitOption = { id: string; name: string; sectors: { id: string; name: string }[] };
  const [availableUnits, setAvailableUnits] = useState<UnitOption[]>([]);
  const [availableSectors, setAvailableSectors] = useState<{ id: string; name: string }[]>([]);
  const [exitForm, setExitForm] = useState({ nchagpc: '', sectorId: '', unitId: '' });

  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [manufacturerSuggestions, setManufacturerSuggestions] = useState<string[]>([]);
  const [modelSuggestions, setModelSuggestions] = useState<string[]>([]);

  const pathname = usePathname();
  const routeActive: 'entry' | 'exit' = pathname?.endsWith('/entry') ? 'entry' : pathname?.endsWith('/exit') ? 'exit' : 'exit';

  useEffect(() => {
    const load = async () => {
      try {
        const productData = await apiFetch<Product[]>('/products');
        setProducts(productData);
        const uniqueNames = Array.from(new Set(productData.map((item) => item.name).filter(Boolean))).sort((a, b) => a.localeCompare(b));
        const uniqueManufacturers = Array.from(new Set(productData.map((item) => item.manufacturer).filter((value): value is string => !!value))).sort((a, b) => a.localeCompare(b));
        const uniqueModels = Array.from(new Set(productData.map((item) => item.model).filter((value): value is string => !!value))).sort((a, b) => a.localeCompare(b));
        setNameSuggestions(uniqueNames);
        setManufacturerSuggestions(uniqueManufacturers);
        setModelSuggestions(uniqueModels);
        const movementData = await apiFetch<Movement[]>('/stock/movements?limit=20');
        setMovements(movementData);
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
    load();
  }, []);

  const normalize = (s?: string) => (s || '').trim().toLowerCase();
  const tryMatchExitProduct = (name: string, manufacturer: string, model: string) => {
    if (!name || !manufacturer || !model) return;
    const found = products.find((p) => (
      normalize(p.name) === normalize(name) &&
      normalize(p.manufacturer as any) === normalize(manufacturer) &&
      normalize(p.model as any) === normalize(model)
    ));
    if (found) {
      setProductId(found.id);
      const unit = availableUnits.find((u) => u.name === found.unit);
      const unitId = unit?.id ?? '';
      const sectorId = unit ? unit.sectors.find((s) => s.name === found.sector)?.id ?? '' : '';
      setExitForm({ nchagpc: found.nchagpc ?? '', sectorId, unitId });
      setAvailableSectors(unit?.sectors ?? []);
    }
  };

  const filteredProducts = products.filter((item) => {
    const matchName = filters.name ? item.name.toLowerCase().includes(filters.name.toLowerCase()) : true;
    const matchManufacturer = filters.manufacturer ? (item.manufacturer || '').toLowerCase().includes(filters.manufacturer.toLowerCase()) : true;
    const matchModel = filters.model ? (item.model || '').toLowerCase().includes(filters.model.toLowerCase()) : true;
    const matchUnit = filters.unitId ? item.unit === (availableUnits.find((u) => u.id === filters.unitId)?.name ?? '') : true;
    const matchSector = filters.sectorId ? item.sector === (availableSectors.find((s) => s.id === filters.sectorId)?.name ?? '') : true;
    return matchName && matchManufacturer && matchModel && matchUnit && matchSector;
  });

  const hasMatchingProducts = filteredProducts.length > 0;

  const handleExit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!productId) {
      return;
    }
    try {
      await apiFetch('/stock/exit', { method: 'POST', body: { productId, quantity, nchagpc: exitForm.nchagpc, unitId: exitForm.unitId, sectorId: exitForm.sectorId } });
      setProductId('');
      setQuantity(1);
      // reload data
      const movementData = await apiFetch<Movement[]>('/stock/movements?limit=20');
      setMovements(movementData);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Registrar Saídas</h1>
          <p>Registre a remoção de itens indicando produto, quantidade, unidade e setor.</p>
        </div>
      </header>

      <section className="form-card">
        <h3>Saída (seleção do item)</h3>

        <form className="grid-form" onSubmit={handleExit}>
          <label>
            Produto
            <select value={productId} onChange={(event) => setProductId(event.target.value)} disabled={!hasMatchingProducts}>
              <option value="">Selecione</option>
              {filteredProducts.map((p) => (
                <option key={p.id} value={p.id}>{p.name} — {p.manufacturer ?? '-'} — {p.model ?? '-'}</option>
              ))}
            </select>
            {!hasMatchingProducts ? <small className="error" style={{ display: 'block', marginTop: 6 }}>Nenhum item corresponde aos filtros</small> : null}
          </label>
          <label>
            Fabricante
            <input value={filters.manufacturer} onChange={(e) => setFilters({ ...filters, manufacturer: e.target.value })} list="manufacturer-names" />
          </label>
          <label>
            Modelo
            <input value={filters.model} onChange={(e) => setFilters({ ...filters, model: e.target.value })} list="model-names" />
          </label>
          <label>
            Quantidade
            <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))} />
          </label>
          <label>
            Unidades
            <select value={exitForm.unitId} onChange={(e) => { setExitForm({ ...exitForm, unitId: e.target.value }); const unit = availableUnits.find((u) => u.id === e.target.value); setAvailableSectors(unit?.sectors ?? []); }}>
              <option value="">Selecione</option>
              {availableUnits.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </label>
          <label>
            Setor
            <select value={exitForm.sectorId} onChange={(e) => setExitForm({ ...exitForm, sectorId: e.target.value })}>
              <option value="">Selecione</option>
              {availableSectors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label>
            Chave NCHAGPC
            <input value={exitForm.nchagpc} onChange={(e) => setExitForm({ ...exitForm, nchagpc: e.target.value })} />
          </label>
          <div className="actions"><button className="ghost" type="submit">Registrar Saída</button></div>
        </form>

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
            </tr>
          </thead>
          <tbody>
            {movements.map((m) => (
              <tr key={m.id}>
                <td>{(m.product as any).code}</td>
                <td>{m.product.name}</td>
                <td>{m.type}</td>
                <td>{m.product.manufacturer ?? '-'}</td>
                <td>{m.product.model ?? '-'}</td>
                <td>{m.product.nfe ?? '-'}</td>
                <td>{m.product.dtNfe ? new Date(m.product.dtNfe).toLocaleDateString('pt-BR') : '-'}</td>
                <td>{m.product.dtInclu ?? '-'}</td>
                <td>{m.product.horaInclu ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

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

    </div>
  );
}
