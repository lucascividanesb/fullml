'use client';

import { useState, useEffect } from 'react';
import { useDashboard } from '@/app/dashboard/layout';

export default function PrecosPage() {
  const { activeAccount } = useDashboard();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (activeAccount) {
      loadPricing();
    }
  }, [activeAccount]);

  async function loadPricing() {
    setLoading(true);
    try {
      const res = await fetch('/api/ml/pricing?limit=20');
      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdatePrice(itemId, currentPrice, targetPrice) {
    if (!targetPrice) return;
    const confirm = window.confirm(`Deseja alterar o preço de ${formatCurrency(currentPrice)} para ${formatCurrency(targetPrice)}?`);
    if (!confirm) return;

    setUpdating(itemId);
    try {
      const res = await fetch(`/api/ml/items/${itemId}/price`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: targetPrice })
      });
      
      if (res.ok) {
        alert('Preço atualizado com sucesso!');
        loadPricing();
      } else {
        alert('Erro ao atualizar preço.');
      }
    } catch (e) {
      alert('Erro de conexão');
    } finally {
      setUpdating(false);
    }
  }

  const formatCurrency = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

  if (loading) return <div className="loading-overlay"><div className="spinner"></div></div>;

  return (
    <div className="animate-fade-in">
      <div className="card mb-lg">
        <div className="card-header">
          <span className="card-title">🏷️ Inteligência de Preços (PriceBot Mode)</span>
        </div>
        <div className="card-body">
          <p className="text-muted text-sm mb-lg">
            Monitore seus anúncios em Catálogo. O sistema identifica o preço necessário para ganhar o Buy Box.
          </p>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Status Catálogo</th>
                  <th>Preço Atual</th>
                  <th>Preço p/ Ganhar</th>
                  <th>Situação</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="flex items-center gap-sm">
                        <img src={item.thumbnail} alt="" style={{ width: 32, height: 32, borderRadius: 4 }} />
                        <span className="truncate" style={{ maxWidth: '200px' }}>{item.title}</span>
                      </div>
                    </td>
                    <td>
                      {item.catalog_listing ? (
                        <span className="badge badge-info">Catálogo</span>
                      ) : (
                        <span className="text-muted text-xs">Clássico/Premium</span>
                      )}
                    </td>
                    <td className="font-semibold">{formatCurrency(item.price)}</td>
                    <td style={{ color: 'var(--primary-light)' }}>
                      {item.competition?.price_to_win ? formatCurrency(item.competition.price_to_win) : '—'}
                    </td>
                    <td>
                      {item.competition?.is_winner ? (
                        <span className="badge badge-success">🏆 Ganhando</span>
                      ) : item.competition?.status === 'losing' ? (
                        <span className="badge badge-danger">❌ Perdendo</span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {!item.competition?.is_winner && item.competition?.price_to_win && (
                        <button 
                          className={`btn btn-sm btn-primary ${updating === item.id ? 'loading' : ''}`}
                          onClick={() => handleUpdatePrice(item.id, item.price, item.competition.price_to_win)}
                        >
                          Igualar Preço
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="alert alert-info">
        💡 **Dica:** Itens "Ganhando" possuem maior relevância e conversão. Se você estiver perdendo, considere igualar o preço ou melhorar suas condições de frete (Full).
      </div>
    </div>
  );
}
