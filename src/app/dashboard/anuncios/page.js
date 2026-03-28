'use client';

import { useState, useEffect } from 'react';

export default function AnunciosPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => { loadItems(); }, [page]);

  async function loadItems() {
    setLoading(true);
    try {
      const res = await fetch(`/api/ml/items?offset=${page * 50}&limit=50`);
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = items.filter(item => {
    const matchSearch = !searchTerm || 
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id?.includes(searchTerm);
    const matchStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const formatCurrency = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

  const getStatusBadge = (status) => {
    const map = {
      active: { class: 'badge-success', label: 'Ativo' },
      paused: { class: 'badge-warning', label: 'Pausado' },
      closed: { class: 'badge-danger', label: 'Fechado' },
      under_review: { class: 'badge-info', label: 'Em revisão' },
    };
    const s = map[status] || { class: 'badge-info', label: status };
    return <span className={`badge ${s.class}`}>{s.label}</span>;
  };

  const getCondition = (condition) => {
    return condition === 'new' ? 'Novo' : 'Usado';
  };

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner" style={{ width: 40, height: 40 }}></div>
        <p>Carregando anúncios...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="kpi-grid mb-lg">
        <div className="kpi-card purple">
          <div className="kpi-label">Total de Anúncios</div>
          <div className="kpi-value">{total}</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-label">Ativos</div>
          <div className="kpi-value">{items.filter(i => i.status === 'active').length}</div>
        </div>
        <div className="kpi-card orange">
          <div className="kpi-label">Pausados</div>
          <div className="kpi-value">{items.filter(i => i.status === 'paused').length}</div>
        </div>
        <div className="kpi-card red">
          <div className="kpi-label">Fechados</div>
          <div className="kpi-value">{items.filter(i => i.status === 'closed').length}</div>
        </div>
      </div>

      <div className="filters-bar">
        <div className="search-box" style={{ flex: 1, maxWidth: '300px' }}>
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="form-input"
            placeholder="Buscar anúncio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ maxWidth: '180px' }}>
          <option value="all">Todos os Status</option>
          <option value="active">Ativo</option>
          <option value="paused">Pausado</option>
          <option value="closed">Fechado</option>
        </select>
        <button className="btn btn-primary" onClick={loadItems}>🔄 Atualizar</button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Produto</th>
              <th>ID</th>
              <th>Preço</th>
              <th>Estoque</th>
              <th>Vendidos</th>
              <th>Condição</th>
              <th>Tipo</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id}>
                <td>
                  <div className="flex items-center gap-sm">
                    {item.thumbnail && (
                      <img src={item.thumbnail} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', border: '1px solid var(--border)' }} />
                    )}
                    <div>
                      <div className="truncate" style={{ maxWidth: '250px', fontWeight: 500 }}>{item.title}</div>
                      <div className="text-xs text-muted">{item.category_id}</div>
                    </div>
                  </div>
                </td>
                <td className="text-xs text-muted">{item.id}</td>
                <td className="font-semibold">{formatCurrency(item.price)}</td>
                <td>{item.available_quantity}</td>
                <td>{item.sold_quantity || 0}</td>
                <td className="text-sm">{getCondition(item.condition)}</td>
                <td>
                  <span className={`badge ${item.listing_type_id?.includes('premium') ? 'badge-primary' : 'badge-info'}`}>
                    {item.listing_type_id?.includes('premium') ? 'Premium' : 
                     item.listing_type_id?.includes('gold') ? 'Clássico' : 'Grátis'}
                  </span>
                </td>
                <td>{getStatusBadge(item.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-md" style={{ padding: '12px 0' }}>
        <span className="text-sm text-muted">
          Mostrando {page * 50 + 1}–{Math.min((page + 1) * 50, total)} de {total}
        </span>
        <div className="btn-group">
          <button className="btn btn-sm btn-outline" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}>
            ← Anterior
          </button>
          <button className="btn btn-sm btn-outline" onClick={() => setPage(page + 1)} disabled={(page + 1) * 50 >= total}>
            Próximo →
          </button>
        </div>
      </div>
    </div>
  );
}
