'use client';

import { useEffect, useState } from 'react';

export default function LoginPage() {
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get('error');
    if (err) setError(decodeURIComponent(err));
  }, []);

  return (
    <div className="login-page">
      <div className="login-card">
        <div style={{ marginBottom: '24px' }}>
          <svg width="64" height="64" viewBox="0 0 32 32" style={{ borderRadius: '12px' }}>
            <rect width="32" height="32" fill="#EB5E43" />
            <path d="M8 24C8 17.3726 13.3726 12 20 12" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M8 24C8 20.6863 10.6863 18 14 18" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" />
            <circle cx="8" cy="24" r="2" fill="white" />
          </svg>
        </div>

        <h1 className="login-title" style={{ display: 'flex', alignItems: 'baseline', gap: '4px', justifyContent: 'center' }}>
          RS <span style={{ color: '#EB5E43', fontSize: '1.5rem', fontWeight: 400 }}>connect</span>
        </h1>
        <p className="login-subtitle">
          Hub de Integração Full - RS Connect
          <br />
          Gestão inteligente de estoque Full, envios e faturamento
        </p>

        {error && (
          <div style={{
            padding: '12px 16px',
            background: 'var(--danger-bg)',
            border: '1px solid rgba(255,107,107,0.3)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--danger)',
            fontSize: '0.85rem',
            marginBottom: '20px',
            textAlign: 'left',
          }}>
            ⚠️ {error}
          </div>
        )}

        <a href="/api/auth/login" className="btn btn-primary login-btn" id="btn-connect-ml">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect width="20" height="20" rx="4" fill="#FFE600"/>
            <path d="M5 14V7c0-2.2 1.8-4 4-4s4 1.8 4 4v7" stroke="#333" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="7" cy="14" r="1.5" fill="#333"/>
            <circle cx="13" cy="14" r="1.5" fill="#333"/>
          </svg>
          Conectar com Mercado Livre
        </a>

        <div className="login-divider">Funcionalidades</div>

        <div className="login-features">
          <div className="login-feature">
            <span className="login-feature-icon">📦</span>
            <span>Estoque Full</span>
          </div>
          <div className="login-feature">
            <span className="login-feature-icon">📊</span>
            <span>Curva ABC</span>
          </div>
          <div className="login-feature">
            <span className="login-feature-icon">🚚</span>
            <span>Envios Automáticos</span>
          </div>
          <div className="login-feature">
            <span className="login-feature-icon">🏷️</span>
            <span>Etiquetagem</span>
          </div>
          <div className="login-feature">
            <span className="login-feature-icon">📈</span>
            <span>Elasticidade</span>
          </div>
          <div className="login-feature">
            <span className="login-feature-icon">🔗</span>
            <span>Integração ERP</span>
          </div>
          <div className="login-feature">
            <span className="login-feature-icon">👥</span>
            <span>MultiConta</span>
          </div>
          <div className="login-feature">
            <span className="login-feature-icon">🎯</span>
            <span>Metas Mensais</span>
          </div>
        </div>

        <p style={{ 
          marginTop: '28px', 
          fontSize: '0.75rem', 
          color: 'var(--text-muted)' 
        }}>
          Aplicativo certificado pelo Mercado Livre • Processamento em alta escala
        </p>
      </div>
    </div>
  );
}
