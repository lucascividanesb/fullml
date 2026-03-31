'use client';

import { useState, useEffect } from 'react';
import { useDashboard } from '@/app/dashboard/layout';

export default function AlertasPage() {
  const { activeAccount } = useDashboard();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (activeAccount) {
      loadNotifications();
    }
  }, [activeAccount]);

  async function loadNotifications() {
    setLoading(true);
    try {
      const res = await fetch('/api/ml/notifications');
      const data = await res.json();
      setNotifs(data.notifications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleScan() {
    setScanning(true);
    try {
      const res = await fetch('/api/ml/alerts/scan', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert(`Escaneamento concluído! ${data.new_alerts || 0} novos alertas encontrados.`);
        loadNotifications();
      } else {
        alert('Falha ao escanear alertas.');
      }
    } catch (e) {
      alert('Erro de conexão');
    } finally {
      setScanning(false);
    }
  }

  async function markRead(id) {
    try {
      await fetch('/api/ml/notifications', { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      loadNotifications();
    } catch (e) {}
  }

  if (loading) return <div className="loading-overlay"><div className="spinner"></div></div>;

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-lg">
        <h2 className="card-title">🔔 Central de Alertas & Notificações</h2>
        <button 
          className={`btn btn-primary ${scanning ? 'loading' : ''}`}
          disabled={scanning}
          onClick={handleScan}
        >
          {scanning ? 'Escaneando...' : '🔍 Escanear por Problemas'}
        </button>
      </div>

      <div className="card">
        <div className="card-header flex justify-between">
          <span className="card-title">Mensagens Recentes</span>
          <button className="btn btn-xs btn-outline" onClick={() => markRead('all')}>Marcar todas como lidas</button>
        </div>
        
        <div className="card-body">
          {notifs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">✅</div>
              <div className="empty-state-title">Nenhum alerta encontrado</div>
              <p className="text-muted text-sm">Clique no botão de Escaneamento para verificar novos problemas.</p>
            </div>
          ) : (
            <div className="notification-list">
              {notifs.map((n) => (
                <div 
                  key={n.id} 
                  className={`alert mb-md ${n.is_read ? 'opacity-50' : 'shadow-sm animate-slide-up'}`}
                  style={{ 
                    borderLeft: `5px solid var(--${n.type === 'danger' ? 'danger' : n.type === 'warning' ? 'warning' : 'info'})`,
                    background: 'rgba(255,255,255,0.03)',
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div className="flex items-center gap-sm mb-xs">
                      <span className="text-xs text-muted">
                        {new Date(n.created_at).toLocaleString('pt-BR')}
                      </span>
                      {!n.is_read && <span className="badge badge-danger" style={{ fontSize: '0.6rem' }}>NOVO</span>}
                    </div>
                    <div className="font-bold mb-xs">{n.title}</div>
                    <div className="text-sm text-muted">{n.message}</div>
                  </div>
                  {!n.is_read && (
                    <button className="btn btn-icon btn-xs btn-outline" onClick={() => markRead(n.id)} title="Fechar">
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
