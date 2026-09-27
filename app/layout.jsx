import './globals.css';
import { Inter, Orbitron } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-orbitron' });

export const metadata = {
  title: 'Junior Astronaut Mission Trainer',
  description:
    'NASA-informed educational simulation: plan a Moon mission, manage limited resources, and learn through mission decisions and consequences.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${orbitron.variable}`}>
      <body className="space-bg min-h-screen font-body text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
