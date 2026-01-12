import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import UserHeader from '@/components/UserHeader';
import '@/styles/dashboard.css';

const navSections = [
  {
    
    items: [{ href: '/dashboard', label: 'Dashboard' }]
  },
  {
    title: 'Gerenciamento',
    items: [
      { href: '/products', label: 'Produtos' },
      { href: '/suppliers', label: 'Fornecedores' },
      { href: '/manufacturers', label: 'Fabricantes' }
    ]
  },
  {
    title: 'Movimentação',
    items: [
      { href: '/movements?tab=entry', label: 'Entradas' },
      { href: '/movements?tab=exit', label: 'Saídas' }
    ]
  },
  {
    title: 'Relatórios',
    items: [{ href: '/records', label: 'Relatorios' }]
  },
  {
    title: 'Administração',
    items: [
      { href: '/units', label: 'Unidades/Setores' },
      { href: '/users', label: 'Usuários' }
    ]
  }
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="app-shell">
        <aside className="sidebar">
          <div className="logo">
            <span id = "ESTOQUELOGCOLOR">SCE</span>
            <span id='GTICCOLOR'> | GTIC</span>
            </div>
            <div id = "versaotxt"><p>SISTEMA DE CONTROLE DE ESTOQUE VERSÃO 1.0 | ANO 2026</p></div>
          <nav>
            {navSections.map((section) => (
              <div key={section.title} className="nav-section">
                <h4 className="nav-section-title">{section.title}</h4>
                {section.items.map((item) => (
                  <Link key={item.href} href={item.href} className="nav-link">
                    {item.label}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
        </aside>
        <main className="content">
          <header className="main-header">
            <UserHeader />
          </header>
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
