import { AppLayout } from '@/components/layout/AppLayout';
import { useNotifications } from '@/contexts/NotificationsContext';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Heart, MessageCircle, AlertCircle, Shield, MapPin, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NOTIFICATION_ICONS = {
  like: Heart,
  comment: MessageCircle,
  status_update: AlertCircle,
  admin_response: Shield,
  nearby_post: MapPin,
};

export default function Notifications() {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();

  return (
    <AppLayout showLogo={false} title="Notifications" showNotifications={false}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Activity</h2>
          <Button variant="ghost" size="sm" onClick={markAllAsRead}>
            <Check className="w-4 h-4 mr-1" /> Mark all read
          </Button>
        </div>
      </div>

      <div className="divide-y divide-border">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <Bell className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-foreground">No notifications</h3>
            <p className="text-sm text-muted-foreground">You're all caught up!</p>
          </div>
        ) : (
          notifications.map((notification) => {
            const Icon = NOTIFICATION_ICONS[notification.type];
            return (
              <div
                key={notification.id}
                onClick={() => markAsRead(notification.id)}
                className={cn(
                  'flex gap-3 p-4 cursor-pointer transition-colors hover:bg-muted/50',
                  !notification.read && 'bg-primary/5'
                )}
              >
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                  notification.type === 'like' && 'bg-destructive/10 text-destructive',
                  notification.type === 'comment' && 'bg-primary/10 text-primary',
                  notification.type === 'status_update' && 'bg-warning/10 text-warning',
                  notification.type === 'admin_response' && 'bg-secondary/10 text-secondary',
                  notification.type === 'nearby_post' && 'bg-accent/10 text-accent'
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {!notification.read && (
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                )}
              </div>
            );
          })
        )}
      </div>
    </AppLayout>
  );
}
