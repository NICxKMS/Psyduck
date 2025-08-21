import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from '../hooks/useRouter';

export function Login() {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, error, clearError } = useAuth();
  const { navigate } = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear any previous errors
    clearError();
    
    // Basic validation
    if (!credentials.email || !credentials.password) {
      return;
    }

    console.log('🔐 Login form submitted with:', { 
      email: credentials.email, 
      passwordLength: credentials.password.length 
    });

    setIsLoading(true);

    try {
      const ok = await login(credentials.email, credentials.password);
      if (ok) {
        navigate('/dashboard');
      }
    } catch (error) {
      // Error handling is done in the auth context
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    const demoCredentials = {
      email: 'demo@psyduck.dev',
      password: 'demo123'
    };
    
    console.log('🎮 Demo login clicked with credentials:', demoCredentials);
    
    setCredentials(demoCredentials);
    
    // Auto-submit with demo credentials
    setTimeout(async () => {
      setIsLoading(true);
      try {
        console.log('🎮 Attempting demo login...');
        const ok = await login(demoCredentials.email, demoCredentials.password);
        if (ok) {
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Demo login failed:', error);
      } finally {
        setIsLoading(false);
      }
    }, 100);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="text-3xl mb-2">🦆</div>
          <CardTitle>Welcome Back</CardTitle>
          <CardDescription>
            Sign in to your Psyduck account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={credentials.email}
                onChange={(e) => setCredentials(prev => ({
                  ...prev,
                  email: e.target.value
                }))}
                required
                disabled={isLoading}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({
                    ...prev,
                    password: e.target.value
                  }))}
                  required
                  disabled={isLoading}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-psyduck-primary hover:bg-psyduck-primary-hover"
              disabled={isLoading || !credentials.email || !credentials.password}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>
          
          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or try demo
                </span>
              </div>
            </div>
            
            <Button 
              type="button"
              variant="outline" 
              className="w-full mt-4"
              onClick={handleDemoLogin}
              disabled={isLoading}
            >
              <span className="mr-2">🎮</span>
              Demo Account
            </Button>
          </div>
          
          <div className="mt-6 text-center text-sm">
            Don't have an account?{' '}
            <Button 
              variant="link" 
              className="p-0 text-psyduck-primary hover:text-psyduck-primary-hover"
              onClick={() => navigate('/register')}
              disabled={isLoading}
            >
              Sign up
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}