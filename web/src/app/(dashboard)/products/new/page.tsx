'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export default function NewProductPage() {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const [isAdmin, setIsAdmin] = useState(false);
  const [productForm, setProductForm] = useState({ name: '', manufacturer: '', model: '', supplierId: '', nfe: '', dtNfe: today, quantity: 1, nchagpc: '', sector: '', unit: '' });
  const [availableUnits, setAvailableUnits] = useState<{ id: string; name: string }[]>([]);
  const [availableSectors, setAvailableSectors] = useState<{ id: string; name: string }[]>([]);
  const [availableSuppliers, setAvailableSuppliers] = useState<{ id: string; name: string }[]>([]);
  const [availableManufacturers, setAvailableManufacturers] = useState<{ id: string; name: string }[]>([]);
  const [manufacturerSuggestions, setManufacturerSuggestions] = useState<string[]>([]);
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [modelSuggestions, setModelSuggestions] = useState<string[]>([]);
  const [productsCache, setProductsCache] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [existingProductMessage, setExistingProductMessage] = useState('');

  // Handle product name change and auto-fill if existing product
  const handleProductNameChange = (name: string) => {
    const upperName = name.toUpperCase();
    setProductForm({ ...productForm, name: upperName });
    setExistingProductMessage('');
  };

  // Check for existing product when name, manufacturer or model changes
  const checkForExistingProduct = () => {
    if (!productForm.name.trim()) return;

    const nameNorm = productForm.name.trim().toUpperCase();
    const manuNorm = productForm.manufacturer.trim().toUpperCase();
    const modelNorm = productForm.model.trim().toUpperCase();

    // Find products with exact match on name, manufacturer and model
    const existing = productsCache.find((p) => {
      if (!p) return false;
      const pName = (p.name || '').trim().toUpperCase();
      const pManu = (p.manufacturer || '').trim().toUpperCase();
      const pModel = (p.model || '').trim().toUpperCase();
      
      return pName === nameNorm && pManu === manuNorm && pModel === modelNorm;
    });

    if (existing) {
      setExistingProductMessage(`✓ Produto existente encontrado! Quantidade atual: ${existing.quantity}. A nova quantidade será adicionada ao estoque.`);
    } else {
      setExistingProductMessage('');
    }
  };

  // Check for duplicates whenever relevant fields change
  useEffect(() => {
    checkForExistingProduct();
  }, [productForm.name, productForm.manufacturer, productForm.model, productsCache]);

  useEffect(() => {
    apiFetch<{ role: 'ADMIN' | 'USER' }>('/users/me')
      .then((data) => setIsAdmin(data.role === 'ADMIN'))
      .catch(() => setIsAdmin(false));

    (async () => {
      try {
        const units = await apiFetch('/units');
        setAvailableUnits(units || []);
      } catch (err) {
        setAvailableUnits([]);
      }
      try {
        const sectors = await apiFetch('/sectors');
        setAvailableSectors(sectors || []);
      } catch (e) {
        // ignore
      }
      try {
        const manufacturers = await apiFetch<{ id: string; name: string }[]>('/manufacturers');
        setAvailableManufacturers(manufacturers || []);
      } catch (mErr) {
        // ignore
      }
      try {
        const suppliers = await apiFetch<{ id: string; name: string }[]>('/suppliers');
        setAvailableSuppliers(suppliers || []);
      } catch (sErr) {
        // ignore
      }

      // fetch current products to build name/model suggestions and have a local cache
      try {
        const all = await apiFetch<any[]>('/products');
        setProductsCache(all || []);
        const uniqueNames = Array.from(new Set((all || []).map((p) => p.name).filter(Boolean))).sort((a, b) => a.localeCompare(b));
        const uniqueModels = Array.from(new Set((all || []).map((p) => p.model).filter(Boolean))).sort((a, b) => a.localeCompare(b));
        setNameSuggestions(uniqueNames);
        setModelSuggestions(uniqueModels);
      } catch (pErr) {
        // ignore
      }
    })();
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (!productForm.name.trim()) { setError('Nome é obrigatório'); setLoading(false); return; }

      // normalize fields for matching (exact match required)
      const nameNorm = productForm.name.trim().toUpperCase();
      const manuNorm = productForm.manufacturer.trim().toUpperCase();
      const modelNorm = productForm.model.trim().toUpperCase();

      // try to find an existing product (exact match on ALL fields: name + manufacturer + model)
      const found = productsCache.find((p) => {
        if (!p) return false;
        const pName = (p.name || '').trim().toUpperCase();
        const pManu = (p.manufacturer || '').trim().toUpperCase();
        const pModel = (p.model || '').trim().toUpperCase();
        
        // All three fields must match exactly
        return pName === nameNorm && pManu === manuNorm && pModel === modelNorm;
      });

      if (found) {
        // increase quantity
        const newQuantity = (found.quantity || 0) + (productForm.quantity || 0);
        await apiFetch(`/products/${found.id}`, { method: 'PATCH', body: { quantity: newQuantity } });
        await router.push('/products');
        router.refresh();
        return;
      }

      // no existing product — create new (remove supplierId field)
      const { supplierId, ...productData } = productForm;
      await apiFetch('/products', { method: 'POST', body: productData });
      await router.push('/products');
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao criar produto');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="page">
        <header className="page-header">
          <div>
            <h1>Novo produto</h1>
            <p>Somente administradores podem criar produto.</p>
          </div>
        </header>
        <section className="form-card">
          <p className="muted">Acesso negado.</p>
          <div style={{ marginTop: 12 }}>
            <button className="ghost" onClick={() => router.push('/products')}>Voltar</button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Novo produto</h1>
          <p>Preencha os dados e clique em Adicionar.</p>
        </div>
        <div>
          <button className="ghost" onClick={() => router.push('/products')}>Voltar</button>
        </div>
      </header>

      <section className="form-card leftwide">
        {existingProductMessage && (
          <div style={{ 
            padding: '12px 16px', 
            marginBottom: '16px', 
            background: 'rgba(34, 197, 94, 0.15)', 
            border: '1px solid rgba(34, 197, 94, 0.3)', 
            borderRadius: '12px', 
            color: 'rgb(134, 239, 172)',
            fontSize: '13px'
          }}>
            {existingProductMessage}
          </div>
        )}
        <form className="form-rows uppercase-inputs" onSubmit={handleSubmit}>
          <label><span>Produto</span><input className="select-control" required value={productForm.name} onChange={(e) => handleProductNameChange(e.target.value)} list="product-names" /></label>
          <label>
            <span>Fabricante</span>
            <select className="select-control" required value={productForm.manufacturer} onChange={(e) => setProductForm({ ...productForm, manufacturer: e.target.value })}>
              <option value="">SELECIONE UM FABRICANTE</option>
              {availableManufacturers.map((manufacturer) => (
                <option key={manufacturer.id} value={manufacturer.name}>{manufacturer.name}</option>
              ))}
            </select>
          </label>
          <label><span>Modelo</span><input className="select-control" required value={productForm.model} onChange={(e) => setProductForm({ ...productForm, model: e.target.value.toUpperCase() })} list="model-filter-names" /></label>
          <label>
            <span>Fornecedor</span>
            <select className="select-control" value={productForm.supplierId} onChange={(e) => setProductForm({ ...productForm, supplierId: e.target.value })}>
              <option value="">SELECIONE UM FORNECEDOR</option>
              {availableSuppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
              ))}
            </select>
          </label>
          <label><span>NFE</span><input className="select-control" inputMode="numeric" pattern="\d*" value={productForm.nfe} onChange={(e) => setProductForm({ ...productForm, nfe: e.target.value.replace(/\D/g, '') })} /></label>
          <label><span>Data NFE</span><input className="select-control" type="date" value={productForm.dtNfe} max={today} onChange={(e) => setProductForm({ ...productForm, dtNfe: e.target.value })} /></label>
          <label><span>Quantidade</span><input className="select-control" type="number" min={0} value={productForm.quantity} onChange={(e) => setProductForm({ ...productForm, quantity: Math.max(0, Number(e.target.value)) })} /></label>

          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            <button type="button" className="ghost" onClick={() => router.push('/products')} disabled={loading}>Cancelar</button>
            <button className="primary" type="submit" disabled={loading}>{loading ? 'Criando...' : 'Adicionar'}</button>
          </div>
          {error && <p className="error">{error}</p>}
        </form>
      </section> 

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
      <datalist id="product-names">
        {nameSuggestions.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>

    </div>
  );
}
