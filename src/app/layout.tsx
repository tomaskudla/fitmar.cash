import './globals.css';

export const metadata = {
  title: 'FitMar Cash Flow Kalkulačka',
  description: 'Měsíční P&L se zohledněním DPH asymetrie',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body>{children}</body>
    </html>
  );
}
