'use client';

import { useState } from 'react';

export default function AdsPage() {
  const [campaigns] = useState([]);

  return (
    <div>
      <div className="kpi-grid mb-lg">
        <div className="kpi-card purple">
          <div className="kpi-label">Campanhas Ativas</div>
          <div className="kpi-value">—</div>
        </div>
        <div className="kpi-card teal">
          <div className="kpi-label">Gasto Total</div>
          <div className="kpi-value">—</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-label">Conversões</div>
          <div className="kpi-value">—</div>
        </div>
        <div className="kpi-card orange">
          <div className="kpi-label">ACOS</div>
          <div className="kpi-value">—</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Gestão de Ads - Mercado Livre</span>
        </div>

        {campaigns.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📣</div>
            <div className="empty-state-title">Gestão de Ads</div>
            <p className="text-muted text-sm" style={{ maxWidth: '400px', margin: '0 auto' }}>
              A gestão de campanhas do Mercado Livre Ads será exibida aqui. 
              Conecte sua conta para gerenciar campanhas, monitorar gastos e otimizar performance.
            </p>
            <div style={{ marginTop: '24px' }}>
              <h4 style={{ marginBottom: '12px', color: 'var(--text-secondary)' }}>Funcionalidades:</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', maxWidth: '400px', margin: '0 auto', textAlign: 'left' }}>
                <div className="text-sm">🔔 Alertas de performance</div>
                <div className="text-sm">💰 Gastos sem conversão</div>
                <div className="text-sm">🎯 Campanhas acima da meta</div>
                <div className="text-sm">📊 ACOS por produto</div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
