'use client';

import { useState, useEffect } from 'react';

export default function EstoquePage() {
  const [items, setItems] = useState([]);
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [targetDays, setTargetDays] = useState(15);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterABC, setFilterABC] = useState('all');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [itemsRes, stockRes] = await Promise.all([
        fetch('/api/ml/items?limit=50').then(r => r.json()),
        fetch('/api/ml/stock').then(r => r.json()),
      ]);

      const salesMap = {};
      for (const s of (stockRes.sales_data || [])) {
        salesMap[s.id] = s;
      }

      const enriched = (itemsRes.items || []).map(item => {
        const sales = salesMap[item.id] || {};
        const availableQty = item.available_quantity || 0;
        const dailyAvg = sales.daily_avg || 0;
        const coverageDays = dailyAvg > 0 ? Math.round(availableQty / dailyAvg) : 999;
        const needsReplenishment = coverageDays < targetDays;
        const qtyToSend = needsReplenishment 
          ? Math.max(0, Math.ceil(dailyAvg * targetDays) - availableQty)
          : 0;

        return {
          ...item,
          sold_qty_30d: sales.sold_qty || 0,
          daily_avg: dailyAvg,
          abc_class: sales.abc_class || 'C',
          revenue_30d: sales.revenue || 0,
          coverage_days: coverageDays,
          needs_replenishment: needsReplenishment,
          qty_to_send: qtyToSend,
        };
      });

      setItems(enriched);
      setStockData(stockRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = !searchTerm || 
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesABC = filterABC === 'all' || item.abc_class === filterABC;
    return matchesSearch && matchesABC;
  });

  const inRupture = items.filter(i => i.available_quantity === 0 && i.daily_avg > 0);
  const lowStock = items.filter(i => i.coverage_days < targetDays && i.coverage_days > 0);

  const formatCurrency = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner" style={{ width: 40, height: 40 }}></div>
        <p>Carregando estoque...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Quick KPIs */}
      <div className="kpi-grid mb-lg">
        <div className="kpi-card purple">
          <div className="kpi-label">Total de Anúncios</div>
          <div className="kpi-value">{items.length}</div>
        </div>
        <div className="kpi-card red">
          <div className="kpi-label">Em Ruptura</div>
          <div className="kpi-value" style={{ color: 'var(--danger)' }}>{inRupture.length}</div>
        </div>
        <div className="kpi-card orange">
          <div className="kpi-label">Estoque Baixo</div>
          <div className="kpi-value" style={{ color: 'var(--warning)' }}>{lowStock.length}</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-label">Dias Alvo</div>
          <div className="kpi-value">{targetDays}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box" style={{ flex: 1, maxWidth: '300px' }}>
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="form-input"
            placeholder="Buscar por título ou ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="form-group" style={{ minWidth: '120px' }}>
          <select className="form-select" value={filterABC} onChange={(e) => setFilterABC(e.target.value)}>
            <option value="all">Curva ABC: Todas</option>
            <option value="A">Classe A</option>
            <option value="B">Classe B</option>
            <option value="C">Classe C</option>
          </select>
        </div>

        <div className="form-group" style={{ minWidth: '160px' }}>
          <label className="form-label" style={{ fontSize: '0.7rem' }}>Dias de Estoque Alvo</label>
          <input
            type="number"
            className="form-input"
            value={targetDays}
            onChange={(e) => setTargetDays(parseInt(e.target.value) || 1)}
            min="1"
            max="90"
          />
        </div>

        <button className="btn btn-primary" onClick={loadData}>
          🔄 Atualizar
        </button>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Produto</th>
              <th>ID</th>
              <th>ABC</th>
              <th>Estoque</th>
              <th>Vendas (30d)</th>
              <th>Dimensões (Vol)</th>
              <th>Cobertura</th>
              <th>Enviar</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => {
              const getAttr = (id) => item.attributes?.find(a => a.id === id)?.value_name || '—';
              const volString = `${getAttr('PACKAGE_HEIGHT')}x${getAttr('PACKAGE_WIDTH')}x${getAttr('PACKAGE_LENGTH')} cm (${getAttr('PACKAGE_WEIGHT')}g)`;
              
              return (
                <tr key={item.id}>
                  <td className="truncate" style={{ maxWidth: '250px' }}>
                    <div className="flex items-center gap-sm">
                      {item.thumbnail && (
                        <img 
                          src={item.thumbnail} 
                          alt="" 
                          style={{ 
                            width: 32, height: 32, borderRadius: 6, objectFit: 'cover',
                            border: '1px solid var(--border)' 
                          }} 
                        />
                      )}
                      <span>{item.title}</span>
                    </div>
                  </td>
                  <td className="text-muted text-xs">{item.id}</td>
                  <td>
                    <span className={`badge ${
                      item.abc_class === 'A' ? 'badge-success' :
                      item.abc_class === 'B' ? 'badge-warning' : 'badge-info'
                    }`}>
                      {item.abc_class}
                    </span>
                  </td>
                  <td className="font-semibold">{item.available_quantity}</td>
                  <td>{item.sold_qty_30d}</td>
                  <td className="text-xs text-muted">{volString}</td>
                  <td>
                    <span className={`badge ${
                      item.coverage_days === 999 ? 'badge-info' :
                      item.coverage_days < 5 ? 'badge-danger' :
                      item.coverage_days < targetDays ? 'badge-warning' : 'badge-success'
                    }`}>
                      {item.coverage_days === 999 ? '∞' : `${item.coverage_days}d`}
                    </span>
                  </td>
                  <td className="font-bold" style={{ color: item.qty_to_send > 0 ? 'var(--warning)' : 'var(--text-muted)' }}>
                    {item.qty_to_send > 0 ? `+${item.qty_to_send}` : '—'}
                  </td>
                  <td>
                    {item.available_quantity === 0 && item.daily_avg > 0 ? (
                      <span className="badge badge-danger">🔴 Ruptura</span>
                    ) : item.needs_replenishment ? (
                      <span className="badge badge-warning">⚠️ Repor</span>
                    ) : (
                      <span className="badge badge-success">✅ OK</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredItems.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <div className="empty-state-title">Nenhum produto encontrado</div>
        </div>
      )}
    </div>
  );
}
