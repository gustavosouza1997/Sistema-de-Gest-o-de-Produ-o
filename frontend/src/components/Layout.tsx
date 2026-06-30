import { Link, useLocation } from 'react-router-dom';
import { Building2, Layers, ClipboardList, Activity, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.png';
import { useAuthStore } from '@/store/auth';

const navItems = [
  { href: '/empresas', label: 'Empresas',            icon: Building2     },
  { href: '/modelos',  label: 'Modelos',              icon: Layers        },
  { href: '/ordens',   label: 'Ordens de Serviço',    icon: ClipboardList },
  { href: '/controle', label: 'Controle de Produção', icon: Activity      },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const { user, logout } = useAuthStore();

  const initials = (user?.name ?? 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  return (
    <div className="flex min-h-screen">
      {/* ── Sidebar ── */}
      <aside className="fixed inset-y-0 left-0 z-40 flex w-56 flex-col bg-sidebar text-sidebar-foreground">

        {/* Logo */}
        <div className="flex h-16 items-center justify-center border-b border-sidebar-border px-4">
          <img
            src={logo}
            alt="Calçados Padilha"
            className="h-10 w-auto object-contain brightness-0 invert"
          />
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 px-2 py-3">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                to={href}
                className={cn(
                  'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/60 hover:bg-sidebar-muted hover:text-sidebar-foreground',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="border-t border-sidebar-border p-2">
          <div className="flex items-center gap-3 rounded-md px-3 py-2">
            {user?.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                className="h-7 w-7 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground">
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-sidebar-foreground">
                {user?.name ?? 'Usuário'}
              </p>
              <p className="truncate text-xs text-sidebar-foreground/50">
                {user?.email ?? ''}
              </p>
            </div>
            <button
              onClick={logout}
              title="Sair"
              className="shrink-0 rounded p-1 text-sidebar-foreground/40 transition-colors hover:bg-sidebar-muted hover:text-sidebar-foreground"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="ml-56 flex-1 bg-background">
        {pathname.startsWith('/controle') ? (
          <div className="flex h-screen flex-col overflow-hidden p-4">{children}</div>
        ) : (
          <div className="mx-auto max-w-6xl px-8 py-8">{children}</div>
        )}
      </main>
    </div>
  );
}
