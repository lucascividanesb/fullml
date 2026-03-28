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
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="login-logo">
            <rect width="56" height="56" rx="16" fill="url(#grad)" />
            <text x="28" y="36" textAnchor="middle" fill="white" fontWeight="800" fontSize="20" fontFamily="Inter, sans-serif">M</text>
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="56" y2="56">
                <stop stopColor="#6C5CE7" />
                <stop offset="1" stopColor="#00D2D3" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <h1 className="login-title">MAGIIV</h1>
        <p className="login-subtitle">
          Hub de Integração Mercado Livre
          <br />
          Gestão inteligente de estoque Full, envios e relatórios
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
