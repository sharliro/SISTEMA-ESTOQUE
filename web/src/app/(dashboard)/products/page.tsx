'use client';

import { useEffect, useState, useRef } from 'react';
import { apiFetch } from '@/lib/api';

type Product = {
  id: string;
  code: number;
  name: string;
  manufacturer: string | null;
  model: string | null;
  nfe: string | null;
  dtNfe: string | null;
  dtInclu: string | null;
  horaInclu: string | null;
  quantity: number;
  nchagpc: string | null;
  sector: string | null;
  unit: string | null;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  type UnitOption = { id: string; name: string; sectors: { id: string; name: string }[] };
  const [availableUnits, setAvailableUnits] = useState<UnitOption[]>([]);
  const [availableSectors, setAvailableSectors] = useState<{ id: string; name: string }[]>([]);
  const [searchInputs, setSearchInputs] = useState({ name: '', manufacturer: '', model: '', unitId: '', sectorId: '' });
  const [filters, setFilters] = useState({ name: '', manufacturer: '', model: '', unitId: '', sectorId: '' });

  // Sort order for the product list (default A→Z)
  const [sortOrder, setSortOrder] = useState<'none' | 'name-asc' | 'name-desc'>('name-asc');

  // Autocomplete suggestions derived from products
  const nameSuggestions = Array.from(new Set(products.map((p) => p.name).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  const manufacturerSuggestions = Array.from(new Set(products.map((p) => p.manufacturer || '').filter(Boolean))).sort((a, b) => a.localeCompare(b));
  const modelSuggestions = Array.from(new Set(products.map((p) => p.model || '').filter(Boolean))).sort((a, b) => a.localeCompare(b));

  // focus the product filter on mount and allow Enter to apply filters
  const productInputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    try {
      productInputRef.current?.focus();
      productInputRef.current?.select();
    } catch (e) {
      // ignore focus errors
    }
  }, []);

  const loadProducts = async () => {
    try {
      const data = await apiFetch<Product[]>('/products');
      setProducts(data);
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
    loadProducts();
  }, []);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Pesquisa</h1>
          <p>Cadastro e consulta dos itens em estoque.</p>
        </div>
      </header>

      <section className="form-card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 0, flexWrap: 'wrap' }}>
          <button
            className="ghost"
            type="button"
            onClick={() => setSortOrder(sortOrder === 'name-asc' ? 'name-desc' : 'name-asc')}
            title={sortOrder === 'name-asc' ? 'Ordenação: Nome A→Z (clique para inverter)' : 'Ordenação: Nome Z→A (clique para inverter)'}
            style={{ minWidth: 80, padding: '8px 10px' }}
          >
            {sortOrder === 'name-asc' ? 'A→Z' : 'Z→A'}
          </button>

          <input
            ref={productInputRef}
            placeholder="Produto"
            list="product-filter-names"
            value={searchInputs.name}
            onChange={(e) => setSearchInputs({ ...searchInputs, name: e.target.value })}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); setFilters(searchInputs); } }}
            style={{ minWidth: 180, padding: '8px 10px' }}
          />
          
          <input
            placeholder="Fabricante"
            list="manufacturer-filter-names"
            value={searchInputs.manufacturer}
            onChange={(e) => setSearchInputs({ ...searchInputs, manufacturer: e.target.value })}
            style={{ minWidth: 160, padding: '8px 10px' }}
          />
          <input
            placeholder="Modelo"
            list="model-filter-names"
            value={searchInputs.model}
            onChange={(e) => setSearchInputs({ ...searchInputs, model: e.target.value })}
            style={{ minWidth: 160, padding: '8px 10px' }}
          />
          <select
            value={searchInputs.unitId}
            onChange={(e) => {
              const uid = e.target.value;
              setSearchInputs({ ...searchInputs, unitId: uid, sectorId: '' });
              const unit = availableUnits.find((u) => u.id === uid);
              setAvailableSectors(unit?.sectors ?? []);
            }}
            style={{ minWidth: 160, padding: '8px 10px' }}
          >
            <option value="">Unidade</option>
            {availableUnits.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          <select
            value={searchInputs.sectorId}
            onChange={(e) => setSearchInputs({ ...searchInputs, sectorId: e.target.value })}
            style={{ minWidth: 160, padding: '8px 10px' }}
          >
            <option value="">Setor</option>
            {availableSectors.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <button className="ghost" type="button" onClick={() => setFilters(searchInputs)}>
            Aplicar
          </button>
          <button className="ghost" type="button" onClick={() => { setSearchInputs({ name: '', manufacturer: '', model: '', unitId: '', sectorId: '' }); setAvailableSectors([]); setFilters({ name: '', manufacturer: '', model: '', unitId: '', sectorId: '' }); }}>
            Limpar
          </button>
        </div>
      </section>

      <datalist id="product-filter-names">
        {nameSuggestions.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>
      <datalist id="manufacturer-filter-names">
        {manufacturerSuggestions.map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>
      <datalist id="model-filter-names">
        {modelSuggestions.map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>

            <div>
              <p>Itens encontrados</p>
            </div>
      <section className="table-card">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Produto</th>
              <th>Fabricante</th>
              <th>Modelo</th>
              <th>Quantidade</th>
              
            </tr>
          </thead>
          <tbody>
            {(() => {
              const filteredProducts = products.filter((item) => {
                const matchName = filters.name ? item.name.toLowerCase().includes(filters.name.toLowerCase()) : true;
                const matchManufacturer = filters.manufacturer ? (item.manufacturer || '').toLowerCase().includes(filters.manufacturer.toLowerCase()) : true;
                const matchModel = filters.model ? (item.model || '').toLowerCase().includes(filters.model.toLowerCase()) : true;
                const matchUnit = filters.unitId ? item.unit === (availableUnits.find((u) => u.id === filters.unitId)?.name ?? '') : true;
                const matchSector = filters.sectorId ? item.sector === (availableSectors.find((s) => s.id === filters.sectorId)?.name ?? '') : true;
                // Only include items that have quantity > 0
                return matchName && matchManufacturer && matchModel && matchUnit && matchSector && item.quantity > 0;
              });
              
              let sortedProducts = filteredProducts;
              if (sortOrder === 'name-asc') {
                sortedProducts = [...filteredProducts].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
              } else if (sortOrder === 'name-desc') {
                sortedProducts = [...filteredProducts].sort((a, b) => b.name.localeCompare(a.name, 'pt-BR'));
              }

              if (sortedProducts.length === 0) {
                return (
                  <tr>
                    <td colSpan={12}>Nenhum produto em estoque corresponde aos filtros atuais.</td>
                  </tr>
                );
              }

              return sortedProducts.map((item) => (
                <tr key={item.id}>
                  <td>{item.code}</td>
                  <td>{item.name}</td>
                  <td>{item.manufacturer || '-'}</td>
                  <td>{item.model || '-'}</td>
                  <td>{item.quantity}</td>
                 
                </tr>
              ));
            })()}
          </tbody>
        </table>
      </section>
    </div>
  );
}
