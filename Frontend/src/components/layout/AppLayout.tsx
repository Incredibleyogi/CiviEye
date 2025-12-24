import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { Header } from './Header';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  showLogo?: boolean;
  showNav?: boolean;
  showNotifications?: boolean;
}

export function AppLayout({ 
  children, 
  title, 
  showLogo = true, 
  showNav = true,
  showNotifications = true 
}: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header title={title} showLogo={showLogo} showNotifications={showNotifications} />
      <main className="pb-20 max-w-lg mx-auto">
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  );
}
