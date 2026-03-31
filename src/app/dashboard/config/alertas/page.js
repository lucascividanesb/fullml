'use client';

import { useState, useEffect } from 'react';
import { useDashboard } from '@/app/dashboard/layout';

export default function ConfigAlertasPage() {
  const { activeAccount } = useDashboard();
  const [configs, setConfigs] = useState({ stock_min: 5, acos_max: 25.0, buybox_loss: 1 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (activeAccount) {
      loadConfig();
    }
  }, [activeAccount]);

  async function loadConfig() {
    setLoading(true);
    try {
      // In a real app, retrieve from DB. For now, we mock or use a generic API.
      // fetch('/api/ml/alert_configs')
      setLoading(false);
    } catch (e) {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Integration with the DB logic
      const res = await fetch('/api/ml/alert_configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configs)
      });
      if (res.ok) alert('Configurações salvas!');
      else alert('Erro ao salvar');
    } catch (e) {
      alert('Erro de conexão');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="loading-overlay"><div className="spinner"></div></div>;

  return (
    <div className="animate-fade-in">
      <div className="card mb-lg shadow-sm">
        <div className="card-header">
          <span className="card-title">🔔 Configuração de Gatilhos de Alerta</span>
        </div>
        <div className="card-body">
          <p className="text-muted text-sm mb-xl">
            Defina os limites para o sistema disparar notificações automáticas na sua central de alertas.
          </p>

          <div style={{ maxWidth: '600px' }}>
            {/* Stock Min */}
            <div className="form-group mb-xl" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '20px' }}>
              <label className="form-label font-bold text-lg">🛍️ Estoque Mínimo no FULL</label>
              <div className="flex items-center gap-md">
                <input 
                  type="number" 
                  className="input input-bordered" 
                  value={configs.stock_min} 
                  onChange={(e) => setConfigs({ ...configs, stock_min: parseInt(e.target.value) || 0 })}
                  style={{ width: '100px' }}
                />
                <span className="text-muted text-sm">Disparar alerta quando um item tiver menos de X unidades no armazém.</span>
              </div>
            </div>

            {/* ACOS Max */}
            <div className="form-group mb-xl" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '20px' }}>
              <label className="form-label font-bold text-lg">💰 Alerta de ACOS Alto (Ads)</label>
              <div className="flex items-center gap-md">
                <input 
                  type="number" 
                  className="input input-bordered" 
                  value={configs.acos_max} 
                  onChange={(e) => setConfigs({ ...configs, acos_max: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100px' }}
                />
                <span className="text-sm font-semibold">%</span>
                <span className="text-muted text-sm">Disparar alerta se o investimento passar de X% do faturamento.</span>
              </div>
            </div>

            {/* Buy Box Loss */}
            <div className="form-group mb-xl" style={{ display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
              <div>
                <label className="form-label font-bold text-lg">🏆 Monitor de Buy Box (Catálogo)</label>
                <div className="text-muted text-sm">Notificar imediatamente se eu deixar de ganhar no catálogo.</div>
              </div>
              <input 
                type="checkbox" 
                className="toggle toggle-primary" 
                checked={configs.buybox_loss === 1}
                onChange={(e) => setConfigs({ ...configs, buybox_loss: e.target.checked ? 1 : 0 })}
              />
            </div>

            <div className="mt-xl">
              <button className={`btn btn-primary ${saving ? 'loading' : ''}`} onClick={handleSave}>
                Gravar Configurações
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
