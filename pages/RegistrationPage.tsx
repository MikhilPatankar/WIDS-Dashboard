
import React, { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import WidsLogo from '../components/WidsLogo';
import { UserRegistrationData } from '../types'; // Ensure this path is correct for your project structure

const RegistrationPage: React.FC = () => {
  const [formData, setFormData] = useState<UserRegistrationData & { confirmPassword?: string }>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    is_active: true, // Default for self-registration
    is_admin: false, // Default for self-registration
  });
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const { register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.username || !formData.email || !formData.password) {
      setError("Username, Email, and Password are required.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setIsRegistering(true);
    try {
      // Ensure we don't send confirmPassword to the backend
      const { confirmPassword, ...registrationData } = formData;
      await register(registrationData);
      addToast('success', 'Registration Successful!', 'You can now log in with your new account.');
      navigate('/login');
    } catch (err: any) {
      const errorMessage = err.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      addToast('error', 'Registration Failed', errorMessage);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary-dark via-secondary-dark to-primary-dark p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <WidsLogo className="h-16 text-accent-purple inline-block" />
          <h1 className="text-4xl font-bold text-text-primary mt-4">Create Account</h1>
          <p className="text-text-secondary mt-2">Join the WIDS Dashboard Platform</p>
        </div>
        
        <div className="bg-secondary-dark shadow-2xl rounded-xl p-8 sm:p-10">
          <form onSubmit={handleSubmit} className="space-y-5">
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
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="Choose a username"
              />
            </div>

            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium text-text-secondary mb-1"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="Enter your email"
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
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="Create a password (min. 8 characters)"
              />
            </div>

            <div>
              <label 
                htmlFor="confirmPassword" 
                className="block text-sm font-medium text-text-secondary mb-1"
              >
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="Confirm your password"
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
                disabled={isRegistering}
                className="w-full btn-primary py-3 mt-2"
              >
                {isRegistering ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </span>
                ) : 'Sign Up'}
              </button>
            </div>
            <div className="text-center mt-4">
              <p className="text-sm text-text-secondary">
                Already have an account?{' '}
                <Link 
                  to="/login" 
                  className="font-medium text-accent-blue hover:underline"
                >
                  Sign In
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

export default RegistrationPage;
