'use client';

import { useState, useRef, useEffect } from 'react';
import { useDashboard } from '../layout';

export default function ConfigPage() {
  const { user, customLogo, setCustomLogo } = useDashboard();
  const fileInputRef = useRef(null);
  const [primaryColor, setPrimaryColor] = useState('#6C5CE7');
  const [saved, setSaved] = useState(false);

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setCustomLogo(dataUrl);
      localStorage.setItem('magiiv_custom_logo', dataUrl);
      showSaved();
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setCustomLogo(null);
    localStorage.removeItem('magiiv_custom_logo');
    showSaved();
  };

  const applyColor = () => {
    document.documentElement.style.setProperty('--primary', primaryColor);
    document.documentElement.style.setProperty('--brand-primary', primaryColor);
    localStorage.setItem('magiiv_brand_color', primaryColor);
    showSaved();
  };

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  useEffect(() => {
    const savedColor = localStorage.getItem('magiiv_brand_color');
    if (savedColor) {
      setPrimaryColor(savedColor);
      document.documentElement.style.setProperty('--primary', savedColor);
    }
  }, []);

  return (
    <div>
      {saved && (
        <div className="toast-container">
          <div className="toast toast-success">✅ Configuração salva com sucesso!</div>
        </div>
      )}

      {/* White Label */}
      <div className="card mb-lg">
        <div className="card-header">
          <span className="card-title">White Label - Logo Personalizado</span>
        </div>
        <p className="text-sm text-muted mb-md">
          Personalize o hub com a logo da sua empresa. A logo será exibida na sidebar e em todos os relatórios exportados.
        </p>

        <div className="flex items-center gap-lg">
          <div style={{
            width: '160px', height: '80px',
            border: '2px dashed var(--border)',
            borderRadius: 'var(--radius-md)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', background: 'var(--bg-input)',
            cursor: 'pointer',
          }}
            onClick={() => fileInputRef.current?.click()}
          >
            {customLogo ? (
              <img src={customLogo} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            ) : (
              <span className="text-muted text-sm">Clique para enviar</span>
            )}
          </div>

          <div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
            <div className="btn-group">
              <button className="btn btn-primary btn-sm" onClick={() => fileInputRef.current?.click()}>
                📤 Upload Logo
              </button>
              {customLogo && (
                <button className="btn btn-outline btn-sm" onClick={removeLogo}>
                  ✕ Remover
                </button>
              )}
            </div>
            <p className="text-xs text-muted mt-md">Formatos: PNG, SVG, JPG. Tamanho máximo: 2MB</p>
          </div>
        </div>
      </div>

      {/* Brand Color */}
      <div className="card mb-lg">
        <div className="card-header">
          <span className="card-title">Cor da Marca</span>
        </div>
        <p className="text-sm text-muted mb-md">Personalize a cor principal do hub.</p>
        <div className="flex items-center gap-md">
          <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)}
            style={{ width: '60px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }} />
          <input className="form-input" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} style={{ maxWidth: '120px' }} />
          <button className="btn btn-primary btn-sm" onClick={applyColor}>Aplicar</button>
        </div>
      </div>

      {/* Account Info */}
      <div className="card mb-lg">
        <div className="card-header">
          <span className="card-title">Conta Mercado Livre</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Nickname</label>
            <div className="form-input" style={{ background: 'var(--bg-input)', cursor: 'default' }}>{user?.nickname || '—'}</div>
          </div>
          <div className="form-group">
            <label className="form-label">E-mail</label>
            <div className="form-input" style={{ background: 'var(--bg-input)', cursor: 'default' }}>{user?.email || '—'}</div>
          </div>
          <div className="form-group">
            <label className="form-label">ID</label>
            <div className="form-input" style={{ background: 'var(--bg-input)', cursor: 'default' }}>{user?.id || '—'}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Site</label>
            <div className="form-input" style={{ background: 'var(--bg-input)', cursor: 'default' }}>{user?.site_id || '—'}</div>
          </div>
        </div>
      </div>

      {/* Multi-user */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Multi-Usuários</span>
          <button className="btn btn-sm btn-primary">+ Convidar Usuário</button>
        </div>
        <div className="empty-state" style={{ padding: '30px' }}>
          <div className="empty-state-icon">👥</div>
          <div className="empty-state-title">Gerenciar equipe</div>
          <p className="text-muted text-sm">Convide membros da equipe para acessar o hub com diferentes níveis de permissão</p>
        </div>
      </div>
    </div>
  );
}
