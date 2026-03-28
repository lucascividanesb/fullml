'use client';

import { useState } from 'react';

export default function TagsPage() {
  const [tags, setTags] = useState([
    { id: 1, name: 'Reposição Urgente', color: '#FF6B6B', count: 0 },
    { id: 2, name: 'Promoção', color: '#FDCB6E', count: 0 },
    { id: 3, name: 'Novo Lançamento', color: '#00D2D3', count: 0 },
    { id: 4, name: 'Produto Sazonal', color: '#A29BFE', count: 0 },
  ]);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#6C5CE7');
  const [showForm, setShowForm] = useState(false);

  const addTag = () => {
    if (!newTagName.trim()) return;
    setTags([...tags, { id: Date.now(), name: newTagName, color: newTagColor, count: 0 }]);
    setNewTagName('');
    setShowForm(false);
  };

  const removeTag = (id) => {
    setTags(tags.filter(t => t.id !== id));
  };

  return (
    <div>
      <div className="card mb-lg">
        <div className="card-header">
          <span className="card-title">Gestão de Tags & Workflow</span>
          <button className="btn btn-sm btn-primary" onClick={() => setShowForm(!showForm)}>
            + Nova Tag
          </button>
        </div>

        <p className="text-muted text-sm mb-lg">
          Tags permitem organizar e agrupar seus produtos para workflows personalizados. 
          Utilize tags para filtrar relatórios, organizar envios por categoria e agilizar processos.
        </p>

        {showForm && (
          <div className="card" style={{ background: 'var(--bg-input)', marginBottom: '20px', padding: '20px' }}>
            <div className="flex items-center gap-md">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Nome da Tag</label>
                <input className="form-input" value={newTagName} onChange={(e) => setNewTagName(e.target.value)} placeholder="Ex: Reposição Semanal" />
              </div>
              <div className="form-group" style={{ width: '80px' }}>
                <label className="form-label">Cor</label>
                <input type="color" value={newTagColor} onChange={(e) => setNewTagColor(e.target.value)} 
                  style={{ width: '100%', height: '38px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: 'transparent' }} />
              </div>
              <button className="btn btn-accent" onClick={addTag} style={{ alignSelf: 'flex-end' }}>Criar</button>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          {tags.map(tag => (
            <div key={tag.id} className="card" style={{ 
              padding: '16px', borderLeft: `4px solid ${tag.color}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between' 
            }}>
              <div>
                <div className="font-semibold" style={{ color: tag.color }}>{tag.name}</div>
                <div className="text-xs text-muted">{tag.count} produtos</div>
              </div>
              <button className="btn btn-icon btn-outline btn-sm" onClick={() => removeTag(tag.id)} title="Remover">
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Como usar Tags</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🏷️</div>
            <h4 style={{ marginBottom: '4px' }}>Crie Tags</h4>
            <p className="text-sm text-muted">Defina tags personalizadas para organizar seus produtos</p>
          </div>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📋</div>
            <h4 style={{ marginBottom: '4px' }}>Associe Produtos</h4>
            <p className="text-sm text-muted">Aplique tags aos seus anúncios para agrupá-los</p>
          </div>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔍</div>
            <h4 style={{ marginBottom: '4px' }}>Filtre Relatórios</h4>
            <p className="text-sm text-muted">Use tags para filtrar e segmentar todos os relatórios</p>
          </div>
        </div>
      </div>
    </div>
  );
}
