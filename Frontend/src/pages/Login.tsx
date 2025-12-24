import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Google Icon SVG component
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

// CivicEye Logo SVG
const CivicEyeLogo = () => (
  <svg viewBox="0 0 100 100" className="w-14 h-14">
    <defs>
      <linearGradient id="eyeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="hsl(217, 91%, 55%)" />
        <stop offset="100%" stopColor="hsl(174, 42%, 50%)" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="45" fill="url(#eyeGradient)" />
    <ellipse cx="50" cy="50" rx="28" ry="18" fill="white" />
    <circle cx="50" cy="50" r="12" fill="hsl(217, 91%, 45%)" />
    <circle cx="54" cy="46" r="4" fill="white" />
  </svg>
);

export default function Login() {
  const navigate = useNavigate();
  const { login, googleLogin } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await login(email, password);
    setIsLoading(false);

    if (result.success) {
      toast({
        title: 'Welcome back!',
        description: 'Successfully logged in.',
      });
      navigate('/dashboard');
    } else {
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: result.error || 'Invalid email or password.',
      });
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    
    try {
      const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      
      if (!googleClientId) {
        toast({
          variant: 'destructive',
          title: 'Configuration Error',
          description: 'Google Client ID is not configured.',
        });
        setIsGoogleLoading(false);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const googleObj = (window as any).google;
      
      if (googleObj?.accounts) {
        googleObj.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response: { credential: string }) => {
            const result = await googleLogin(response.credential);
            setIsGoogleLoading(false);
            
            if (result.success) {
              toast({
                title: 'Welcome!',
                description: 'Successfully logged in with Google.',
              });
              navigate('/dashboard');
            } else {
              toast({
                variant: 'destructive',
                title: 'Login failed',
                description: result.error || 'Google authentication failed.',
              });
            }
          },
        });

        googleObj.accounts.id.prompt();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Google Sign-In is not available. Please try again.',
        });
        setIsGoogleLoading(false);
      }
    } catch (error) {
      console.error('Google login error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to initialize Google Sign-In.',
      });
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      {/* Main Card */}
      <div className="w-full max-w-[350px] border border-border bg-card p-10 mb-3 animate-fade-in">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <CivicEyeLogo />
        </div>
        
        {/* Brand Name */}
        <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-1" style={{ fontFamily: "'Billabong', cursive, system-ui" }}>
          CivicEye
        </h1>
        <p className="text-center text-muted-foreground text-sm mb-8">
          See the issues. Share the solutions.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-2">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="bg-muted/50 border-border text-sm py-2.5"
          />
          
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="bg-muted/50 border-border text-sm py-2.5 pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5"
            disabled={isLoading || !email || !password}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              'Log in'
            )}
          </Button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-5">
          <div className="flex-1 h-px bg-border" />
          <span className="text-muted-foreground text-sm font-medium">OR</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Google Login */}
        <Button
          type="button"
          variant="ghost"
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading}
          className="w-full flex items-center justify-center gap-2 text-foreground font-semibold hover:bg-muted/50"
        >
          {isGoogleLoading ? (
            <div className="w-5 h-5 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
          ) : (
            <>
              <GoogleIcon />
              <span>Continue with Google</span>
            </>
          )}
        </Button>

        {/* Forgot Password */}
        <div className="text-center mt-5">
          <Link 
            to="/forgot-password" 
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            Forgot password?
          </Link>
        </div>
      </div>

      {/* Signup Card */}
      <div className="w-full max-w-[350px] border border-border bg-card p-5 text-center">
        <p className="text-sm text-foreground">
          Don't have an account?{' '}
          <Link to="/signup" className="text-primary font-semibold hover:text-primary/80">
            Sign up
          </Link>
        </p>
      </div>

      {/* App Download Section - Optional */}
      <div className="mt-5 text-center">
        <p className="text-sm text-muted-foreground">Get the app.</p>
        <div className="flex justify-center gap-2 mt-3">
          <div className="h-10 w-32 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
            Coming Soon
          </div>
        </div>
      </div>
    </div>
  );
}
