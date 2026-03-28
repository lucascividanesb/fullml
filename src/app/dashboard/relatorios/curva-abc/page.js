'use client';

import { useState, useEffect, useRef } from 'react';

export default function CurvaABCPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch('/api/ml/stock');
      const stockData = await res.json();
      setData(stockData.sales_data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return;
    drawChart();
  }, [data]);

  function drawChart() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.parentElement.clientWidth;
    const h = canvas.height = 300;
    const pad = { top: 20, right: 40, bottom: 60, left: 60 };
    const chartW = w - pad.left - pad.right;
    const chartH = h - pad.top - pad.bottom;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#1A1A3E';
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = 'rgba(108,92,231,0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = pad.top + (chartH / 5) * i;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke();
    }

    // Bars
    const barW = Math.max(2, (chartW / data.length) - 2);
    const maxRev = Math.max(...data.map(d => d.revenue));

    data.forEach((item, i) => {
      const x = pad.left + (i / data.length) * chartW;
      const barH = (item.revenue / maxRev) * chartH;
      const y = pad.top + chartH - barH;

      const color = item.abc_class === 'A' ? '#00B894' : item.abc_class === 'B' ? '#FDCB6E' : '#FF6B6B';
      ctx.fillStyle = color;
      ctx.fillRect(x, y, barW, barH);
    });

    // Cumulative line
    ctx.strokeStyle = '#A29BFE';
    ctx.lineWidth = 2;
    ctx.beginPath();
    data.forEach((item, i) => {
      const x = pad.left + (i / data.length) * chartW + barW / 2;
      const y = pad.top + chartH - (item.cumulative_pct / 100) * chartH;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // 80% and 95% lines
    [80, 95].forEach((pct, idx) => {
      const y = pad.top + chartH - (pct / 100) * chartH;
      ctx.strokeStyle = idx === 0 ? 'rgba(0,184,148,0.4)' : 'rgba(253,203,110,0.4)';
      ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = idx === 0 ? '#00B894' : '#FDCB6E';
      ctx.font = '10px Inter';
      ctx.fillText(`${pct}%`, w - pad.right + 4, y + 4);
    });

    // Y axis labels
    ctx.fillStyle = '#6B6B8D';
    ctx.font = '10px Inter';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const y = pad.top + (chartH / 5) * i;
      const val = ((5 - i) / 5 * 100).toFixed(0);
      ctx.fillText(`${val}%`, pad.left - 8, y + 4);
    }

    // Legend
    ctx.textAlign = 'left';
    const legends = [['A', '#00B894'], ['B', '#FDCB6E'], ['C', '#FF6B6B']];
    legends.forEach(([label, color], i) => {
      const x = pad.left + i * 80;
      ctx.fillStyle = color;
      ctx.fillRect(x, h - 20, 12, 12);
      ctx.fillStyle = '#A0A0C0';
      ctx.font = '11px Inter';
      ctx.fillText(`Classe ${label}`, x + 16, h - 10);
    });
  }

  const formatCurrency = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
  const classA = data.filter(d => d.abc_class === 'A');
  const classB = data.filter(d => d.abc_class === 'B');
  const classC = data.filter(d => d.abc_class === 'C');

  if (loading) return <div className="loading-overlay"><div className="spinner" style={{ width: 40, height: 40 }}></div><p>Calculando Curva ABC...</p></div>;

  return (
    <div>
      <div className="kpi-grid mb-lg">
        <div className="kpi-card green">
          <div className="kpi-label">Classe A (80% receita)</div>
          <div className="kpi-value" style={{ color: 'var(--success)' }}>{classA.length}</div>
          <span className="text-xs text-muted">{data.length > 0 ? ((classA.length / data.length) * 100).toFixed(0) : 0}% dos produtos</span>
        </div>
        <div className="kpi-card orange">
          <div className="kpi-label">Classe B (15% receita)</div>
          <div className="kpi-value" style={{ color: 'var(--warning)' }}>{classB.length}</div>
          <span className="text-xs text-muted">{data.length > 0 ? ((classB.length / data.length) * 100).toFixed(0) : 0}% dos produtos</span>
        </div>
        <div className="kpi-card red">
          <div className="kpi-label">Classe C (5% receita)</div>
          <div className="kpi-value" style={{ color: 'var(--danger)' }}>{classC.length}</div>
          <span className="text-xs text-muted">{data.length > 0 ? ((classC.length / data.length) * 100).toFixed(0) : 0}% dos produtos</span>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-label">Total Produtos</div>
          <div className="kpi-value">{data.length}</div>
        </div>
      </div>

      {/* Chart */}
      <div className="card mb-lg">
        <div className="card-header">
          <span className="card-title">Gráfico Curva ABC</span>
        </div>
        <canvas ref={canvasRef} style={{ width: '100%', borderRadius: '8px' }}></canvas>
      </div>

      {/* Data table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr><th>#</th><th>Produto</th><th>Classe</th><th>Vendas (30d)</th><th>Receita</th><th>% Acumulado</th></tr>
          </thead>
          <tbody>
            {data.map((item, idx) => (
              <tr key={idx}>
                <td className="text-muted">{idx + 1}</td>
                <td className="truncate" style={{ maxWidth: '300px' }}>{item.title}</td>
                <td><span className={`badge ${item.abc_class === 'A' ? 'badge-success' : item.abc_class === 'B' ? 'badge-warning' : 'badge-danger'}`}>{item.abc_class}</span></td>
                <td>{item.sold_qty}</td>
                <td className="font-semibold">{formatCurrency(item.revenue)}</td>
                <td>
                  <div className="flex items-center gap-sm">
                    <div className="progress-bar" style={{ width: '60px' }}>
                      <div className="progress-fill" style={{ width: `${item.cumulative_pct}%` }}></div>
                    </div>
                    <span className="text-xs">{item.cumulative_pct.toFixed(1)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
