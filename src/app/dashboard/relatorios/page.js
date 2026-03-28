'use client';

export default function RelatoriosPage() {
  const reports = [
    { name: 'Ruptura de Estoque', desc: 'Produtos em falta no estoque Full', icon: '🔴', path: '/dashboard/relatorios/ruptura', color: 'var(--danger)' },
    { name: 'Cobertura de Estoque', desc: 'Quantos dias de estoque restam', icon: '🟢', path: '/dashboard/relatorios/cobertura', color: 'var(--success)' },
    { name: 'Curva ABC', desc: 'Classificação por importância relativa', icon: '📈', path: '/dashboard/relatorios/curva-abc', color: 'var(--primary-light)' },
    { name: 'Elasticidade de Preços', desc: 'Impacto de preço nas vendas', icon: '💹', path: '/dashboard/relatorios/elasticidade', color: 'var(--accent)' },
  ];

  return (
    <div>
      <p className="text-muted mb-lg">Selecione um relatório para visualizar análises detalhadas do seu estoque e vendas.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {reports.map((r) => (
          <a key={r.name} href={r.path} style={{ textDecoration: 'none' }}>
            <div className="card" style={{ cursor: 'pointer', textAlign: 'center', padding: '32px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>{r.icon}</div>
              <h3 style={{ color: r.color, marginBottom: '8px' }}>{r.name}</h3>
              <p className="text-muted text-sm">{r.desc}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
