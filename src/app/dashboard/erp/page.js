'use client';

import { useState } from 'react';

export default function ERPPage() {
  const [erpType, setErpType] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [connected, setConnected] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [skuMappings, setSkuMappings] = useState([]);
  const [newMapping, setNewMapping] = useState({ ml_sku: '', erp_sku: '', kit_items: '' });

  const handleConnect = () => {
    if (!erpType || !apiKey) return;
    // In production: actually connect to ERP API
    setConnected(true);
  };

  const addSKUMapping = () => {
    if (!newMapping.ml_sku || !newMapping.erp_sku) return;
    setSkuMappings([...skuMappings, { ...newMapping, id: Date.now() }]);
    setNewMapping({ ml_sku: '', erp_sku: '', kit_items: '' });
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFile(file);
      // In production: parse and process CSV
    }
  };

  return (
    <div>
      {/* Connection */}
      <div className="card mb-lg">
        <div className="card-header">
          <span className="card-title">Conexão ERP</span>
          {connected && <span className="badge badge-success">● Conectado</span>}
        </div>
        
        <div className="flex gap-md" style={{ flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
            <label className="form-label">Tipo de ERP</label>
            <select className="form-select" value={erpType} onChange={(e) => setErpType(e.target.value)}>
              <option value="">Selecione</option>
              <option value="bling">Bling</option>
              <option value="tiny">Tiny (Olist)</option>
              <option value="aton">Aton</option>
              <option value="custom">API Própria</option>
            </select>
          </div>
          <div className="form-group" style={{ flex: 2, minWidth: '300px' }}>
            <label className="form-label">Chave de API / Token</label>
            <input className="form-input" type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Cole sua chave de API aqui" />
          </div>
          <button className="btn btn-primary" onClick={handleConnect} style={{ alignSelf: 'flex-end' }}>
            🔗 Conectar
          </button>
        </div>

        {erpType === 'custom' && (
          <div className="card mt-md" style={{ background: 'var(--bg-input)', padding: '16px' }}>
            <p className="text-sm text-muted">
              Para integração com API própria, forneça a URL base da API e o token de autenticação. 
              A API precisa ter endpoints para consulta de estoque (GET /stock) e consulta de produtos (GET /products).
            </p>
          </div>
        )}
      </div>

      {/* CSV Import */}
      <div className="card mb-lg">
        <div className="card-header">
          <span className="card-title">Importação de Estoque Local (CSV/XLS)</span>
        </div>
        <p className="text-sm text-muted mb-md">
          Importe seu estoque local via arquivo CSV ou XLS para utilizar o Auto-ajuste de Envios.
          O arquivo deve conter as colunas: SKU, Quantidade.
        </p>
        <div className="flex items-center gap-md">
          <label className="btn btn-outline" style={{ cursor: 'pointer' }}>
            📁 Selecionar Arquivo
            <input type="file" accept=".csv,.xls,.xlsx" onChange={handleCSVUpload} style={{ display: 'none' }} />
          </label>
          {csvFile && (
            <>
              <span className="text-sm">{csvFile.name}</span>
              <button className="btn btn-accent btn-sm">📤 Importar</button>
            </>
          )}
        </div>
      </div>

      {/* SKU Mapping */}
      <div className="card mb-lg">
        <div className="card-header">
          <span className="card-title">Engenharia Reversa de SKUs</span>
        </div>
        <p className="text-sm text-muted mb-md">
          Associe SKUs que possuem códigos diferentes no Mercado Livre e no ERP.
        </p>

        <div className="flex gap-md mb-md" style={{ flexWrap: 'wrap' }}>
          <input className="form-input" placeholder="SKU Mercado Livre" value={newMapping.ml_sku} onChange={(e) => setNewMapping({ ...newMapping, ml_sku: e.target.value })} style={{ maxWidth: '200px' }} />
          <input className="form-input" placeholder="SKU ERP" value={newMapping.erp_sku} onChange={(e) => setNewMapping({ ...newMapping, erp_sku: e.target.value })} style={{ maxWidth: '200px' }} />
          <input className="form-input" placeholder="Kit (SKU-A:1, SKU-B:2)" value={newMapping.kit_items} onChange={(e) => setNewMapping({ ...newMapping, kit_items: e.target.value })} style={{ maxWidth: '250px' }} />
          <button className="btn btn-primary btn-sm" onClick={addSKUMapping}>+ Adicionar</button>
        </div>

        {skuMappings.length > 0 ? (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr><th>SKU ML</th><th>SKU ERP</th><th>Kit</th><th>Ação</th></tr>
              </thead>
              <tbody>
                {skuMappings.map(m => (
                  <tr key={m.id}>
                    <td className="font-semibold">{m.ml_sku}</td>
                    <td className="font-semibold">{m.erp_sku}</td>
                    <td className="text-sm text-muted">{m.kit_items || '—'}</td>
                    <td>
                      <button className="btn btn-sm btn-outline" onClick={() => setSkuMappings(skuMappings.filter(s => s.id !== m.id))}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '30px' }}>
            <div className="empty-state-icon">🔗</div>
            <div className="empty-state-title">Nenhum mapeamento</div>
            <p className="text-muted text-sm">Adicione mapeamentos de SKU para usar o Auto-ajuste</p>
          </div>
        )}
      </div>
    </div>
  );
}
