
import React, { useState, FormEvent } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import WidsLogo from '../components/WidsLogo';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { login, currentUser, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoggingIn(true);
    try {
      await login(username, password);
      navigate('/overview'); 
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-dark">
        <div className="text-text-primary text-xl">Loading...</div>
      </div>
    );
  }

  if (currentUser) {
    return <Navigate to="/overview" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary-dark via-secondary-dark to-primary-dark p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <WidsLogo className="h-16 text-accent-purple inline-block" />
          <h1 className="text-4xl font-bold text-text-primary mt-4">WIDS Dashboard</h1>
          <p className="text-text-secondary mt-2">Advanced WiFi Intrusion Detection System</p>
        </div>
        
        <div className="bg-secondary-dark shadow-2xl rounded-xl p-8 sm:p-10">
          <h2 className="text-2xl font-semibold text-text-primary text-center mb-6">Welcome Back</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label 
                htmlFor="username" 
                className="block text-sm font-medium text-text-secondary mb-1"
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full p-3 bg-tertiary-dark border border-primary-dark rounded-md text-text-primary focus:ring-2 focus:ring-accent-blue focus:border-accent-blue transition placeholder-text-secondary/70"
                placeholder="Enter your username"
                aria-describedby="username-hint"
              />
            </div>
            
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-text-secondary mb-1"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full p-3 bg-tertiary-dark border border-primary-dark rounded-md text-text-primary focus:ring-2 focus:ring-accent-blue focus:border-accent-blue transition placeholder-text-secondary/70"
                placeholder="Enter your password"
                aria-describedby="password-hint"
              />
            </div>

            {error && (
              <div role="alert" className="text-sm text-danger bg-danger/20 p-3 rounded-md">
                {error}
              </div>
            )}
            
            <div>
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-accent-blue hover:bg-accent-blue/90 text-white font-semibold py-3 px-4 rounded-md shadow-lg hover:shadow-accent-blue/30 transition-all duration-150 disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-secondary-dark"
              >
                {isLoggingIn ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing In...
                  </span>
                ) : 'Sign In'}
              </button>
            </div>
            <div className="text-center mt-4">
              <p className="text-sm text-text-secondary">
                Don't have an account?{' '}
                <Link 
                  to="/register" 
                  className="font-medium text-accent-blue hover:underline"
                >
                  Sign Up
                </Link>
              </p>
            </div>
          </form>
        </div>
        <p className="mt-8 text-center text-xs text-text-secondary">
          © {new Date().getFullYear()} WIDS Project. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
