'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

type Product = {
  id: string;
  name: string;
  quantity: number;
};

type Movement = {
  id: string;
  type: 'IN' | 'OUT';
  quantity: number;
  createdAt: string;
  product: { name: string };
};

type SummaryPoint = {
  bucket: string;
  inQty: number;
  outQty: number;
};

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [summary, setSummary] = useState<SummaryPoint[]>([]);
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('day');
  const [chartMode, setChartMode] = useState<'bars' | 'line'>('bars');

  useEffect(() => {
    const load = async () => {
      try {
        const productData = await apiFetch<Product[]>('/products');
        setProducts(productData);
        const movementData = await apiFetch<Movement[]>('/stock/movements?limit=6');
        setMovements(movementData);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const data = await apiFetch<SummaryPoint[]>(`/stock/summary?period=${period}`);
        setSummary(data);
      } catch (err) {
        console.error(err);
      }
    };
    loadSummary();
  }, [period]);

  const totalItems = products.reduce((sum, item) => sum + item.quantity, 0);
  const today = new Date().toDateString();
  const todayOut = movements.filter(
    (item) => item.type === 'OUT' && new Date(item.createdAt).toDateString() === today,
  ).length;
  const maxValue = Math.max(
    1,
    ...summary.flatMap((item) => [item.inQty, item.outQty]),
  );
  const chartWidth = 100;
  const chartHeight = 40;

  const buildLinePoints = (key: 'inQty' | 'outQty') => {
    if (summary.length === 0) {
      return '';
    }
    return summary
      .map((item, index) => {
        const x =
          summary.length === 1
            ? chartWidth / 2
            : (index / (summary.length - 1)) * chartWidth;
        const y = chartHeight - (item[key] / maxValue) * chartHeight;
        return `${x},${y}`;
      })
      .join(' ');
  };

  const formatBucket = (value: string) => {
    const date = new Date(value);
    if (period === 'month') {
      return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    }
    if (period === 'year') {
      return date.getFullYear().toString();
    }
    if (period === 'week') {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Resumo do estoque e ultimas movimentacoes.</p>
        </div>
        <Link className="primary" href="/movements">
          Nova entrada
        </Link>
      </header>
      <section className="grid">
        <div className="card">
          <h3>Itens cadastrados</h3>
          <strong>{products.length}</strong>
          <span className="muted">Total de itens em estoque.</span>
        </div>
        <div className="card">
          <h3>Em estoque</h3>
          <strong>{totalItems}</strong>
          <span className="muted">Quantidade total disponivel.</span>
        </div>
        <div className="card">
          <h3>Saidas hoje</h3>
          <strong>{todayOut}</strong>
          <span className="muted">Movimentacoes registradas hoje.</span>
        </div>
      </section>
      <section className="table-card">
        <h3>Ultimas movimentacoes</h3>
        <table>
          <thead>
            <tr>
              <th>Produto</th>
              <th>Tipo</th>
              <th>Quantidade</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {movements.length === 0 ? (
              <tr>
                <td colSpan={4}>Sem movimentacoes registradas.</td>
              </tr>
            ) : (
              movements.map((item) => (
                <tr key={item.id}>
                  <td>{item.product.name}</td>
                  <td>{item.type === 'IN' ? 'Entrada' : 'Saida'}</td>
                  <td>{item.quantity}</td>
                  <td>{new Date(item.createdAt).toLocaleString('pt-BR')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
      <section className="table-card">
        <div className="chart-header">
          <h3>Movimentacoes por periodo</h3>
          <div className="chart-actions">
            <button
              className={period === 'day' ? 'pill active' : 'pill'}
              type="button"
              onClick={() => setPeriod('day')}
            >
              Diario
            </button>
            <button
              className={period === 'week' ? 'pill active' : 'pill'}
              type="button"
              onClick={() => setPeriod('week')}
            >
              Semanal
            </button>
            <button
              className={period === 'month' ? 'pill active' : 'pill'}
              type="button"
              onClick={() => setPeriod('month')}
            >
              Mensal
            </button>
            <button
              className={period === 'year' ? 'pill active' : 'pill'}
              type="button"
              onClick={() => setPeriod('year')}
            >
              Anual
            </button>
          </div>
        </div>
        <div className="chart-subheader">
          <div className="legend">
            <span className="legend-dot in" />
            <span>Entrada</span>
            <span className="legend-dot out" />
            <span>Saida</span>
          </div>
          <div className="chart-actions">
            <button
              className={chartMode === 'bars' ? 'pill active' : 'pill'}
              type="button"
              onClick={() => setChartMode('bars')}
            >
              Barras
            </button>
            <button
              className={chartMode === 'line' ? 'pill active' : 'pill'}
              type="button"
              onClick={() => setChartMode('line')}
            >
              Linha
            </button>
          </div>
        </div>
        <div className="chart">
          {summary.length === 0 ? (
            <p className="muted">Sem dados para o periodo.</p>
          ) : chartMode === 'bars' ? (
            summary.map((item) => (
              <div key={item.bucket} className="chart-row">
                <span className="chart-label">{formatBucket(item.bucket)}</span>
                <div className="chart-bars">
                  <div
                    className="bar in"
                    style={{ width: `${(item.inQty / maxValue) * 100}%` }}
                    title={`Entrada: ${item.inQty}`}
                  />
                  <div
                    className="bar out"
                    style={{ width: `${(item.outQty / maxValue) * 100}%` }}
                    title={`Saida: ${item.outQty}`}
                  />
                </div>
                <span className="chart-values">
                  +{item.inQty} / -{item.outQty}
                </span>
              </div>
            ))
          ) : (
            <div className="line-chart">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                <polyline className="line in" points={buildLinePoints('inQty')} />
                <polyline className="line out" points={buildLinePoints('outQty')} />
              </svg>
              <div className="line-labels">
                {summary.map((item) => (
                  <span key={item.bucket}>{formatBucket(item.bucket)}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
