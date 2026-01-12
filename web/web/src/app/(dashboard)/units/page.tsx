'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { apiFetch } from '@/lib/api';

type Sector = {
  id: string;
  name: string;
};

type Unit = {
  id: string;
  name: string;
  sectors: Sector[];
};

export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [unitName, setUnitName] = useState('');
  const [sectorNames, setSectorNames] = useState<Record<string, string>>({});
  const [query, setQuery] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeUnitId, setActiveUnitId] = useState<string | null>(null);
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [editingUnitName, setEditingUnitName] = useState('');
  const [editingSectorId, setEditingSectorId] = useState<string | null>(null);
  const [editingSectorName, setEditingSectorName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadUnits = async () => {
    try {
      const data = await apiFetch<Unit[]>('/units');
      setUnits(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadUnits();
    apiFetch<{ role: 'ADMIN' | 'USER' }>('/users/me')
      .then((data) => setIsAdmin(data.role === 'ADMIN'))
      .catch(() => setIsAdmin(false));
  }, []);

  const handleCreateUnit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await apiFetch('/units', {
        method: 'POST',
        body: { name: unitName },
      });
      setUnitName('');
      await loadUnits();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar unidade';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSector = async (unitId: string) => {
    const name = sectorNames[unitId];
    if (!name) {
      setError('Informe o nome do setor');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await apiFetch(`/units/${unitId}/sectors`, {
        method: 'POST',
        body: { name },
      });
      setSectorNames((prev) => ({ ...prev, [unitId]: '' }));
      await loadUnits();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar setor';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const toggleUnitActions = (unitId: string) => {
    setActiveUnitId((prev) => (prev === unitId ? null : unitId));
  };

  const startEditUnit = (unit: Unit) => {
    setEditingUnitId(unit.id);
    setEditingUnitName(unit.name);
  };

  const cancelEditUnit = () => {
    setEditingUnitId(null);
    setEditingUnitName('');
  };

  const saveEditUnit = async (unitId: string) => {
    if (!editingUnitName) {
      setError('Informe o nome da unidade');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await apiFetch(`/units/${unitId}`, {
        method: 'PATCH',
        body: { name: editingUnitName },
      });
      cancelEditUnit();
      await loadUnits();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar unidade';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const deleteUnit = async (unitId: string) => {
    if (!window.confirm('Deseja remover essa unidade?')) {
      return;
    }
    setLoading(true);
    setError('');
    try {
      await apiFetch(`/units/${unitId}`, { method: 'DELETE' });
      await loadUnits();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao remover unidade';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const startEditSector = (unitId: string, sector: Sector) => {
    setEditingSectorId(sector.id);
    setEditingSectorName(sector.name);
  };

  const cancelEditSector = () => {
    setEditingSectorId(null);
    setEditingSectorName('');
  };

  const saveEditSector = async (unitId: string, sectorId: string) => {
    if (!editingSectorName) {
      setError('Informe o nome do setor');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await apiFetch(`/units/${unitId}/sectors/${sectorId}`, {
        method: 'PATCH',
        body: { name: editingSectorName },
      });
      cancelEditSector();
      await loadUnits();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar setor';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const deleteSector = async (unitId: string, sectorId: string) => {
    if (!window.confirm('Deseja remover esse setor?')) {
      return;
    }
    setLoading(true);
    setError('');
    try {
      await apiFetch(`/units/${unitId}/sectors/${sectorId}`, { method: 'DELETE' });
      await loadUnits();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao remover setor';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const filteredUnits = units.filter((unit) => {
    if (!query) {
      return true;
    }
    const lowered = query.toLowerCase();
    const matchesUnit = unit.name.toLowerCase().includes(lowered);
    const matchesSector = unit.sectors.some((sector) =>
      sector.name.toLowerCase().includes(lowered),
    );
    return matchesUnit || matchesSector;
  });

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Unidades e Setores</h1>
          <p>Cadastro gerenciado apenas por administradores.</p>
        </div>
      </header>

      <section className="form-card">
        <h3>Buscar unidade ou setor</h3>
        <div className="grid-form">
          <label>
            Buscar
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Digite unidade ou setor"
            />
          </label>
        </div>
      </section>

      {isAdmin ? (
        <section className="form-card">
          <h3>Nova unidade</h3>
          <form className="grid-form" onSubmit={handleCreateUnit}>
            <label>
              Nome da unidade
              <input
                value={unitName}
                onChange={(event) => setUnitName(event.target.value)}
                required
              />
            </label>
            {error ? <span className="error">{error}</span> : null}
            <button className="primary" type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Cadastrar unidade'}
            </button>
          </form>
        </section>
      ) : null}

      <section className="table-card">
        <div className="units-grid">
          {filteredUnits.length === 0 ? (
            <p className="muted">Nenhuma unidade cadastrada.</p>
          ) : (
            filteredUnits.map((unit) => (
              <div key={unit.id} className="unit-card">
                <div className="unit-header">
                  <div className="unit-title">
                    {editingUnitId === unit.id ? (
                      <input
                        value={editingUnitName}
                        onChange={(event) => setEditingUnitName(event.target.value)}
                      />
                    ) : (
                      <h3>{unit.name}</h3>
                    )}
                    <span className="muted">{unit.sectors.length} setores</span>
                  </div>
                  {isAdmin ? (
                    <div className="unit-actions-inline">
                      <button
                        type="button"
                        className="ghost icon"
                        onClick={() => toggleUnitActions(unit.id)}
                        aria-label="Editar unidade"
                      >
                        ✎
                      </button>
                      {activeUnitId === unit.id ? (
                        editingUnitId === unit.id ? (
                          <>
                            <button
                              type="button"
                              className="ghost"
                              disabled={loading}
                              onClick={() => saveEditUnit(unit.id)}
                            >
                              Salvar
                            </button>
                            <button type="button" className="ghost" onClick={cancelEditUnit}>
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="ghost"
                              disabled={loading}
                              onClick={() => startEditUnit(unit)}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              className="ghost danger"
                              disabled={loading}
                              onClick={() => deleteUnit(unit.id)}
                            >
                              Remover
                            </button>
                          </>
                        )
                      ) : null}
                    </div>
                  ) : null}
                </div>
                <div className="unit-sectors">
                  {unit.sectors.length === 0 ? (
                    <span className="muted">Nenhum setor cadastrado.</span>
                  ) : (
                    unit.sectors.map((sector) => (
                      <div key={sector.id} className="sector-row">
                        {editingSectorId === sector.id ? (
                          <input
                            value={editingSectorName}
                            onChange={(event) => setEditingSectorName(event.target.value)}
                          />
                        ) : (
                          <span className="sector-pill">{sector.name}</span>
                        )}
                        {isAdmin && activeUnitId === unit.id ? (
                          <div className="sector-actions">
                            {editingSectorId === sector.id ? (
                              <>
                                <button
                                  type="button"
                                  className="ghost"
                                  disabled={loading}
                                  onClick={() => saveEditSector(unit.id, sector.id)}
                                >
                                  Salvar
                                </button>
                                <button
                                  type="button"
                                  className="ghost"
                                  onClick={cancelEditSector}
                                >
                                  Cancelar
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  className="ghost"
                                  disabled={loading}
                                  onClick={() => startEditSector(unit.id, sector)}
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  className="ghost danger"
                                  disabled={loading}
                                  onClick={() => deleteSector(unit.id, sector.id)}
                                >
                                  Remover
                                </button>
                              </>
                            )}
                          </div>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
                {isAdmin && activeUnitId === unit.id ? (
                  <div className="unit-actions">
                    <input
                      value={sectorNames[unit.id] || ''}
                      onChange={(event) =>
                        setSectorNames((prev) => ({
                          ...prev,
                          [unit.id]: event.target.value,
                        }))
                      }
                      placeholder="Novo setor"
                    />
                    <button
                      type="button"
                      className="ghost"
                      disabled={loading}
                      onClick={() => handleCreateSector(unit.id)}
                    >
                      Adicionar
                    </button>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
