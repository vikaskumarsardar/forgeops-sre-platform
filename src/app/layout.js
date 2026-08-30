import './globals.css';

export const metadata = {
  title: 'ForgeOps - Autonomous Production Debugging Agent',
  description: 'Production Debugging Agent powered by TrueForge Agent Harness',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-dark text-primary">{children}</body>
    </html>
  );
}
