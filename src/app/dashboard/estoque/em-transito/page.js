'use client';

import { useState, useEffect } from 'react';

export default function EmTransitoPage() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShipments();
  }, []);

  async function loadShipments() {
    setLoading(true);
    try {
      const res = await fetch('/api/ml/inbounds');
      const data = await res.json();
      if (data.shipments) {
        setShipments(data.shipments);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'in_transit': return <span className="badge badge-primary">Em trânsito</span>;
      case 'receiving': return <span className="badge badge-warning">Sendo Recebido</span>;
      case 'ready': return <span className="badge badge-info">Pronto para envio</span>;
      case 'closed': return <span className="badge badge-success">Concluído</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner" style={{ width: 40, height: 40 }}></div>
        <p>Buscando remessas ativas do Full...</p>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="mb-md">
        <p className="text-muted">Acompanhe as suas remessas de estoque enviadas ao centro de distribuição (Fulfillment).</p>
      </div>

      <div className="kpi-grid mb-lg">
        <div className="kpi-card teal">
          <div className="kpi-label">Remessas em Aberto</div>
          <div className="kpi-value">{shipments.filter(s => s.status !== 'closed').length}</div>
        </div>
        <div className="kpi-card orange">
          <div className="kpi-label">Unidades Declaradas</div>
          <div className="kpi-value">{shipments.reduce((acc, s) => acc + s.declared_units, 0)}</div>
        </div>
      </div>

      {shipments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🚚</div>
          <div className="empty-state-title">Nenhuma remessa ativa</div>
          <p className="text-muted">Você não tem estoques a caminho do Full no momento.</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID da Remessa</th>
                  <th>Destino</th>
                  <th>Status</th>
                  <th>Criado Em</th>
                  <th>Previsão Logística</th>
                  <th>Unidades Declaradas</th>
                  <th>Progresso de Recebimento</th>
                </tr>
              </thead>
              <tbody>
                {shipments.map((sh) => {
                  const progress = sh.declared_units > 0 ? Math.round((sh.received_units / sh.declared_units) * 100) : 0;
                  return (
                    <tr key={sh.id}>
                      <td className="font-bold">{sh.id}</td>
                      <td>{sh.destination}</td>
                      <td>{getStatusBadge(sh.status)}</td>
                      <td className="text-sm">
                        {new Date(sh.date_created).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="text-sm">
                        {sh.estimated_delivery ? new Date(sh.estimated_delivery).toLocaleDateString('pt-BR') : 'Não estipulada'}
                      </td>
                      <td className="font-bold">{sh.declared_units} un.</td>
                      <td>
                        <div className="flex items-center gap-sm">
                          <div style={{ flex: 1, height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.min(100, progress)}%`, background: 'var(--success)', transition: 'width 0.5s ease' }}></div>
                          </div>
                          <span className="text-xs" style={{ minWidth: '40px' }}>
                            {sh.received_units}/{sh.declared_units}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
