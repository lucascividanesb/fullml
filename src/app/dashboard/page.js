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
    try {
      const [ordersRes, stockRes] = await Promise.all([
        fetch('/api/ml/orders?limit=10').then(r => r.json()),
        fetch('/api/ml/stock').then(r => r.json()),
      ]);

      if (ordersRes.error) throw new Error(ordersRes.error);

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
        <div className="kpi-card purple">
          <div className="kpi-icon" style={{ background: 'rgba(108,92,231,0.15)', color: 'var(--primary-light)' }}>
            💰
          </div>
          <div className="kpi-label">Receita (30 dias)</div>
          <div className="kpi-value">{formatCurrency(kpis?.total_revenue_30d)}</div>
          <div className="kpi-change positive">📈 Últimos 30 dias</div>
        </div>

        <div className="kpi-card teal">
          <div className="kpi-icon" style={{ background: 'rgba(0,210,211,0.15)', color: 'var(--accent)' }}>
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
