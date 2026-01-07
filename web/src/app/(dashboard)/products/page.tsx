'use client';

import { useEffect, useState } from 'react';
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

  const loadProducts = async () => {
    try {
      const data = await apiFetch<Product[]>('/products');
      setProducts(data);
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
          <h1>Produtos</h1>
          <p>Cadastro alinhado aos campos da planilha.</p>
        </div>
      </header>

      <section className="table-card">
        <table>
          <thead>
            <tr>
              <th>Codigo</th>
              <th>Produto</th>
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
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={12}>Nenhum produto cadastrado.</td>
              </tr>
            ) : (
              products.map((item) => (
                <tr key={item.id}>
                  <td>{item.code}</td>
                  <td>{item.name}</td>
                  <td>{item.manufacturer || '-'}</td>
                  <td>{item.model || '-'}</td>
                  <td>{item.nfe || '-'}</td>
                  <td>{item.dtNfe ? new Date(item.dtNfe).toLocaleDateString('pt-BR') : '-'}</td>
                  <td>
                    {item.dtInclu ? new Date(item.dtInclu).toLocaleDateString('pt-BR') : '-'}
                  </td>
                  <td>{item.horaInclu || '-'}</td>
                  <td>{item.quantity}</td>
                  <td>{item.nchagpc || '-'}</td>
                  <td>{item.sector || '-'}</td>
                  <td>{item.unit || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
