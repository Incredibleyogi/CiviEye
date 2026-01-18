import { Link, useLocation } from 'react-router-dom';
import { Home, Search, PlusSquare, User, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const getNavItems = (isAdmin: boolean) => {
  const items = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/search', icon: Search, label: 'Search' },
    { path: '/create', icon: PlusSquare, label: 'Create' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];
  
  if (isAdmin) {
    items.splice(3, 0, { path: '/admin/management', icon: Shield, label: 'Admin' });
  }
  
  return items;
};

export function BottomNav() {
  const location = useLocation();
  const { isAdmin } = useAuth();
  const navItems = getNavItems(isAdmin);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path || 
            (path === '/admin/management' && location.pathname.startsWith('/admin'));
          const isAdminItem = path === '/admin/management';
          
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200',
                isActive
                  ? isAdminItem 
                    ? 'text-secondary' 
                    : 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5 transition-all duration-200',
                  isActive && 'scale-110'
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
