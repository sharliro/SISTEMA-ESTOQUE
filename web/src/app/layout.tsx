export const metadata = {
  title: 'Sistema de Estoque',
  description: 'Painel do Sistema de Controle de Estoque GTIC',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
