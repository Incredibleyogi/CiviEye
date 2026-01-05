import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

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
      <linearGradient id="eyeGradientSignup" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="hsl(217, 91%, 55%)" />
        <stop offset="100%" stopColor="hsl(174, 42%, 50%)" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="45" fill="url(#eyeGradientSignup)" />
    <ellipse cx="50" cy="50" rx="28" ry="18" fill="white" />
    <circle cx="50" cy="50" r="12" fill="hsl(217, 91%, 45%)" />
    <circle cx="54" cy="46" r="4" fill="white" />
  </svg>
);

export default function Signup() {
  const navigate = useNavigate();
  const { signup, verifyOtp, resendOtp, googleLogin } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Cooldown timer for resend OTP
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 8) {
      toast({
        variant: 'destructive',
        title: 'Password too short',
        description: 'Password must be at least 8 characters.',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Passwords do not match',
        description: 'Please make sure both passwords match.',
      });
      return;
    }

    setIsLoading(true);

    const result = await signup({ name, email, password, confirmPassword });

    setIsLoading(false);

    if (result.success) {
      toast({
        title: 'Verification sent!',
        description: 'Please check your email for the OTP code.',
      });
      setStep('otp');
      setResendCooldown(60);
    } else {
      toast({
        variant: 'destructive',
        title: 'Signup failed',
        description: result.error || 'Please check your details and try again.',
      });
    }
  };

 const handleVerifyOtp = async () => {
  if (otp.length !== 6 || isLoading) return;

  setIsLoading(true);

  try {
    const result = await verifyOtp(otp);

    // ✅ FIX: treat 304 / empty response as success
    if (result.success || result.message === 'Not modified') {
      toast({
        title: 'Account verified!',
        description: 'You can now log in to your account.',
      });
      navigate('/login');
    } else {
      toast({
        variant: 'destructive',
        title: 'Verification failed',
        description: result.error || 'Invalid OTP code. Please try again.',
      });
    }
  } catch (error) {
    toast({
      variant: 'destructive',
      title: 'Error',
      description: 'Something went wrong while verifying OTP.',
    });
  } finally {
    // ✅ FIX: always stop loading
    setIsLoading(false);
  }
};


  const handleResendOtp = async () => {
  if (resendCooldown > 0 || isLoading) return;

  setIsLoading(true);

  try {
    const result = await resendOtp();

    // ✅ FIX: accept 304 as success
    if (result.success || result.message === 'Not modified') {
      toast({
        title: 'OTP Resent!',
        description: 'Please check your email for the new OTP code.',
      });
      setResendCooldown(60);
    } else {
      toast({
        variant: 'destructive',
        title: 'Failed to resend',
        description: result.error || 'Please try again later.',
      });
    }
  } catch (error) {
    toast({
      variant: 'destructive',
      title: 'Error',
      description: 'Failed to resend OTP.',
    });
  } finally {
    // ✅ FIX: loading never sticks
    setIsLoading(false);
  }
};


  const handleGoogleSignup = async () => {
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
                description: 'Successfully signed up with Google.',
              });
              navigate('/dashboard');
            } else {
              toast({
                variant: 'destructive',
                title: 'Signup failed',
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
      console.error('Google signup error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to initialize Google Sign-In.',
      });
      setIsGoogleLoading(false);
    }
  };

  if (step === 'otp') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-[350px] border border-border bg-card p-10 animate-fade-in">
          <div className="flex justify-center mb-4">
            <CivicEyeLogo />
          </div>
          
          <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
            CivicEye
          </h1>
          
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold text-foreground">Verify Your Email</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Enter the code sent to<br />
              <span className="font-medium text-foreground">{email}</span>
            </p>
          </div>

          <div className="flex justify-center mb-6">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={setOtp}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            onClick={handleVerifyOtp}
            disabled={otp.length !== 6 || isLoading}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              'Verify'
            )}
          </Button>

          <div className="text-center mt-4">
            <button
              onClick={handleResendOtp}
              disabled={resendCooldown > 0 || isLoading}
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
            >
              <RotateCw className="w-4 h-4" />
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
            </button>
          </div>

          <button
            onClick={() => setStep('form')}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors mt-4"
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      {/* Main Card */}
      <div className="w-full max-w-[350px] border border-border bg-card p-10 mb-3 animate-fade-in">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <CivicEyeLogo />
        </div>
        
        {/* Brand Name */}
        <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-1">
          CivicEye
        </h1>
        <p className="text-center text-muted-foreground text-sm mb-6">
          Sign up to report civic issues
        </p>

        {/* Google Signup */}
        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleSignup}
          disabled={isGoogleLoading}
          className="w-full flex items-center justify-center gap-2 font-semibold mb-4"
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

        {/* Divider */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-muted-foreground text-sm font-medium">OR</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-2">
          <Input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="bg-muted/50 border-border text-sm py-2.5"
          />
          
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
              minLength={8}
              className="bg-muted/50 border-border text-sm py-2.5 pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            className="bg-muted/50 border-border text-sm py-2.5"
          />

          <p className="text-xs text-muted-foreground text-center py-2">
            By signing up, you agree to our Terms and Privacy Policy.
          </p>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5"
            disabled={isLoading || !name || !email || !password || !confirmPassword}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              'Sign up'
            )}
          </Button>
        </form>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-[350px] border border-border bg-card p-5 text-center">
        <p className="text-sm text-foreground">
          Have an account?{' '}
          <Link to="/login" className="text-primary font-semibold hover:text-primary/80">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
