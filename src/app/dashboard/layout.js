'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const DashboardContext = createContext(null);
export const useDashboard = () => useContext(DashboardContext);

const NAV_ITEMS = [
  { section: 'Principal', items: [
    { key: 'dashboard', label: 'Dashboard', icon: '📊', path: '/dashboard' },
    { key: 'anuncios', label: 'Anúncios', icon: '📋', path: '/dashboard/anuncios' },
    { key: 'pedidos', label: 'Pedidos', icon: '🛒', path: '/dashboard/pedidos' },
  ]},
  { section: 'Estoque Full', items: [
    { key: 'estoque', label: 'Gestão de Estoque', icon: '📦', path: '/dashboard/estoque' },
    { key: 'envios', label: 'Geração de Envios', icon: '🚚', path: '/dashboard/envios' },
  ]},
  { section: 'Relatórios', items: [
    { key: 'ruptura', label: 'Ruptura', icon: '🔴', path: '/dashboard/relatorios/ruptura' },
    { key: 'cobertura', label: 'Cobertura', icon: '🟢', path: '/dashboard/relatorios/cobertura' },
    { key: 'curva-abc', label: 'Curva ABC', icon: '📈', path: '/dashboard/relatorios/curva-abc' },
    { key: 'elasticidade', label: 'Elasticidade', icon: '💹', path: '/dashboard/relatorios/elasticidade' },
  ]},
  { section: 'Automação', items: [
    { key: 'tags', label: 'Tags & Workflow', icon: '🏷️', path: '/dashboard/tags' },
    { key: 'ads', label: 'Gestão de Ads', icon: '📣', path: '/dashboard/ads' },
  ]},
  { section: 'Integrações', items: [
    { key: 'erp', label: 'ERP', icon: '🔗', path: '/dashboard/erp' },
    { key: 'config', label: 'Configurações', icon: '⚙️', path: '/dashboard/config' },
  ]},
];

export default function DashboardLayout({ children }) {
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [activeAccountId, setActiveAccountId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [customLogo, setCustomLogo] = useState(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Fetch user and ML accounts from our new database-backed session endpoint
    const fetchSession = async () => {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setUser(data.user);
            setAccounts(data.accounts);
            if (data.accounts?.length > 0) {
              const savedAccId = localStorage.getItem('magiiv_active_account');
              if (savedAccId && data.accounts.find(a => a.id === savedAccId)) {
                setActiveAccountId(savedAccId);
              } else {
                setActiveAccountId(data.accounts[0].id);
              }
            }
          } else {
            router.push('/');
          }
        } else {
          router.push('/');
        }
      } catch (err) {
        console.error('Failed to load session', err);
        router.push('/');
      }
    };
    
    fetchSession();

    // Load custom logo from localStorage
    const savedLogo = localStorage.getItem('magiiv_custom_logo');
    if (savedLogo) setCustomLogo(savedLogo);
  }, [router]);

  // Sync active account to localStorage and Cookie (for SSR/API calls)
  useEffect(() => {
    if (activeAccountId) {
      localStorage.setItem('magiiv_active_account', activeAccountId);
      document.cookie = `magiiv_active_account=${activeAccountId}; path=/`;
    }
  }, [activeAccountId]);

  const activeAccount = accounts.find(a => a.id === activeAccountId) || null;

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const getInitials = (account) => {
    if (!account) return '?';
    return account.nickname?.[0]?.toUpperCase() || '?';
  };

  const getPageTitle = () => {
    for (const section of NAV_ITEMS) {
      for (const item of section.items) {
        if (pathname === item.path) return item.label;
      }
    }
    return 'Dashboard';
  };

  return (
    <DashboardContext.Provider value={{ user, accounts, activeAccount, activeAccountId, setActiveAccountId, customLogo, setCustomLogo }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 99, display: 'none',
          }}
          className="mobile-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          {customLogo ? (
            <img src={customLogo} alt="Logo" className="sidebar-logo" />
          ) : (
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <rect width="36" height="36" rx="10" fill="url(#sgr)" />
              <text x="18" y="24" textAnchor="middle" fill="white" fontWeight="800" fontSize="14" fontFamily="Inter">M</text>
              <defs>
                <linearGradient id="sgr" x1="0" y1="0" x2="36" y2="36">
                  <stop stopColor="#6C5CE7" />
                  <stop offset="1" stopColor="#00D2D3" />
                </linearGradient>
              </defs>
            </svg>
          )}
          <span className="sidebar-brand">MAGIIV</span>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((section) => (
            <div key={section.section} className="nav-section">
              <div className="nav-section-title">{section.section}</div>
              {section.items.map((item) => (
                <button
                  key={item.key}
                  className={`nav-link ${pathname === item.path ? 'active' : ''}`}
                  onClick={() => {
                    router.push(item.path);
                    setSidebarOpen(false);
                  }}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{getInitials(activeAccount)}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">
                {activeAccount?.nickname || user?.name || 'Carregando...'}
              </div>
              <div className="sidebar-user-role">
                 {user?.role === 'admin' ? 'Administrador' : user?.role === 'operador' ? 'Operador' : 'Vendedor ML'}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="btn btn-icon btn-outline"
              title="Sair"
              style={{ marginLeft: 'auto', padding: '6px', fontSize: '0.9rem' }}
            >
              🚪
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        <header className="content-header">
          <div className="flex items-center gap-md">
            <button
              className="btn btn-icon btn-outline"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ display: 'none' }}
              id="mobile-menu-btn"
            >
              ☰
            </button>
            <h1 className="content-header-title">{getPageTitle()}</h1>
          </div>
          <div className="content-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {accounts.length > 0 && (
              <select 
                className="select select-sm select-bordered" 
                value={activeAccountId || ''} 
                onChange={(e) => {
                  if (e.target.value === 'ADD_NEW') {
                    window.location.href = '/api/auth/login';
                  } else {
                    setActiveAccountId(e.target.value);
                  }
                }}
                style={{ minWidth: '150px' }}
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.nickname}</option>
                ))}
                
                {user?.role === 'admin' && (
                  <option value="ADD_NEW">+ Adicionar Loja ML</option>
                )}
              </select>
            )}

            {activeAccount && (
              <span className="badge badge-success">
                ● Conectado
              </span>
            )}
          </div>
        </header>
        <div className="content-body">
          {children}
        </div>
      </main>

      <style jsx>{`
        @media (max-width: 1024px) {
          .mobile-overlay { display: block !important; }
          #mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </DashboardContext.Provider>
  );
}
