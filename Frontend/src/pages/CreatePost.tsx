import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, MapPin, X, Image as ImageIcon, Loader2, AlertTriangle } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';


import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { usePosts } from '@/contexts/PostsContext';
import { useToast } from '@/hooks/use-toast';
import { IssueCategory, DuplicateIssue } from '@/types';

const CATEGORIES: { value: IssueCategory; label: string; icon: string }[] = [
  { value: 'road', label: 'Road & Traffic', icon: '🛣️' },
  { value: 'water', label: 'Water Supply', icon: '💧' },
  { value: 'electricity', label: 'Electricity', icon: '⚡' },
  { value: 'sanitation', label: 'Sanitation', icon: '🗑️' },
  { value: 'other', label: 'Other', icon: '📍' },
];

export default function CreatePost() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addPost, posts } = usePosts();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState<IssueCategory>('other');
  const [location, setLocation] = useState({ address: '', city: '', village: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<DuplicateIssue | null>(null);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Simulate duplicate check
      setIsCheckingDuplicate(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock duplicate detection (30% chance)
      if (Math.random() < 0.3 && posts.length > 0) {
        const randomPost = posts[Math.floor(Math.random() * posts.length)];
        setDuplicateWarning({
          id: randomPost.id,
          reason: 'image_similarity',
          similarity: 0.78,
          post: randomPost,
        });
      }
      setIsCheckingDuplicate(false);
    }
  };

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!imagePreview) {
    toast({
      variant: 'destructive',
      title: 'Image required',
      description: 'Please select an image for your post.',
    });
    return;
  }

  if (!caption.trim()) {
    toast({
      variant: 'destructive',
      title: 'Caption required',
      description: 'Please add a caption describing the issue.',
    });
    return;
  }

  setIsSubmitting(true);

  try {
    if (!fileInputRef.current?.files?.[0]) throw new Error('File not selected');

    const file = fileInputRef.current.files[0];
    const formData = new FormData();

    // Append image
    formData.append("media", file);

    // Append text fields
    formData.append("title", caption.trim());
    formData.append("description", caption.trim());
    formData.append("category", category);

    // Append location in GeoJSON format
    formData.append("location", JSON.stringify({
      type: "Point",
      coordinates: [parseFloat(location.lng || '0'), parseFloat(location.lat || '0')]
    }));

    // Append address if any
    formData.append("address", location.address || '');

    // Call backend API
    const token = user?.token; // assuming your auth context stores JWT as token
    const res = await fetch(`${process.env.REACT_APP_API_URL}/api/posts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || 'Failed to create post');

    toast({ title: 'Issue reported successfully!' });
    navigate('/dashboard');
  } catch (err: any) {
    toast({
      variant: 'destructive',
      title: 'Error',
      description: err.message,
    });
  } finally {
    setIsSubmitting(false);
  }
};


  return (
    <AppLayout showLogo={false} title="Report Issue">
      <form onSubmit={handleSubmit} className="p-4 space-y-6 animate-fade-in">
        {/* Image Upload */}
        <div className="space-y-2">
          <Label>Photo Evidence</Label>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            capture="environment"
            onChange={handleImageSelect}
            className="hidden"
          />

          {imagePreview ? (
            <div className="relative aspect-square rounded-xl overflow-hidden bg-muted">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setImagePreview(null);
                  setDuplicateWarning(null);
                }}
                className="absolute top-3 right-3 p-2 rounded-full bg-card/90 text-foreground shadow-md hover:bg-card transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              {isCheckingDuplicate && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Checking for duplicates...</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-[4/3] rounded-xl border-2 border-dashed border-border bg-muted/50 flex flex-col items-center justify-center gap-3 hover:bg-muted transition-colors"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Camera className="w-8 h-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground">Upload Photo</p>
                <p className="text-sm text-muted-foreground">Tap to select or take a photo</p>
              </div>
            </button>
          )}
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label>Issue Category</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as IssueCategory)}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  <span className="flex items-center gap-2">
                    {cat.icon} {cat.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Caption */}
        <div className="space-y-2">
          <Label htmlFor="caption">Description</Label>
          <Textarea
            id="caption"
            placeholder="Describe the civic issue in detail..."
            value={caption}
            onChange={e => setCaption(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>

        {/* Location */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <Label className="text-sm font-medium">Location (Optional)</Label>
          </div>

          <div className="grid gap-3">
            <Input
              placeholder="Street Address"
              value={location.address}
              onChange={e => setLocation(l => ({ ...l, address: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="City"
                value={location.city}
                onChange={e => setLocation(l => ({ ...l, city: e.target.value }))}
              />
              <Input
                placeholder="Village/Area"
                value={location.village}
                onChange={e => setLocation(l => ({ ...l, village: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="gradient"
          size="lg"
          className="w-full"
          disabled={isSubmitting || !imagePreview || !caption.trim() || isCheckingDuplicate}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Reporting...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Submit Report
            </span>
          )}
        </Button>
      </form>

      {/* Duplicate Warning Modal */}
      <Dialog open={!!duplicateWarning} onOpenChange={() => setDuplicateWarning(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="w-5 h-5" />
              Possible Duplicate Detected
            </DialogTitle>
            <DialogDescription>
              This issue may have already been reported nearby. Would you like to view the existing report or continue with your submission?
            </DialogDescription>
          </DialogHeader>

          {duplicateWarning && (
            <div className="p-3 rounded-lg bg-muted border border-border">
              <div className="flex gap-3">
                <img
                  src={duplicateWarning.post.imageUrl}
                  alt="Existing issue"
                  className="w-20 h-20 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground line-clamp-2">
                    {duplicateWarning.post.caption}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {duplicateWarning.post.location?.city || duplicateWarning.post.location?.address}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-warning/10 text-warning">
                      {Math.round(duplicateWarning.similarity * 100)}% similar
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {duplicateWarning.reason.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setDuplicateWarning(null)} className="flex-1">
              Continue Anyway
            </Button>
            <Button
              variant="default"
              onClick={() => {
                navigate('/dashboard');
              }}
              className="flex-1"
            >
              View Existing Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
