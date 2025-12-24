import { cn } from '@/lib/utils';

interface SkeletonCardProps {
  className?: string;
}

export function PostSkeleton({ className }: SkeletonCardProps) {
  return (
    <div className={cn('bg-card border-b border-border p-4 space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full skeleton" />
        <div className="space-y-2">
          <div className="w-24 h-4 skeleton rounded" />
          <div className="w-32 h-3 skeleton rounded" />
        </div>
      </div>
      
      {/* Image */}
      <div className="aspect-square skeleton rounded-lg" />
      
      {/* Actions */}
      <div className="flex gap-4">
        <div className="w-6 h-6 skeleton rounded" />
        <div className="w-6 h-6 skeleton rounded" />
      </div>
      
      {/* Caption */}
      <div className="space-y-2">
        <div className="w-20 h-4 skeleton rounded" />
        <div className="w-full h-4 skeleton rounded" />
        <div className="w-3/4 h-4 skeleton rounded" />
      </div>
    </div>
  );
}

export function MapSkeleton({ className }: SkeletonCardProps) {
  return (
    <div className={cn('w-full h-full skeleton rounded-xl flex items-center justify-center', className)}>
      <div className="text-muted-foreground text-sm">Loading map...</div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-24 h-24 rounded-full skeleton" />
        <div className="w-32 h-6 skeleton rounded" />
        <div className="w-48 h-4 skeleton rounded" />
      </div>
      
      <div className="grid grid-cols-3 gap-4 text-center">
        {[1, 2, 3].map(i => (
          <div key={i} className="space-y-2">
            <div className="w-12 h-6 skeleton rounded mx-auto" />
            <div className="w-16 h-4 skeleton rounded mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
