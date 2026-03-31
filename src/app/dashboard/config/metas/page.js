'use client';

import { useState, useEffect } from 'react';
import { useDashboard } from '@/app/dashboard/layout';

export default function MetasConfig() {
  const { accounts, activeAccountId } = useDashboard();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [targetValues, setTargetValues] = useState({});

  useEffect(() => {
    if (activeAccountId && selectedMonth) {
      loadGoals();
    }
  }, [selectedMonth, accounts]);

  async function loadGoals() {
    setLoading(true);
    try {
      const res = await fetch(`/api/ml/goals?month=${selectedMonth}&accountId=${activeAccountId}`); 
      // Note: We fetch for all accounts but usually manage them per active account context or all together.
      // For simplicity, let's load all accounts' goals for the selected month
      const allRes = await Promise.all(
        accounts.map(acc => fetch(`/api/ml/goals?month=${selectedMonth}&accountId=${acc.id}`).then(r => r.json()))
      );
      
      const newValues = {};
      allRes.forEach((accGoals, idx) => {
        const accId = accounts[idx].id;
        newValues[accId] = accGoals[0]?.target_revenue || 0;
      });
      
      setTargetValues(newValues);
    } catch (err) {
      console.error('Failed to load goals', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(accId) {
    setSaving(accId);
    try {
      const res = await fetch('/api/ml/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: accId,
          month: selectedMonth,
          target: parseFloat(targetValues[accId]) || 0
        })
      });
      
      if (res.ok) {
        alert('Meta salva com sucesso!');
      } else {
        const err = await res.json();
        alert('Erro ao salvar: ' + err.error);
      }
    } catch (err) {
       alert('Erro de conexão');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container-fluid animate-fade-in">
      <div className="card mb-lg">
        <div className="card-header">
          <span className="card-title">🎯 Planejamento de Metas Mensais</span>
        </div>
        <div className="card-body">
          <p className="text-muted mb-lg">
            Defina o faturamento bruto esperado para cada loja. 
            Estes valores serão usados para calcular o progresso no Dashboard principal.
          </p>

          <div className="flex items-center gap-md mb-xl" style={{ maxWidth: '300px' }}>
            <label className="text-sm font-semibold">Mês de Referência:</label>
            <input 
              type="month" 
              className="input input-bordered" 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Loja</th>
                  <th>Meta de Faturamento (R$)</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((acc) => (
                  <tr key={acc.id}>
                    <td>
                      <div className="flex items-center gap-sm">
                        <div className="sidebar-avatar" style={{ width: '32px', height: '32px', fontSize: '12px' }}>
                          {acc.nickname?.[0]}
                        </div>
                        <span className="font-semibold">{acc.nickname}</span>
                      </div>
                    </td>
                    <td>
                      <input 
                        type="number" 
                        className="input input-bordered w-full" 
                        placeholder="R$ 0,00"
                        value={targetValues[acc.id] || ''}
                        onChange={(e) => setTargetValues({...targetValues, [acc.id]: e.target.value})}
                        style={{ maxWidth: '200px' }}
                      />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className={`btn ${saving === acc.id ? 'loading' : 'btn-primary'}`}
                        disabled={saving}
                        onClick={() => handleSave(acc.id)}
                      >
                        {saving === acc.id ? 'Salvando...' : 'Salvar Meta'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <div className="alert alert-info">
        💡 **Dica:** As metas são individuais por conta. Meses passados ficam salvos para consultas de histórico de performance.
      </div>
    </div>
  );
}
