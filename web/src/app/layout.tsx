export const metadata = {
  title: 'Sistema de Estoque',
  description: 'Painel de estoque com controle de entradas e saidas',
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
