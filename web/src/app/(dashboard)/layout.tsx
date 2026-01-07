import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import LogoutButton from '@/components/LogoutButton';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/products', label: 'Estoque' },
  { href: '/movements', label: 'Entradas/Saidas' },
  { href: '/records', label: 'Registros' },
  { href: '/units', label: 'Unidades/Setores' },
  { href: '/users', label: 'Usuarios' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="app-shell">
        <aside className="sidebar">
          <div className="brand">
            <span>Estoque | GTIC</span>
            <small>Versão 1.0|ano 2026</small>
          </div>
          <nav>
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="nav-link">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="sidebar-footer">
            <span>Admin</span>
            <LogoutButton />
          </div>
        </aside>
        <main className="content">{children}</main>
      </div>
    </AuthGuard>
  );
}
