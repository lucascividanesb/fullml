import './globals.css';

export const metadata = {
  title: 'MAGIIV - Hub de Integração Mercado Livre',
  description: 'Gestão inteligente de estoque, envios Full, relatórios e integração ERP para Mercado Livre',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
