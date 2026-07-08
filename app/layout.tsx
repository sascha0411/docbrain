import './globals.css';

export const metadata = {
  title: 'DocBrain',
  description: 'DocBrain stabile Testversion',
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
