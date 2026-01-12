'use client';

import { useEffect, useState, useRef, type FormEvent } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { isValidIsoDate, isLeapYear } from '@/lib/date';

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

export default function MovementsEntry() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
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
  const lastValidDtRef = useRef<string>(entryForm.dtNfe);
  const openDatePicker = () => {
    const el = dtNfeRef.current;
    if (!el) return;
    if (typeof (el as any).showPicker === 'function') {
      try {
        (el as any).showPicker();
        return;
      } catch (e) {
        // ignore
      }
    }
    el.focus();
  };

  type UnitOption = { id: string; name: string; sectors: { id: string; name: string }[] };
  const [availableUnits, setAvailableUnits] = useState<UnitOption[]>([]);
  const [availableSectors, setAvailableSectors] = useState<{ id: string; name: string }[]>([]);

  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [manufacturerSuggestions, setManufacturerSuggestions] = useState<string[]>([]);
  const [modelSuggestions, setModelSuggestions] = useState<string[]>([]);

  const pathname = usePathname();
  const routeActive: 'entry' | 'exit' = pathname?.endsWith('/entry') ? 'entry' : pathname?.endsWith('/exit') ? 'exit' : 'entry';

  const loadData = async () => {
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

  useEffect(() => {
    loadData();
  }, []);

  const entryNameSuggestions = nameSuggestions;

  const handleEntry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValidIsoDate(entryForm.dtNfe)) {
      setDtNfeError('Data inválida');
      return;
    }
    try {
      await apiFetch('/stock/entry', { method: 'POST', body: { ...entryForm } });
      setEntryForm({ ...entryForm, name: '', manufacturer: '', model: '', nfe: '', dtNfe: today, quantity: 1, nchagpc: '', sector: '', unit: '' });
      lastValidDtRef.current = today;
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Entradas</h1>
        </div>
      </header>

      <section className="form-card">
        <h3>Entrada (cadastro do item)</h3>

        <form className="grid-form" onSubmit={handleEntry}>
          <label>
            Produto
            <input className="select-control" value={entryForm.name} onChange={(event) => setEntryForm({ ...entryForm, name: event.target.value.toUpperCase() })} list="product-names" required />
          </label>
          <label>
            Fabricante
            <input className="select-control" required value={entryForm.manufacturer} onChange={(event) => setEntryForm({ ...entryForm, manufacturer: event.target.value.toUpperCase() })} list="manufacturer-names" />
          </label>
          <label>
            Modelo
            <input className="select-control" required value={entryForm.model} onChange={(event) => setEntryForm({ ...entryForm, model: event.target.value.toUpperCase() })} list="model-names" />
          </label>
          <label>
            NFE
            <input className="select-control" inputMode="numeric" pattern="\d*" value={entryForm.nfe} onChange={(event) => setEntryForm({ ...entryForm, nfe: (event.target.value || '').replace(/\D/g, '') })} />
          </label>
          <label>
            Data NFe
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input ref={dtNfeRef} type="date" className="date-input" value={entryForm.dtNfe} max={today} onChange={(event) => {
                const prev = lastValidDtRef.current;
                let v = event.target.value.trim();
                if (!v) { setEntryForm({ ...entryForm, dtNfe: '' }); lastValidDtRef.current = ''; setDtNfeError(''); return; }

                // accept dd/mm/yyyy input and convert to ISO
                let sanitized = v;
                if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) {
                  const [dd, mm, yyyy] = v.split('/').map(Number);
                  // check leap-year feb 29 case explicitly
                  if (mm === 2 && dd === 29 && !isLeapYear(yyyy)) {
                    setDtNfeError(`Data inválida — ${yyyy} não é ano bissexto (29/02/${yyyy} não existe)`);
                    setEntryForm({ ...entryForm, dtNfe: prev });                    if (dtNfeRef.current) dtNfeRef.current.value = prev || '';                    return;
                  }
                  sanitized = `${String(yyyy).padStart(4, '0')}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
                }

                // Defensive leap-year check: block explicit 29/02 on non-leap years
                if (/^\d{4}-02-29$/.test(sanitized)) {
                  const y = Number(sanitized.slice(0,4));
                  if (!isLeapYear(y)) {
                    setDtNfeError(`Data inválida — ${y} não é ano bissexto (29/02/${y} não existe)`);
                    setEntryForm({ ...entryForm, dtNfe: prev });
                    if (dtNfeRef.current) dtNfeRef.current.value = prev || '';
                    return;
                  }
                }

                // now follow existing validations for ISO-like input
                if (sanitized > today) { setDtNfeError('Data não pode ser no futuro'); setEntryForm({ ...entryForm, dtNfe: prev }); if (dtNfeRef.current) dtNfeRef.current.value = prev || ''; return; }
                const partialRegex = /^\d{0,4}(-\d{0,2}(-\d{0,2})?)?$/;
                const parts = sanitized.split('-');
                if (parts[0] && parts[0].length > 4) { setDtNfeError('O ano não pode ter mais que 4 dígitos'); setEntryForm({ ...entryForm, dtNfe: prev }); if (dtNfeRef.current) dtNfeRef.current.value = prev || ''; return; }
                if (!partialRegex.test(sanitized)) { setDtNfeError('Data inválida — use formato AAAA-MM-DD'); setEntryForm({ ...entryForm, dtNfe: prev }); if (dtNfeRef.current) dtNfeRef.current.value = prev || ''; return; }
                if (/^\d{4}-\d{2}-\d{2}$/.test(sanitized)) {
                  const [yStr, mStr, dStr] = sanitized.split('-');
                  const y = Number(yStr);
                  const m = Number(mStr);
                  const d = Number(dStr);
                  if (m === 2 && d === 29 && !isLeapYear(y)) { setDtNfeError(`Data inválida — ${y} não é ano bissexto (29/02/${y} não existe)`); setEntryForm({ ...entryForm, dtNfe: prev }); if (dtNfeRef.current) dtNfeRef.current.value = prev || ''; return; }
                  if (!isValidIsoDate(sanitized)) { setDtNfeError('Data inválida'); setEntryForm({ ...entryForm, dtNfe: prev }); if (dtNfeRef.current) dtNfeRef.current.value = prev || ''; return; }
                }
                setDtNfeError('');
                setEntryForm({ ...entryForm, dtNfe: sanitized });
                lastValidDtRef.current = sanitized;
              }} onBlur={(e) => {
                const prev = lastValidDtRef.current;
                let v = (e.target as HTMLInputElement).value.trim();
                if (!v) { setDtNfeError(''); lastValidDtRef.current = ''; return; }
                let sanitized = v;
                if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) {
                  const [dd, mm, yyyy] = v.split('/').map(Number);
                  sanitized = `${String(yyyy).padStart(4, '0')}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
                }
                // Defensive leap-year check for 29/02
                if (/^\d{4}-02-29$/.test(sanitized)) {
                  const y = Number(sanitized.slice(0,4));
                  if (!isLeapYear(y)) {
                    setDtNfeError(`Data inválida — ${y} não é ano bissexto (29/02/${y} não existe)`);
                    setEntryForm({ ...entryForm, dtNfe: prev });
                    if (dtNfeRef.current) dtNfeRef.current.value = prev || '';
                    return;
                  }
                }
                if (!/^\d{4}-\d{2}-\d{2}$/.test(sanitized) || !isValidIsoDate(sanitized)) {
                  setDtNfeError('Data inválida');
                  setEntryForm({ ...entryForm, dtNfe: prev });
                  if (dtNfeRef.current) dtNfeRef.current.value = prev || '';
                  return;
                }
                // final leap-year check
                const [y, m, d] = sanitized.split('-').map(Number);
                if (m === 2 && d === 29 && !isLeapYear(y)) {
                  setDtNfeError(`Data inválida — ${y} não é ano bissexto (29/02/${y} não existe)`);
                  setEntryForm({ ...entryForm, dtNfe: prev });
                  if (dtNfeRef.current) dtNfeRef.current.value = prev || '';
                  return;
                }
                setDtNfeError('');
                setEntryForm({ ...entryForm, dtNfe: sanitized });
                lastValidDtRef.current = sanitized;
              }} />
              <button type="button" onClick={openDatePicker} aria-label="Abrir calendário" title="Abrir calendário" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#fff', padding: 6, borderRadius: 4 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              </button>
            </div>
            {dtNfeError ? <span className="error" style={{ display: 'block', marginTop: 6 }}>{dtNfeError}</span> : <small style={{ display: 'block', marginTop: 6, color: '#666' }}>Você pode usar o calendário ou digitar no formato <code>AAAA-MM-DD</code></small>}
          </label>
          <label>
            Quantidade
            <input type="number" min={1} value={entryForm.quantity} onChange={(e) => setEntryForm({ ...entryForm, quantity: Math.max(1, Number(e.target.value)) })} />
          </label>
          <label>
            Chave NCHAGPC
            <input value={entryForm.nchagpc} onChange={(e) => setEntryForm({ ...entryForm, nchagpc: e.target.value.toUpperCase() })} />
          </label>
          <label>
            Unidade
            <input className="select-control" value={entryForm.unit} onChange={(e) => setEntryForm({ ...entryForm, unit: e.target.value.toUpperCase() })} list="unit-names" />
          </label>
          <label>
            Setor
            <input className="select-control" value={entryForm.sector} onChange={(e) => setEntryForm({ ...entryForm, sector: e.target.value.toUpperCase() })} list="sector-names" />
          </label>
          <div className="actions"><button className="ghost" type="submit">Cadastrar</button></div>
        </form>

      </section>

      <section className="table-card">
        <table>
          <thead>
            <tr>
              <th>Código</th>
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

      <datalist id="product-names">
        {entryNameSuggestions.map((item) => (
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
      <datalist id="unit-names">
        {availableUnits.map((u) => (
          <option key={u.id} value={u.name} />
        ))}
      </datalist>
      <datalist id="sector-names">
        {availableSectors.map((s) => (
          <option key={s.id} value={s.name} />
        ))}
      </datalist>
    </div>
  );
}
