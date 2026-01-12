'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { apiFetch } from '@/lib/api';

type Supplier = {
  id: string;
  name: string;
  contact: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Export suppliers to CSV
  const exportToCSV = () => {
    const headers = ['Nome', 'Contato', 'Email', 'Telefone', 'Endereço'];
    const csvData = suppliers.map(s => [
      s.name,
      s.contact || '',
      s.email || '',
      s.phone || '',
      s.address || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `fornecedores_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import suppliers from CSV
  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split(/\r?\n/).filter(line => line.trim());
        
        if (lines.length < 2) {
          alert('Arquivo CSV vazio ou inválido');
          return;
        }
        
        // Detect delimiter (comma or semicolon)
        const firstLine = lines[0];
        const delimiter = firstLine.includes(';') ? ';' : ',';
        
        const suppliersToImport = lines.slice(1).map(line => {
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
          
          // Mapping: Nome(0), Entidade(1), Tipo(2), Endereço(3), Site(4), Telefone(5), Fax(6), Email(7)
          const name = values[0]?.trim().replace(/[;,]+$/, '') || '';
          const contact = values[1]?.trim().replace(/[;,]+$/, '') || undefined;
          const address = values[3]?.trim().replace(/[;,]+$/, '') || undefined;
          const phone = values[5]?.trim().replace(/[;,]+$/, '') || undefined;
          const email = values[7]?.trim().replace(/[;,]+$/, '') || undefined;
          
          return {
            name,
            ...(contact && { contact }),
            ...(email && { email }),
            ...(phone && { phone }),
            ...(address && { address })
          };
        }).filter(s => s.name);

        if (suppliersToImport.length === 0) {
          alert('Nenhum fornecedor válido encontrado no arquivo');
          return;
        }

        let successCount = 0;
        let errorCount = 0;

        for (const supplier of suppliersToImport) {
          try {
            await apiFetch('/suppliers', { method: 'POST', body: supplier });
            successCount++;
          } catch (err) {
            errorCount++;
            console.error('Erro ao importar fornecedor:', supplier.name, err);
          }
        }
        
        const data = await apiFetch<Supplier[]>('/suppliers');
        setSuppliers(data);
        setFilteredSuppliers(data);
        
        alert(`Importação concluída!\nSucesso: ${successCount}\nErros: ${errorCount}`);
      } catch (err) {
        console.error('Erro detalhado:', err);
        alert('Erro ao processar arquivo CSV. Verifique o formato do arquivo.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // Toggle select all
  const handleSelectAll = () => {
    if (selectedIds.size === filteredSuppliers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredSuppliers.map(s => s.id)));
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

  // Delete selected suppliers
  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    
    if (!confirm(`Deseja realmente remover ${selectedIds.size} fornecedor(es) selecionado(s)?`)) {
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const id of selectedIds) {
      try {
        await apiFetch(`/suppliers/${id}`, { method: 'DELETE' });
        successCount++;
      } catch (err) {
        errorCount++;
        console.error('Erro ao remover fornecedor:', id, err);
      }
    }

    setSelectedIds(new Set());
    await loadSuppliers();
    
    alert(`Remoção concluída!\nRemovidos: ${successCount}\nErros: ${errorCount}`);
  };

  const loadSuppliers = async () => {
    try {
      const data = await apiFetch<Supplier[]>('/suppliers');
      setSuppliers(data);
      setFilteredSuppliers(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Filter suppliers based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredSuppliers(suppliers);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = suppliers.filter((supplier) =>
        supplier.name.toLowerCase().includes(term)
      );
      setFilteredSuppliers(filtered);
    }
  }, [searchTerm, suppliers]);

  useEffect(() => {
    loadSuppliers();
    apiFetch<{ role: 'ADMIN' | 'USER' }>('/users/me')
      .then((data) => setIsAdmin(data.role === 'ADMIN'))
      .catch(() => setIsAdmin(false));
  }, []);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (!name.trim()) {
        setError('Nome é obrigatório');
        setLoading(false);
        return;
      }
      // normalize and enforce domain for email
      let finalEmail = email ? email.trim().toLowerCase() : undefined;
      if (finalEmail) {
        if (finalEmail.includes('@')) {
          if (!finalEmail.endsWith('@emserh.ma.gov.br')) {
            setError('O email deve usar o domínio @emserh.ma.gov.br');
            setLoading(false);
            return;
          }
        } else {
          const localPart = finalEmail;
          if (!/^[a-z0-9._-]+$/.test(localPart)) {
            setError('Digite apenas o usuário do email (ex: joao.parga)');
            setLoading(false);
            return;
          }
          finalEmail = `${localPart}@emserh.ma.gov.br`;
        }
      }

      const payload = { name: name.trim(), ...(contact ? { contact } : {}), ...(finalEmail ? { email: finalEmail } : {}), ...(phone ? { phone } : {}), ...(address ? { address } : {}) };
      await apiFetch('/suppliers', {
        method: 'POST',
        body: payload,
      });
      setName('');
      setContact('');
      setEmail('');
      setPhone('');
      setAddress('');
      loadSuppliers();
      setShowForm(false);
      setSearchTerm('');
    } catch (err: any) {
      const msg = err?.message ?? 'Erro ao criar fornecedor';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <header className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1>Fornecedores</h1>
          <p>Consulta e cadastro de fornecedores.</p>
        </div>

        {isAdmin && !showForm && (
          <div>
            <button type="button" className="primary" onClick={() => setShowForm(true)}>Adicionar</button>
          </div>
        )}
      </header>

      {showForm && isAdmin && (
        <section className="form-card" style={{ marginBottom: 12 }}>
          <form onSubmit={handleCreate} className="grid-form uppercase-inputs">
            <label>
              Nome
              <input type="text" placeholder="Nome" value={name} onChange={(e) => setName(e.target.value.toUpperCase())} required />
            </label>
            <label>
              Contato
              <input type="text" placeholder="Contato" value={contact} onChange={(e) => setContact(e.target.value.toUpperCase())} />
            </label>
            <label>
              Email
              <input type="email" placeholder="email@dominio.com" value={email} onChange={(e) => setEmail(e.target.value.trim().toLowerCase())} />
            </label>
            <label>
              Telefone
              <input type="text" placeholder="Telefone" value={phone} onChange={(e) => setPhone(e.target.value.toUpperCase())} />
            </label>
            <label>
              Endereço
              <input type="text" placeholder="Endereço" value={address} onChange={(e) => setAddress(e.target.value.toUpperCase())} />
            </label>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" className="ghost" onClick={() => { setShowForm(false); setError(''); }} disabled={loading}>Cancelar</button>
              <button type="submit" className="primary" disabled={loading}>{loading ? 'Criando...' : 'Adicionar Fornecedor'}</button>
            </div>
            {error && <p className="error">{error}</p>}
          </form>
        </section>
      )}

      {!showForm && (
        <section className="filter-bar" style={{ marginBottom: 16, padding: '16px 20px', background: 'linear-gradient(160deg, rgba(23, 24, 35, 0.95), rgba(12, 12, 18, 0.95))', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', maxWidth: '600px' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Pesquisar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
              style={{ 
                flex: 1,
                background: 'rgba(15, 15, 21, 0.9)',
                border: '1px solid #000',
                borderRadius: '12px',
                padding: '10px 14px',
                color: 'var(--text)',
                fontSize: '14px',
                textTransform: 'uppercase'
              }}
            />
            {searchTerm && (
              <button type="button" className="ghost" onClick={() => setSearchTerm('')}>Limpar</button>
            )}
            {isAdmin && (
              <>
                {selectedIds.size > 0 && (
                  <button type="button" className="ghost" onClick={handleDeleteSelected} style={{ color: '#ff4444' }}>
                    Remover ({selectedIds.size})
                  </button>
                )}
                <button type="button" className="ghost" onClick={exportToCSV}>
                  Exportar CSV
                </button>
                <label htmlFor="import-csv-suppliers" className="ghost" style={{ cursor: 'pointer', padding: '8px 14px', margin: 0 }}>
                  Importar CSV
                  <input
                    id="import-csv-suppliers"
                    type="file"
                    accept=".csv"
                    onChange={handleImportCSV}
                    style={{ display: 'none' }}
                  />
                </label>
              </>
            )}
          </div>
        </section>
      )}

      <section className="table-card">
        <table>
          <thead>
            <tr>
              {isAdmin && (
                <th style={{ width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredSuppliers.length && filteredSuppliers.length > 0}
                    onChange={handleSelectAll}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
              )}
              <th>Nome</th>
              <th>Contato</th>
              <th>Email</th>
              <th>Telefone</th>
              <th>Endereço</th>
            </tr>
          </thead>
          <tbody>
            {filteredSuppliers.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 6 : 5}>{searchTerm ? 'Nenhum fornecedor encontrado' : 'Nenhum fornecedor cadastrado'}</td>
              </tr>
            ) : (
              filteredSuppliers.map((supplier) => (
                <tr key={supplier.id}>
                  {isAdmin && (
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(supplier.id)}
                        onChange={() => handleSelectOne(supplier.id)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                  )}
                  <td>{supplier.name}</td>
                  <td>{supplier.contact || '-'}</td>
                  <td>{supplier.email || '-'}</td>
                  <td>{supplier.phone || '-'}</td>
                  <td>{supplier.address || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}