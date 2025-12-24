import { Eye, Bell, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/contexts/NotificationsContext';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';

interface HeaderProps {
  title?: string;
  showLogo?: boolean;
  showNotifications?: boolean;
}

export function Header({ title, showLogo = true, showNotifications = true }: HeaderProps) {
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const { isAdmin } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border">
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        {showLogo ? (
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
              <Eye className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                CivicEye
              </span>
              {isAdmin && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 bg-secondary/20 text-secondary">
                  <Shield className="w-3 h-3 mr-0.5" />
                  Admin
                </Badge>
              )}
            </div>
          </div>
        ) : (
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        )}

        {showNotifications && (
          <button
            onClick={() => navigate('/notifications')}
            className="relative p-2 rounded-full hover:bg-muted transition-colors"
          >
            <Bell className="w-5 h-5 text-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center animate-pulse-ring">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        )}
      </div>
    </header>
  );
}
