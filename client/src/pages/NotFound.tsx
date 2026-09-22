import { Link } from 'react-router-dom';
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher';

export function NotFound() {
  return (
    <main className="min-h-screen bg-base text-primary flex flex-col items-center justify-center gap-4 text-center px-6 relative">
      <div className="fixed top-4 right-4 z-50"><ThemeSwitcher compact /></div>
      <p className="text-6xl font-extrabold text-accent">404</p>
      <p className="text-secondary">This page doesn't exist.</p>
      <Link to="/" className="text-accent font-semibold hover:underline">Back home</Link>
    </main>
  );
}
