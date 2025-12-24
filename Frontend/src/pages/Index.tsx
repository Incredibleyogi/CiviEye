import { Link } from 'react-router-dom';
import { Eye, ArrowRight, MapPin, Users, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-5" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />

        <div className="relative px-6 py-16 max-w-lg mx-auto text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-6 animate-fade-in">
            <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center shadow-glow">
              <Eye className="w-11 h-11 text-primary-foreground" />
            </div>
          </div>

          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent animate-fade-in">
            CivicEye
          </h1>

          <p className="text-lg text-muted-foreground mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            See the issues. Share the solutions.<br />
            Report civic problems in your community.
          </p>

          {/* CTA Buttons */}
          <div className="space-y-3 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Button asChild variant="gradient" size="xl" className="w-full">
              <Link to="/signup">
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full">
              <Link to="/login">
                Already have an account? Log in
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-12 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">1.2K+</p>
              <p className="text-xs text-muted-foreground">Issues Reported</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-success">89%</p>
              <p className="text-xs text-muted-foreground">Resolution Rate</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-secondary">50+</p>
              <p className="text-xs text-muted-foreground">Cities Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="px-6 py-12 space-y-6 max-w-lg mx-auto">
        <h2 className="text-xl font-semibold text-foreground text-center mb-8">
          How it works
        </h2>

        <div className="grid gap-4">
          <FeatureCard
            icon={<MapPin className="w-6 h-6" />}
            title="Report Issues"
            description="Snap a photo and report civic issues like potholes, broken lights, or illegal dumping with precise location."
            delay="0.3s"
          />
          <FeatureCard
            icon={<Users className="w-6 h-6" />}
            title="Community Driven"
            description="See what others are reporting in your area and support their issues with likes and comments."
            delay="0.4s"
          />
          <FeatureCard
            icon={<Zap className="w-6 h-6" />}
            title="Real-time Updates"
            description="Get instant notifications when authorities respond to your reports or update issue status."
            delay="0.5s"
          />
          <FeatureCard
            icon={<Shield className="w-6 h-6" />}
            title="Track Progress"
            description="Follow the status of reported issues from submission to resolution with full transparency."
            delay="0.6s"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-8 text-center text-sm text-muted-foreground">
        <p>© 2024 CivicEye. Making cities better together.</p>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: string;
}) {
  return (
    <div
      className="flex gap-4 p-4 rounded-xl bg-card border border-border shadow-soft animate-slide-up hover:shadow-medium transition-shadow"
      style={{ animationDelay: delay }}
    >
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
