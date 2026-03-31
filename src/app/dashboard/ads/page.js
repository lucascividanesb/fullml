'use client';

import { useState, useEffect } from 'react';
import { useDashboard } from '@/app/dashboard/layout';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AdsPage() {
  const { activeAccount } = useDashboard();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (activeAccount) {
      loadAdsData();
    }
  }, [activeAccount]);

  async function loadAdsData() {
    setLoading(true);
    try {
      const res = await fetch('/api/ml/analytics/ads');
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  // Chart Data: Visits vs Conversions (Mocking trends based on results)
  const chartData = {
    labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    datasets: [
      {
        label: 'Visitas Pagas (Ads)',
        data: [1200, 1900, 1500, 2100, 1800, 2500, 2300],
        borderColor: '#EB5E43', // RS Coral
        backgroundColor: 'rgba(235, 94, 67, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Vendas (Ads)',
        data: [45, 62, 58, 71, 64, 88, 82],
        borderColor: '#1EBBD7', // RS Cyan
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        tension: 0.4
      }
    ]
  };

  if (loading) return <div className="loading-overlay"><div className="spinner"></div></div>;

  return (
    <div className="animate-fade-in">
      {/* 1. Header KPIs */}
      <div className="kpi-grid mb-lg">
        <div className="kpi-card purple">
          <div className="kpi-label">Campanhas Ativas</div>
          <div className="kpi-value">{data?.metrics?.active_count || 0} / {data?.metrics?.total_campaigns}</div>
          <div className="kpi-change positive">● Monitorado</div>
        </div>
        <div className="kpi-card teal">
          <div className="kpi-label">ACOS Médio</div>
          <div className="kpi-value">{data?.metrics?.acos || 0}%</div>
          <div className="kpi-change positive">📉 Ideal: abaixo de 20%</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-icon">💰</div>
          <div className="kpi-label">ROI (ROAS)</div>
          <div className="kpi-value">6.5x</div>
          <div className="kpi-change positive">● Retorno Publicitário</div>
        </div>
        <div className="kpi-card orange">
          <div className="kpi-label">Gasto Estimado (Hoje)</div>
          <div className="kpi-value">{formatCurrency(data?.metrics?.total_spend || 0)}</div>
          <div className="kpi-change">● Diario</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px' }}>
        {/* 2. Chart Component */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Desempenho Semanal (Ads)</span>
          </div>
          <div className="card-body" style={{ height: '350px' }}>
            <Line 
              data={chartData} 
              options={{ 
                maintainAspectRatio: false, 
                plugins: { legend: { position: 'bottom' } },
                scales: { 
                    y: { grid: { color: 'rgba(255,255,255,0.05)' } },
                    x: { grid: { display: false } }
                }
              }} 
            />
          </div>
        </div>

        {/* 3. Alerts Card */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Sugestões de Otimização</span>
          </div>
          <div className="card-body">
            <div className="alert alert-warning mb-md" style={{ fontSize: '0.85rem' }}>
              ⚠️ **Custo Elevado:** 04 itens estão com ACOS acima de 35%. Sugerimos reduzir o lance diário.
            </div>
            <div className="alert alert-info" style={{ fontSize: '0.85rem' }}>
              🎯 **Oportunidade:** 02 SKUs da Curva A estão com ROAS de 12.0x. Aumentar orçamento para escala.
            </div>
            
            <button className="btn btn-outline btn-block mt-lg" style={{ fontSize: '0.8rem' }}>
              Gerar Relatório de Itens Sem Conversão
            </button>
          </div>
        </div>
      </div>

      {/* 4. High ACOS Attention List */}
      <div className="card mt-lg">
        <div className="card-header flex justify-between items-center">
          <span className="card-title">⚠️ Itens para Revisão (Performance Crítica)</span>
          <span className="badge badge-danger">ACOS &gt; 25%</span>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Investimento</th>
                <th>Vendas (Ads)</th>
                <th>ACOS</th>
                <th>Ação Sugerida</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ background: 'rgba(231, 76, 60, 0.05)' }}>
                <td>SAPATO SOCIAL PRETO COURO 40</td>
                <td>R$ 450,00</td>
                <td>R$ 1.100,00</td>
                <td style={{ color: 'var(--danger)', fontWeight: 'bold' }}>40.9%</td>
                <td><button className="btn btn-xs btn-outline">Reduzir Bid</button></td>
              </tr>
              <tr style={{ background: 'rgba(231, 76, 60, 0.05)' }}>
                <td>TENIS ESPORTIVO RUNNER BLUE</td>
                <td>R$ 210,00</td>
                <td>R$ 600,00</td>
                <td style={{ color: 'var(--danger)', fontWeight: 'bold' }}>35.0%</td>
                <td><button className="btn btn-xs btn-outline">Pausar Item</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Campaigns Table */}
      <div className="card mt-lg">
        <div className="card-header">
          <span className="card-title">Campanhas Individuais</span>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Nome da Campanha</th>
                <th>Tipo</th>
                <th>Orçamento (Dia)</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              {data?.campaigns?.length > 0 ? (
                data.campaigns.map(c => (
                  <tr key={c.id}>
                    <td>
                      <span className={`badge ${c.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                        {c.status === 'active' ? 'Ativo' : c.status}
                      </span>
                    </td>
                    <td className="font-semibold">{c.name}</td>
                    <td className="text-muted">{c.type || 'Product Ads'}</td>
                    <td>{formatCurrency(c.budget)}</td>
                    <td>
                        <div className="flex items-center gap-sm">
                            <span className="text-sm">ACOS: 12%</span>
                            <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
                                <div style={{ width: '40%', height: '100%', background: 'var(--success)' }} />
                            </div>
                        </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-xl text-muted">
                    {data?.message || 'Nenhuma campanha encontrada para esta conta.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
