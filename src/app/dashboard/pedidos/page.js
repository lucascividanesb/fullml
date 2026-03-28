'use client';

import { useState, useEffect } from 'react';

export default function PedidosPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);

  useEffect(() => { loadOrders(); }, [page, statusFilter]);

  async function loadOrders() {
    setLoading(true);
    try {
      let url = `/api/ml/orders?offset=${page * 50}&limit=50`;
      if (statusFilter !== 'all') url += `&order_status=${statusFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      setOrders(data.results || []);
      setTotal(data.paging?.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
  const formatDate = (d) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });

  const statusBadge = (status) => {
    const m = { paid: ['badge-success', 'Pago'], cancelled: ['badge-danger', 'Cancelado'], pending: ['badge-warning', 'Pendente'] };
    const [cls, lbl] = m[status] || ['badge-info', status];
    return <span className={`badge ${cls}`}>{lbl}</span>;
  };

  const totalRevenue = orders.filter(o => o.status === 'paid').reduce((s, o) => s + (o.total_amount || 0), 0);

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner" style={{ width: 40, height: 40 }}></div>
        <p>Carregando pedidos...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="kpi-grid mb-lg">
        <div className="kpi-card purple">
          <div className="kpi-label">Total de Pedidos</div>
          <div className="kpi-value">{total}</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-label">Receita (Página Atual)</div>
          <div className="kpi-value">{formatCurrency(totalRevenue)}</div>
        </div>
      </div>

      <div className="filters-bar">
        <select className="form-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }} style={{ maxWidth: '180px' }}>
          <option value="all">Todos os Status</option>
          <option value="paid">Pagos</option>
          <option value="cancelled">Cancelados</option>
          <option value="pending">Pendentes</option>
        </select>
        <button className="btn btn-primary" onClick={loadOrders}>🔄 Atualizar</button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Data</th>
              <th>Comprador</th>
              <th>Itens</th>
              <th>Valor Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="font-semibold">#{order.id}</td>
                <td className="text-sm text-muted">{formatDate(order.date_created)}</td>
                <td>{order.buyer?.nickname || '—'}</td>
                <td>
                  {(order.order_items || []).map((oi, idx) => (
                    <div key={idx} className="text-sm truncate" style={{ maxWidth: '200px' }}>
                      {oi.quantity}x {oi.item?.title}
                    </div>
                  )).slice(0, 2)}
                  {(order.order_items?.length || 0) > 2 && (
                    <span className="text-xs text-muted">+{order.order_items.length - 2} mais</span>
                  )}
                </td>
                <td className="font-semibold">{formatCurrency(order.total_amount)}</td>
                <td>{statusBadge(order.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {orders.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🛒</div>
          <div className="empty-state-title">Nenhum pedido encontrado</div>
        </div>
      )}

      <div className="flex items-center justify-between mt-md">
        <span className="text-sm text-muted">
          Mostrando {page * 50 + 1}–{Math.min((page + 1) * 50, total)} de {total}
        </span>
        <div className="btn-group">
          <button className="btn btn-sm btn-outline" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}>← Anterior</button>
          <button className="btn btn-sm btn-outline" onClick={() => setPage(page + 1)} disabled={(page + 1) * 50 >= total}>Próximo →</button>
        </div>
      </div>
    </div>
  );
}
