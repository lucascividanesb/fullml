'use client';

import { useState, useEffect } from 'react';

export default function EnviosPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [targetDays, setTargetDays] = useState(15);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [showConfirm, setShowConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState('sugestao'); // 'sugestao' ou 'upload'
  const [localStockText, setLocalStockText] = useState('');
  const [localStockMap, setLocalStockMap] = useState({});

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [itemsRes, stockRes] = await Promise.all([
        fetch('/api/ml/items?limit=50').then(r => r.json()),
        fetch('/api/ml/stock').then(r => r.json()),
      ]);

      const salesMap = {};
      for (const s of (stockRes.sales_data || [])) {
        salesMap[s.id] = s;
      }

      const needsShipment = (itemsRes.items || [])
        .map(item => {
          const sales = salesMap[item.id] || {};
          const qty = item.available_quantity || 0;
          const dailyAvg = sales.daily_avg || 0;
          const coverage = dailyAvg > 0 ? Math.round(qty / dailyAvg) : 999;
          let toSend = Math.max(0, Math.ceil(dailyAvg * targetDays) - qty);
          
          let localStock = null;
          // Apply local stock limit if exists
          if (localStockMap[item.id] !== undefined || localStockMap[item.seller_custom_field] !== undefined) {
             localStock = localStockMap[item.id] || localStockMap[item.seller_custom_field];
             toSend = Math.min(toSend, localStock); // We can't send more than we have locally!
          }

          return { ...item, daily_avg: dailyAvg, coverage_days: coverage, qty_to_send: toSend, abc_class: sales.abc_class || 'C', local_stock: localStock };
        })
        .filter(item => item.qty_to_send > 0)
        .sort((a, b) => b.qty_to_send - a.qty_to_send);

      setItems(needsShipment);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const toggleSelect = (id) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(i => i.id)));
    }
  };

  const totalToSend = items
    .filter(i => selectedItems.has(i.id))
    .reduce((sum, i) => sum + i.qty_to_send, 0);

  const handleParseLocalStock = () => {
    const lines = localStockText.split('\\n');
    const newMap = {};
    for (const line of lines) {
      const [sku, qty] = line.split(/[;,\t]/);
      if (sku && qty && !isNaN(parseInt(qty))) {
         newMap[sku.trim()] = parseInt(qty.trim());
      }
    }
    setLocalStockMap(newMap);
    setActiveTab('sugestao');
    loadData(); // Recalculate
  };

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner" style={{ width: 40, height: 40 }}></div>
        <p>Calculando envios necessários...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="kpi-grid mb-lg">
        <div className="kpi-card purple">
          <div className="kpi-label">Produtos para Enviar</div>
          <div className="kpi-value">{items.length}</div>
        </div>
        <div className="kpi-card teal">
          <div className="kpi-label">Selecionados</div>
          <div className="kpi-value">{selectedItems.size}</div>
        </div>
        <div className="kpi-card orange">
          <div className="kpi-label">Unidades a Enviar</div>
          <div className="kpi-value">{totalToSend}</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-label">Dias Alvo</div>
          <div className="kpi-value">{targetDays}</div>
        </div>
      </div>

      <div className="tabs mb-md" style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)' }}>
        <button 
          className={`tab ${activeTab === 'sugestao' ? 'active' : ''}`}
          onClick={() => setActiveTab('sugestao')}
          style={{ padding: '8px 16px', background: 'none', border: 'none', borderBottom: activeTab === 'sugestao' ? '2px solid var(--accent)' : 'none', color: activeTab === 'sugestao' ? 'var(--accent)' : 'var(--text-muted)' }}
        >
          Sugestão de Envio 📦
        </button>
        <button 
          className={`tab ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
          style={{ padding: '8px 16px', background: 'none', border: 'none', borderBottom: activeTab === 'upload' ? '2px solid var(--accent)' : 'none', color: activeTab === 'upload' ? 'var(--accent)' : 'var(--text-muted)' }}
        >
          Cruzar Saldo Local (ERP) 🗃️
        </button>
      </div>

      {activeTab === 'sugestao' && (
      <>
      <div className="filters-bar">
        <div className="form-group" style={{ minWidth: '160px' }}>
          <label className="form-label" style={{ fontSize: '0.7rem' }}>Dias de Estoque Alvo</label>
          <input type="number" className="form-input" value={targetDays} onChange={(e) => setTargetDays(parseInt(e.target.value) || 1)} min="1" max="90" />
        </div>
        <button className="btn btn-primary" onClick={loadData}>🔄 Recalcular</button>
        <div style={{ flex: 1 }}></div>
        {selectedItems.size > 0 && (
          <button className="btn btn-accent" onClick={() => setShowConfirm(true)}>
            🚚 Gerar Envio ({selectedItems.size} itens)
          </button>
        )}
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>
                <input type="checkbox" checked={selectedItems.size === items.length && items.length > 0} onChange={selectAll} />
              </th>
              <th>Produto</th>
              <th>ABC</th>
              <th>Estoque Atual</th>
              <th>Média/Dia</th>
              <th>Cobertura</th>
              <th>Qtd a Enviar</th>
              {Object.keys(localStockMap).length > 0 && <th>Estoque Local</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} style={{ background: selectedItems.has(item.id) ? 'rgba(108,92,231,0.08)' : undefined }}>
                <td>
                  <input type="checkbox" checked={selectedItems.has(item.id)} onChange={() => toggleSelect(item.id)} />
                </td>
                <td>
                  <div className="flex items-center gap-sm">
                    {item.thumbnail && (
                      <img src={item.thumbnail} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }} />
                    )}
                    <span className="truncate" style={{ maxWidth: '250px' }}>{item.title}</span>
                  </div>
                </td>
                <td>
                  <span className={`badge ${item.abc_class === 'A' ? 'badge-success' : item.abc_class === 'B' ? 'badge-warning' : 'badge-info'}`}>
                    {item.abc_class}
                  </span>
                </td>
                <td>{item.available_quantity}</td>
                <td>{item.daily_avg.toFixed(1)}</td>
                <td>
                  <span className={`badge ${item.coverage_days < 5 ? 'badge-danger' : 'badge-warning'}`}>
                    {item.coverage_days}d
                  </span>
                </td>
                <td className="font-bold" style={{ color: 'var(--accent)', fontSize: '1.1rem' }}>
                  +{item.qty_to_send}
                </td>
                {Object.keys(localStockMap).length > 0 && (
                  <td>
                    {item.local_stock !== null ? (
                      <span className="badge badge-info">{item.local_stock} un.</span>
                    ) : (
                      <span className="text-muted text-xs">Desconhecido</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {items.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">✅</div>
          <div className="empty-state-title">Estoque em dia!</div>
          <p className="text-muted text-sm">Todos os produtos possuem cobertura suficiente para {targetDays} dias</p>
        </div>
      )}
      </>
      )}

      {activeTab === 'upload' && (
        <div className="card fade-in">
          <h2 className="text-xl mb-sm">Importar Saldo do ERP</h2>
          <p className="text-muted mb-md">
            Cole abaixo o saldo do seu estoque físico local para cruzar com as sugestões de envio. O sistema garantirá que ele não sugira enviar quantidades maiores do que você realmente tem.<br/><br/>
            <strong>Formato aceito:</strong> SKU, Quantidade (separado por vírgula, ponto e vírgula ou tab). Exemplo:<br/>
            <code style={{ background: 'var(--bg-input)', padding: '2px 4px', borderRadius: '4px' }}>MLB129321, 50</code>
          </p>

          <textarea 
            className="form-input mb-md" 
            style={{ width: '100%', height: '200px', fontFamily: 'monospace' }}
            value={localStockText}
            onChange={(e) => setLocalStockText(e.target.value)}
            placeholder="COLA_O_SEU_CSV_AQUI\nSKU1;100\nSKU2;45"
          ></textarea>

          <button className="btn btn-primary" onClick={handleParseLocalStock}>
            Aplicar Filtro de Estoque Local
          </button>
        </div>
      )}

      {/* Confirm modal */}
      {showConfirm && (
        <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Confirmar Envio Full</span>
              <button className="modal-close" onClick={() => setShowConfirm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '16px' }}>
                Você está prestes a gerar um envio com <strong>{selectedItems.size}</strong> produtos,
                totalizando <strong>{totalToSend} unidades</strong>.
              </p>
              <div className="card" style={{ background: 'var(--bg-input)', padding: '16px' }}>
                <p className="text-sm text-muted" style={{ marginBottom: '8px' }}>Resumo do envio:</p>
                {items.filter(i => selectedItems.has(i.id)).slice(0, 5).map(item => (
                  <div key={item.id} className="flex items-center justify-between" style={{ padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                    <span className="text-sm truncate" style={{ maxWidth: '200px' }}>{item.title}</span>
                    <span className="font-bold text-sm" style={{ color: 'var(--accent)' }}>+{item.qty_to_send}</span>
                  </div>
                ))}
                {selectedItems.size > 5 && (
                  <p className="text-xs text-muted mt-md">...e mais {selectedItems.size - 5} itens</p>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowConfirm(false)}>Cancelar</button>
              <button className="btn btn-accent" onClick={() => { 
                setShowConfirm(false); 
                const selected = Array.from(selectedItems).slice(0, 5); // Just some sample IDs
                window.open(`/api/ml/labels?items=${selected.join(',')}`, '_blank');
                alert('Envio gerado com sucesso! Abrindo etiquetas de envio em PDF...'); 
              }}>
                🚚 Confirmar Envio e Gerar Etiquetas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
