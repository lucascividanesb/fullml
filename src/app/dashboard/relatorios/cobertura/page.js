'use client';

import { useState, useEffect } from 'react';

export default function CoberturaPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [targetDays, setTargetDays] = useState(15);

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

      const enriched = (itemsRes.items || [])
        .map(item => {
          const sales = salesMap[item.id] || {};
          const dailyAvg = sales.daily_avg || 0;
          const coverage = dailyAvg > 0 ? Math.round(item.available_quantity / dailyAvg) : 999;
          return { ...item, daily_avg: dailyAvg, coverage_days: coverage, abc_class: sales.abc_class || 'C' };
        })
        .filter(item => item.daily_avg > 0)
        .sort((a, b) => a.coverage_days - b.coverage_days);

      setItems(enriched);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  const critical = items.filter(i => i.coverage_days < 5);
  const low = items.filter(i => i.coverage_days >= 5 && i.coverage_days < targetDays);
  const ok = items.filter(i => i.coverage_days >= targetDays);

  if (loading) return <div className="loading-overlay"><div className="spinner" style={{ width: 40, height: 40 }}></div><p>Calculando cobertura...</p></div>;

  return (
    <div>
      <div className="kpi-grid mb-lg">
        <div className="kpi-card red">
          <div className="kpi-label">Crítico (&lt;5 dias)</div>
          <div className="kpi-value" style={{ color: 'var(--danger)' }}>{critical.length}</div>
        </div>
        <div className="kpi-card orange">
          <div className="kpi-label">Baixo (&lt;{targetDays} dias)</div>
          <div className="kpi-value" style={{ color: 'var(--warning)' }}>{low.length}</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-label">Adequado</div>
          <div className="kpi-value" style={{ color: 'var(--success)' }}>{ok.length}</div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-label">Total Analisados</div>
          <div className="kpi-value">{items.length}</div>
        </div>
      </div>

      <div className="filters-bar">
        <div className="form-group" style={{ minWidth: '160px' }}>
          <label className="form-label" style={{ fontSize: '0.7rem' }}>Dias Alvo</label>
          <input type="number" className="form-input" value={targetDays} onChange={(e) => setTargetDays(parseInt(e.target.value) || 1)} min="1" max="90" />
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr><th>Produto</th><th>ABC</th><th>Estoque</th><th>Média/Dia</th><th>Cobertura</th><th>Status</th></tr>
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
                <td>{item.available_quantity}</td>
                <td>{item.daily_avg.toFixed(1)}</td>
                <td>
                  <div className="flex items-center gap-sm">
                    <div className="progress-bar" style={{ width: '80px' }}>
                      <div className="progress-fill" style={{
                        width: `${Math.min(100, (item.coverage_days / targetDays) * 100)}%`,
                        background: item.coverage_days < 5 ? 'var(--danger)' : item.coverage_days < targetDays ? 'var(--warning)' : 'var(--success)',
                      }}></div>
                    </div>
                    <span className="font-semibold text-sm">{item.coverage_days === 999 ? '∞' : `${item.coverage_days}d`}</span>
                  </div>
                </td>
                <td>
                  {item.coverage_days < 5 ? <span className="badge badge-danger">🔴 Crítico</span> :
                   item.coverage_days < targetDays ? <span className="badge badge-warning">⚠️ Baixo</span> :
                   <span className="badge badge-success">✅ OK</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
