import React, { useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { Leaf, User, Building2, Shield } from 'lucide-react';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    role: 'cultivator',
    wallet_address: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Animate login form
    gsap.fromTo('.login-container', 
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
    );
  }, []);

  const handleDemoLogin = async (role) => {
    const demoCredentials = {
      cultivator: { username: 'Demo Cultivator', role: 'cultivator' },
      company: { username: 'Demo Company', role: 'company' },
      admin: { username: 'Demo Admin', role: 'admin' }
    };
    
    const credentials = demoCredentials[role];
    if (!credentials) return;
    
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        onLogin(data.user);
      } else {
        setError(data.error || 'Demo login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        onLogin({
          id: data.user_id,
          name: data.name,
          role: data.role,
          wallet_address: formData.wallet_address
        });
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const roleOptions = [
    { value: 'cultivator', label: 'Cultivator', icon: Leaf, description: 'Plant trees and earn carbon credits' },
    { value: 'company', label: 'Company', icon: Building2, description: 'Buy carbon credits to offset emissions' },
    { value: 'admin', label: 'Admin', icon: Shield, description: 'Verify and approve plantation requests' }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="login-container max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <Leaf className="h-16 w-16 text-primary-600 float-animation" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Welcome to CarbonChain
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join the carbon credit marketplace
          </p>
        </div>

        {/* Demo Login Section */}
        <div className="mt-8">
          <div className="text-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">🎯 Demo Login</h3>
            <p className="text-sm text-gray-600">Try the system with demo accounts</p>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <button
              type="button"
              onClick={() => handleDemoLogin('cultivator')}
              disabled={loading}
              className="btn btn-secondary w-full py-3 flex items-center justify-center space-x-2"
            >
              <User className="h-5 w-5" />
              <span>Demo Cultivator</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('company')}
              disabled={loading}
              className="btn btn-secondary w-full py-3 flex items-center justify-center space-x-2"
            >
              <Building2 className="h-5 w-5" />
              <span>Demo Company</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('admin')}
              disabled={loading}
              className="btn btn-secondary w-full py-3 flex items-center justify-center space-x-2"
            >
              <Shield className="h-5 w-5" />
              <span>Demo Admin</span>
            </button>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">OR</span>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 input w-full"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="wallet_address" className="block text-sm font-medium text-gray-700">
                Wallet Address
              </label>
              <input
                id="wallet_address"
                name="wallet_address"
                type="text"
                required
                value={formData.wallet_address}
                onChange={handleChange}
                className="mt-1 input w-full"
                placeholder="Enter your wallet address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Your Role
              </label>
              <div className="space-y-3">
                {roleOptions.map((role) => {
                  const Icon = role.icon;
                  return (
                    <label
                      key={role.value}
                      className={`relative flex items-start p-4 border rounded-lg cursor-pointer transition-all ${
                        formData.role === role.value
                          ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                          : 'border-gray-300 hover:border-primary-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={role.value}
                        checked={formData.role === role.value}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div className="flex items-center space-x-3">
                        <Icon className={`h-5 w-5 ${
                          formData.role === role.value ? 'text-primary-600' : 'text-gray-400'
                        }`} />
                        <div>
                          <div className={`text-sm font-medium ${
                            formData.role === role.value ? 'text-primary-900' : 'text-gray-900'
                          }`}>
                            {role.label}
                          </div>
                          <div className={`text-xs ${
                            formData.role === role.value ? 'text-primary-700' : 'text-gray-500'
                          }`}>
                            {role.description}
                          </div>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3 text-base font-medium"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="spinner"></div>
                  <span>Registering...</span>
                </div>
              ) : (
                'Register & Continue'
              )}
            </button>
          </div>
        </form>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            By registering, you agree to our terms of service and privacy policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;



