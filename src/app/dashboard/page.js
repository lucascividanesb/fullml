'use client';

import { useState, useEffect } from 'react';

export default function DashboardHome() {
  const [kpis, setKpis] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError(''); // Clean error before retry
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      // We also need the current active account ID from our custom layout context if needed, 
      // but the API knows it via cookie.
      const [ordersRes, stockRes] = await Promise.all([
        fetch('/api/ml/orders?limit=10').then(r => r.json()),
        fetch('/api/ml/stock').then(r => r.json()),
      ]);

      if (ordersRes.error) {
        // ML 403 usually happens if the account was disconnected or token doesn't match seller
        if (ordersRes.error.includes('403') || ordersRes.error.includes('caller.id')) {
           throw new Error('Acesso negado (403). Por favor, tente reconectar sua conta no menu de Lojas ou trocar de conta ativa.');
        }
        throw new Error(ordersRes.error);
      }

      // Fetch Meta for current month
      // We rely on the API to give us the goal for the active account
      const session = await fetch('/api/auth/session').then(r => r.json());
      const activeAccId = localStorage.getItem('magiiv_active_account') || session.accounts?.[0]?.id;
      
      const goalsRes = await fetch(`/api/ml/goals?month=${currentMonth}&accountId=${activeAccId}`).then(r => r.json());
      const monthGoal = goalsRes[0]?.target_revenue || 0;

      const orders = ordersRes.results || [];
      const totalSales = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const paidOrders = orders.filter(o => o.status === 'paid');

      setKpis({
        total_orders: ordersRes.paging?.total || 0,
        recent_revenue: totalSales,
        paid_orders: paidOrders.length,
        total_items_sold: stockRes.total_items_sold || 0,
        abc_data: stockRes.sales_data || [],
        total_revenue_30d: stockRes.total_revenue || 0,
        month_goal: monthGoal,
        pct_completed: monthGoal > 0 ? (stockRes.total_revenue / monthGoal) * 100 : 0
      });

      setRecentOrders(orders.slice(0, 8));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner" style={{ width: 40, height: 40 }}></div>
        <p>Sincronizando dados do Mercado Livre...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</div>
        <h3 style={{ marginBottom: '8px' }}>Erro ao carregar dados</h3>
        <p className="text-muted" style={{ marginBottom: '20px' }}>{error}</p>
        <button className="btn btn-primary" onClick={loadDashboard}>Tentar Novamente</button>
      </div>
    );
  }

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const getStatusBadge = (status) => {
    const map = {
      paid: { class: 'badge-success', label: 'Pago' },
      cancelled: { class: 'badge-danger', label: 'Cancelado' },
      pending: { class: 'badge-warning', label: 'Pendente' },
    };
    const s = map[status] || { class: 'badge-info', label: status };
    return <span className={`badge ${s.class}`}>{s.label}</span>;
  };

  return (
    <div>
      {/* KPI Cards */}
      <div className="kpi-grid mb-lg">
        {/* Monthly Goal Widget */}
        <div className="kpi-card glass shadow-lg" style={{ gridColumn: 'span 2', background: 'linear-gradient(135deg, rgba(235,94,67,0.1), rgba(30,187,215,0.1))' }}>
          <div className="flex justify-between items-center mb-md">
            <div>
              <div className="kpi-label" style={{ fontSize: '0.9rem', marginBottom: '4px' }}>Meta de Faturamento (Mensal)</div>
              <div className="kpi-value text-xl">{formatCurrency(kpis?.total_revenue_30d)} / <span className="text-muted text-lg">{formatCurrency(kpis?.month_goal)}</span></div>
            </div>
            <div className="text-right">
              <div className="kpi-value" style={{ color: 'var(--primary-light)' }}>{kpis?.pct_completed?.toFixed(1)}%</div>
              <div className="text-xs text-muted">Batimento Atual</div>
            </div>
          </div>
          
          <div style={{ width: '100%', height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden' }}>
            <div 
              style={{ 
                width: `${Math.min(kpis?.pct_completed || 0, 100)}%`, 
                height: '100%', 
                background: 'linear-gradient(90deg, var(--primary), var(--accent))',
                transition: 'width 1.5s ease-in-out',
                boxShadow: '0 0 15px var(--primary-glow)'
              }} 
            />
          </div>
          
          <div className="flex justify-between mt-sm text-xs text-muted">
            <span>R$ 0,00</span>
            <span>Meta: {formatCurrency(kpis?.month_goal)}</span>
          </div>
        </div>

        <div className="kpi-card purple">
          <div className="kpi-icon" style={{ background: 'rgba(235,94,67,0.15)', color: 'var(--primary-light)' }}>
            💰
          </div>
          <div className="kpi-label">Receita (30 dias)</div>
          <div className="kpi-value">{formatCurrency(kpis?.total_revenue_30d)}</div>
          <div className="kpi-change positive">📈 Últimos 30 dias</div>
        </div>

        <div className="kpi-card teal">
          <div className="kpi-icon" style={{ background: 'rgba(30,187,215,0.15)', color: 'var(--accent)' }}>
            🛒
          </div>
          <div className="kpi-label">Pedidos Totais</div>
          <div className="kpi-value">{kpis?.total_orders?.toLocaleString('pt-BR')}</div>
          <div className="kpi-change positive">● Todos os períodos</div>
        </div>

        <div className="kpi-card green">
          <div className="kpi-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
            📦
          </div>
          <div className="kpi-label">Unidades Vendidas</div>
          <div className="kpi-value">{kpis?.total_items_sold?.toLocaleString('pt-BR')}</div>
          <div className="kpi-change positive">📊 30 dias</div>
        </div>

        <div className="kpi-card orange">
          <div className="kpi-icon" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
            ✅
          </div>
          <div className="kpi-label">Pedidos Pagos (Recentes)</div>
          <div className="kpi-value">{kpis?.paid_orders}</div>
          <div className="kpi-change positive">● Na última página</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Recent Orders */}
        <div className="card" style={{ gridColumn: recentOrders.length ? '1' : '1 / -1' }}>
          <div className="card-header">
            <span className="card-title">Pedidos Recentes</span>
            <a href="/dashboard/pedidos" className="btn btn-sm btn-outline">Ver Todos</a>
          </div>
          {recentOrders.length > 0 ? (
            <div className="table-container" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Pedido</th>
                    <th>Data</th>
                    <th>Valor</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="font-semibold">#{order.id}</td>
                      <td className="text-muted text-sm">{formatDate(order.date_created)}</td>
                      <td className="font-semibold">{formatCurrency(order.total_amount)}</td>
                      <td>{getStatusBadge(order.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🛒</div>
              <div className="empty-state-title">Nenhum pedido encontrado</div>
              <p className="text-muted text-sm">Os pedidos aparecerão aqui à medida que forem feitos</p>
            </div>
          )}
        </div>

        {/* ABC Curve quick view */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Curva ABC (Top 10)</span>
            <a href="/dashboard/relatorios/curva-abc" className="btn btn-sm btn-outline">Completo</a>
          </div>
          {kpis?.abc_data?.length > 0 ? (
            <div className="table-container" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Classe</th>
                    <th>Vendas</th>
                    <th>Receita</th>
                  </tr>
                </thead>
                <tbody>
                  {kpis.abc_data.slice(0, 10).map((item, idx) => (
                    <tr key={idx}>
                      <td className="truncate" style={{ maxWidth: '200px' }}>{item.title}</td>
                      <td>
                        <span className={`badge ${
                          item.abc_class === 'A' ? 'badge-success' :
                          item.abc_class === 'B' ? 'badge-warning' : 'badge-danger'
                        }`}>
                          {item.abc_class}
                        </span>
                      </td>
                      <td>{item.sold_qty}</td>
                      <td className="font-semibold">{formatCurrency(item.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📈</div>
              <div className="empty-state-title">Sem dados suficientes</div>
              <p className="text-muted text-sm">Dados serão calculados com base em suas vendas</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
