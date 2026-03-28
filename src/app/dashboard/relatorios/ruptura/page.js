'use client';

import { useState, useEffect } from 'react';

export default function RupturaPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [itemsRes, stockRes] = await Promise.all([
        fetch('/api/ml/items?limit=50').then(r => r.json()),
        fetch('/api/ml/stock').then(r => r.json()),
      ]);
      const salesMap = {};
      for (const s of (stockRes.sales_data || [])) salesMap[s.id] = s;

      const ruptured = (itemsRes.items || [])
        .map(item => {
          const sales = salesMap[item.id] || {};
          return {
            ...item,
            daily_avg: sales.daily_avg || 0,
            abc_class: sales.abc_class || 'C',
            lost_sales_day: (sales.daily_avg || 0) * (item.price || 0),
            sold_qty_30d: sales.sold_qty || 0,
          };
        })
        .filter(item => item.available_quantity === 0 && item.daily_avg > 0)
        .sort((a, b) => b.lost_sales_day - a.lost_sales_day);

      setItems(ruptured);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  const formatCurrency = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
  const totalLostPerDay = items.reduce((s, i) => s + i.lost_sales_day, 0);

  if (loading) return <div className="loading-overlay"><div className="spinner" style={{ width: 40, height: 40 }}></div><p>Analisando ruptura...</p></div>;

  return (
    <div>
      <div className="kpi-grid mb-lg">
        <div className="kpi-card red">
          <div className="kpi-label">Produtos em Ruptura</div>
          <div className="kpi-value" style={{ color: 'var(--danger)' }}>{items.length}</div>
        </div>
        <div className="kpi-card orange">
          <div className="kpi-label">Perda Estimada/Dia</div>
          <div className="kpi-value" style={{ color: 'var(--warning)' }}>{formatCurrency(totalLostPerDay)}</div>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr><th>Produto</th><th>ABC</th><th>Vendas/Dia</th><th>Perda/Dia</th><th>Vendas (30d)</th><th>Ação</th></tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td>
                    <div className="flex items-center gap-sm">
                      {item.thumbnail && <img src={item.thumbnail} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }} />}
                      <span className="truncate" style={{ maxWidth: '250px' }}>{item.title}</span>
                    </div>
                  </td>
                  <td><span className={`badge ${item.abc_class === 'A' ? 'badge-success' : item.abc_class === 'B' ? 'badge-warning' : 'badge-info'}`}>{item.abc_class}</span></td>
                  <td>{item.daily_avg.toFixed(1)}</td>
                  <td className="font-bold text-danger">{formatCurrency(item.lost_sales_day)}</td>
                  <td>{item.sold_qty_30d}</td>
                  <td><a href="/dashboard/envios" className="btn btn-sm btn-accent">🚚 Enviar</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">✅</div>
          <div className="empty-state-title">Sem rupturas!</div>
          <p className="text-muted text-sm">Todos os produtos com vendas possuem estoque disponível</p>
        </div>
      )}
    </div>
  );
}
