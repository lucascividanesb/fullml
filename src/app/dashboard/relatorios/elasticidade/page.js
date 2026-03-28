'use client';

import { useState, useEffect, useRef } from 'react';

export default function ElasticidadePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef(null);

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
          // Simulated elasticity: estimate price sensitivity
          const sellThrough = item.sold_quantity > 0 ? item.sold_quantity / ((item.sold_quantity + item.available_quantity) || 1) : 0;
          const pricePosition = item.price || 0;
          const elasticity = sellThrough > 0.7 ? 'Alta' : sellThrough > 0.3 ? 'Média' : 'Baixa';
          
          return {
            ...item,
            daily_avg: dailyAvg,
            sell_through: sellThrough,
            elasticity,
            abc_class: sales.abc_class || 'C',
            revenue_30d: sales.revenue || 0,
          };
        })
        .filter(i => i.daily_avg > 0)
        .sort((a, b) => b.sell_through - a.sell_through);

      setItems(enriched);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (!canvasRef.current || items.length === 0) return;
    drawScatter();
  }, [items]);

  function drawScatter() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.parentElement.clientWidth;
    const h = canvas.height = 300;
    const pad = { top: 30, right: 30, bottom: 50, left: 70 };
    const chartW = w - pad.left - pad.right;
    const chartH = h - pad.top - pad.bottom;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#1A1A3E';
    ctx.fillRect(0, 0, w, h);

    const maxPrice = Math.max(...items.map(i => i.price));
    const maxSales = Math.max(...items.map(i => i.daily_avg));

    // Grid
    ctx.strokeStyle = 'rgba(108,92,231,0.1)';
    for (let i = 0; i <= 5; i++) {
      const y = pad.top + (chartH / 5) * i;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke();
    }

    // Points
    items.forEach(item => {
      const x = pad.left + (item.price / maxPrice) * chartW;
      const y = pad.top + chartH - (item.daily_avg / maxSales) * chartH;
      const r = Math.max(4, Math.min(12, item.sell_through * 15));

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = item.elasticity === 'Alta' ? 'rgba(0,184,148,0.7)' :
                       item.elasticity === 'Média' ? 'rgba(253,203,110,0.7)' : 'rgba(255,107,107,0.5)';
      ctx.fill();
      ctx.strokeStyle = item.elasticity === 'Alta' ? '#00B894' :
                        item.elasticity === 'Média' ? '#FDCB6E' : '#FF6B6B';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Axes labels
    ctx.fillStyle = '#6B6B8D';
    ctx.font = '11px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Preço →', w / 2, h - 10);
    ctx.save();
    ctx.translate(15, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Vendas/Dia →', 0, 0);
    ctx.restore();
  }

  const formatCurrency = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

  if (loading) return <div className="loading-overlay"><div className="spinner" style={{ width: 40, height: 40 }}></div><p>Calculando elasticidade...</p></div>;

  return (
    <div>
      <div className="kpi-grid mb-lg">
        <div className="kpi-card green">
          <div className="kpi-label">Alta Elasticidade</div>
          <div className="kpi-value">{items.filter(i => i.elasticity === 'Alta').length}</div>
          <span className="text-xs text-muted">Sell-through &gt; 70%</span>
        </div>
        <div className="kpi-card orange">
          <div className="kpi-label">Média Elasticidade</div>
          <div className="kpi-value">{items.filter(i => i.elasticity === 'Média').length}</div>
          <span className="text-xs text-muted">Sell-through 30-70%</span>
        </div>
        <div className="kpi-card red">
          <div className="kpi-label">Baixa Elasticidade</div>
          <div className="kpi-value">{items.filter(i => i.elasticity === 'Baixa').length}</div>
          <span className="text-xs text-muted">Sell-through &lt; 30%</span>
        </div>
      </div>

      <div className="card mb-lg">
        <div className="card-header">
          <span className="card-title">Preço vs Vendas (Tamanho = Sell-through)</span>
        </div>
        <canvas ref={canvasRef} style={{ width: '100%', borderRadius: '8px' }}></canvas>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr><th>Produto</th><th>Preço</th><th>Vendas/Dia</th><th>Sell-through</th><th>Elasticidade</th><th>ABC</th></tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td className="truncate" style={{ maxWidth: '250px' }}>{item.title}</td>
                <td className="font-semibold">{formatCurrency(item.price)}</td>
                <td>{item.daily_avg.toFixed(1)}</td>
                <td>
                  <div className="flex items-center gap-sm">
                    <div className="progress-bar" style={{ width: '60px' }}>
                      <div className="progress-fill" style={{ width: `${(item.sell_through * 100)}%`, background: item.elasticity === 'Alta' ? 'var(--success)' : item.elasticity === 'Média' ? 'var(--warning)' : 'var(--danger)' }}></div>
                    </div>
                    <span className="text-xs">{(item.sell_through * 100).toFixed(0)}%</span>
                  </div>
                </td>
                <td><span className={`badge ${item.elasticity === 'Alta' ? 'badge-success' : item.elasticity === 'Média' ? 'badge-warning' : 'badge-danger'}`}>{item.elasticity}</span></td>
                <td><span className={`badge ${item.abc_class === 'A' ? 'badge-success' : item.abc_class === 'B' ? 'badge-warning' : 'badge-info'}`}>{item.abc_class}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
