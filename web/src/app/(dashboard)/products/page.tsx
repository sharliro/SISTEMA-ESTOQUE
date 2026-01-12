'use client';

import { useEffect, useState, useRef, type FormEvent } from 'react';
import { usePathname, useRouter } from 'next/navigation';
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
  const today = new Date().toISOString().slice(0, 10);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [productForm, setProductForm] = useState({ name: '', manufacturer: '', model: '', nfe: '', dtNfe: today, quantity: 1, nchagpc: '', sector: '', unit: '' });
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [errorCreate, setErrorCreate] = useState('');
  const [searchInputs, setSearchInputs] = useState({ name: '', manufacturer: '', model: '', unitId: '', sectorId: '' });
  const [filters, setFilters] = useState({ name: '', manufacturer: '', model: '', unitId: '', sectorId: '' });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Sort order for the product list (default A→Z)
  const [sortOrder, setSortOrder] = useState<'none' | 'name-asc' | 'name-desc'>('name-asc');

  // Get filtered products
  const getFilteredProducts = () => {
    return products.filter((item) => {
      const matchName = filters.name ? item.name.toLowerCase().includes(filters.name.toLowerCase()) : true;
      const matchManufacturer = filters.manufacturer ? (item.manufacturer || '').toLowerCase().includes(filters.manufacturer.toLowerCase()) : true;
      const matchModel = filters.model ? (item.model || '').toLowerCase().includes(filters.model.toLowerCase()) : true;
      const matchUnit = filters.unitId ? item.unit === (availableUnits.find((u) => u.id === filters.unitId)?.name ?? '') : true;
      const matchSector = filters.sectorId ? item.sector === (availableSectors.find((s) => s.id === filters.sectorId)?.name ?? '') : true;
      return matchName && matchManufacturer && matchModel && matchUnit && matchSector && item.quantity > 0;
    });
  };

  // Toggle select all
  const handleSelectAll = () => {
    const filtered = getFilteredProducts();
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(p => p.id)));
    }
  };

  // Toggle individual selection
  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Delete selected products
  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    
    if (!confirm(`Deseja realmente remover ${selectedIds.size} produto(s) selecionado(s)?`)) {
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const id of selectedIds) {
      try {
        await apiFetch(`/products/${id}`, { method: 'DELETE' });
        successCount++;
      } catch (err) {
        errorCount++;
        console.error('Erro ao remover produto:', id, err);
      }
    }

    setSelectedIds(new Set());
    loadProducts();
    
    alert(`Remoção concluída!\nRemovidos: ${successCount}\nErros: ${errorCount}`);
  };

  // Autocomplete suggestions derived from products
  const nameSuggestions = Array.from(new Set(products.map((p) => p.name).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  const manufacturerSuggestions = Array.from(new Set(products.map((p) => p.manufacturer || '').filter(Boolean))).sort((a, b) => a.localeCompare(b));
  const modelSuggestions = Array.from(new Set(products.map((p) => p.model || '').filter(Boolean))).sort((a, b) => a.localeCompare(b));

  // Export products to CSV
  const exportToCSV = () => {
    const headers = ['Código', 'Produto', 'Fabricante', 'Modelo', 'NFE', 'Data NFE', 'Quantidade'];
    const csvData = products.map(p => [
      p.code,
      p.name,
      p.manufacturer || '',
      p.model || '',
      p.nfe || '',
      p.dtNfe || '',
      p.quantity
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `produtos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import products from CSV
  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        // Handle different line endings (Windows, Mac, Linux)
        const lines = text.split(/\r?\n/).filter(line => line.trim());
        
        if (lines.length < 2) {
          alert('Arquivo CSV vazio ou inválido');
          return;
        }

        // Detect delimiter (comma or semicolon)
        const firstLine = lines[0];
        const delimiter = firstLine.includes(';') ? ';' : ',';
        
        const productsToImport = lines.slice(1).map(line => {
          // Simple CSV parsing - split by comma but respect quotes
          const values: string[] = [];
          let currentValue = '';
          let insideQuotes = false;
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              insideQuotes = !insideQuotes;
            } else if (char === delimiter && !insideQuotes) {
              values.push(currentValue.trim());
              currentValue = '';
            } else {
              currentValue += char;
            }
          }
          values.push(currentValue.trim());
          
          return {
            name: values[1] || '',
            manufacturer: values[2] || '',
            model: values[3] || '',
            nfe: values[4] || '',
            dtNfe: values[5] || new Date().toISOString().split('T')[0],
            quantity: parseInt(values[6]) || 0
          };
        }).filter(p => p.name);

        if (productsToImport.length === 0) {
          alert('Nenhum produto válido encontrado no arquivo');
          return;
        }

        let successCount = 0;
        let errorCount = 0;

        // Import each product
        for (const product of productsToImport) {
          try {
            await apiFetch('/products', { method: 'POST', body: product });
            successCount++;
          } catch (err) {
            errorCount++;
            console.error('Erro ao importar produto:', product.name, err);
          }
        }
        
        // Reload the list
        const data = await apiFetch<Product[]>('/products');
        setProducts(data);
        
        alert(`Importação concluída!\nSucesso: ${successCount}\nErros: ${errorCount}`);
      } catch (err) {
        console.error('Erro detalhado:', err);
        alert('Erro ao processar arquivo CSV. Verifique o formato do arquivo.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // Auto-filter as user types
  useEffect(() => {
    setFilters(searchInputs);
  }, [searchInputs]);

  // focus the product filter on mount and when route/tab changes
  const productInputRef = useRef<HTMLInputElement | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    try {
      productInputRef.current?.focus();
      productInputRef.current?.select();
    } catch (e) {
      // ignore focus errors
    }
  }, [pathname]);

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
    apiFetch<{ role: 'ADMIN' | 'USER' }>('/users/me')
      .then((data) => setIsAdmin(data.role === 'ADMIN'))
      .catch(() => setIsAdmin(false));
  }, []);

  // Close form on Escape and lock body scroll while modal is open
  useEffect(() => {
    if (!showForm) {
      document.body.style.overflow = '';
      return;
    }
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowForm(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [showForm]);

  return (
    <div className="page">
      {!showForm && (
        <header className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1>Estoque</h1>
            <p>Consulta de produtos.</p>
          </div>
        </header>
      )}

      {showForm && isAdmin && (
        <>
          <div className="modal-backdrop" onClick={() => setShowForm(false)} />
          <section className="form-card full-screen" style={{ marginBottom: 12 }}>
            <h3>Novo produto</h3>
            <form className="form-rows centered uppercase-inputs" onSubmit={async (e: FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              setLoadingCreate(true);
              setErrorCreate('');
              try {
                if (!productForm.name.trim()) { setErrorCreate('Nome é obrigatório'); setLoadingCreate(false); return; }
                await apiFetch('/products', { method: 'POST', body: productForm });
                setProductForm({ name: '', manufacturer: '', model: '', nfe: '', dtNfe: today, quantity: 1, nchagpc: '', sector: '', unit: '' });
                await loadProducts();
                setShowForm(false);
              } catch (err: any) {
                setErrorCreate(err?.message ?? 'Erro ao criar produto');
              } finally {
                setLoadingCreate(false);
              }
            }}>

            <label><span style={{ minWidth: 110 }}>Produto</span><input required value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value.toUpperCase() })} /></label>
            <label><span style={{ minWidth: 110 }}>Fabricante</span><input className="select-control" value={productForm.manufacturer} onChange={(e) => setProductForm({ ...productForm, manufacturer: e.target.value.toUpperCase() })} list="manufacturer-filter-names" /></label>
            <label><span style={{ minWidth: 110 }}>Modelo</span><input className="select-control" value={productForm.model} onChange={(e) => setProductForm({ ...productForm, model: e.target.value.toUpperCase() })} list="model-filter-names" /></label>
            <label><span style={{ minWidth: 110 }}>NFE</span><input className="select-control" inputMode="numeric" pattern="\d*" value={productForm.nfe} onChange={(e) => setProductForm({ ...productForm, nfe: e.target.value.replace(/\D/g, '') })} /></label>
            <label><span style={{ minWidth: 110 }}>Data NFE</span><input type="date" value={productForm.dtNfe} max={today} onChange={(e) => setProductForm({ ...productForm, dtNfe: e.target.value })} /></label>
            <label><span style={{ minWidth: 110 }}>Quantidade</span><input type="number" min={0} value={productForm.quantity} onChange={(e) => setProductForm({ ...productForm, quantity: Math.max(0, Number(e.target.value)) })} /></label>
            
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" className="ghost" onClick={() => setShowForm(false)} disabled={loadingCreate}>Cancelar</button>
              <button className="primary" type="submit" disabled={loadingCreate}>{loadingCreate ? 'Criando...' : 'Adicionar'}</button>
            </div>
            {errorCreate && <p className="error">{errorCreate}</p>}
          </form>
        </section>
        </>
      )}

      {!showForm && (
        <>
      <section className="form-card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 0, flexWrap: 'wrap' }}>
         

          <input
            ref={productInputRef}
            className="select-control"
            placeholder="Produto"
            list="product-filter-names"
            value={searchInputs.name}
            onChange={(e) => {
              const newSearchInputs = { ...searchInputs, name: e.target.value.toUpperCase() };
              setSearchInputs(newSearchInputs);
              setFilters(newSearchInputs);
            }}
            style={{ minWidth: 180, textTransform: 'uppercase' }}
          />
          
          
          <button className="ghost" type="button" onClick={() => { setSearchInputs({ name: '', manufacturer: '', model: '', unitId: '', sectorId: '' }); setAvailableSectors([]); setFilters({ name: '', manufacturer: '', model: '', unitId: '', sectorId: '' }); }}>
            Limpar
          </button>
          {selectedIds.size > 0 && (
            <button type="button" className="ghost" onClick={handleDeleteSelected} style={{ color: '#ff4444' }}>
              Remover ({selectedIds.size})
            </button>
          )}
          <button className="ghost" type="button" onClick={exportToCSV}>
            Exportar CSV
          </button>
          <label htmlFor="import-csv" className="ghost" style={{ cursor: 'pointer', padding: '8px 14px', margin: 0 }}>
            Importar CSV
            <input
              id="import-csv"
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              style={{ display: 'none' }}
            />
          </label>
          <button className="ghost" type="button" onClick={() => router.push('/products/new')}>
            Adicionar
          </button>
        </div>
      </section>
        </>
      )}

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
            
      <section className="table-card">
        <table>
          <thead>
            <tr>
              {isAdmin && (
                <th style={{ width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={(() => {
                      const filtered = getFilteredProducts();
                      return selectedIds.size === filtered.length && filtered.length > 0;
                    })()}
                    onChange={handleSelectAll}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
              )}
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
                    <td colSpan={isAdmin ? 7 : 6}>Produto não encontrado</td>
                  </tr>
                );
              }

              return sortedProducts.map((item) => (
                <tr key={item.id}>
                  {isAdmin && (
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={() => handleSelectOne(item.id)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                  )}
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
