import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { Leaf, User, Building2, Shield, BarChart3, Network, X } from 'lucide-react';
import { co2API } from '../utils/api';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    role: 'cultivator',
    wallet_address: ''
  });
  const [loginData, setLoginData] = useState({
    username: '',
    wallet_address: ''
  });
  const [loading, setLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showCo2Graph, setShowCo2Graph] = useState(false);
  const [co2Data, setCo2Data] = useState([]);
  const [co2Loading, setCo2Loading] = useState(false);

  useEffect(() => {
    // Animate login form with staggered elements
    gsap.fromTo('.login-container', 
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
    );
    gsap.fromTo('.login-header', 
      { opacity: 0, scale: 0.9 },
      { opacity: 1, scale: 1, duration: 0.6, delay: 0.2, ease: 'power3.out' }
    );
    gsap.fromTo('.demo-buttons > *', 
      { opacity: 0, x: -20 },
      { opacity: 1, x: 0, duration: 0.5, delay: 0.4, stagger: 0.1, ease: 'power3.out' }
    );
  }, []);

  const handleDemoLogin = async (role) => {
    const demoCredentials = {
      cultivator: { 
        username: 'Demo Cultivator', 
        wallet_address: '0x1234567890abcdef1234567890abcdef12345678' 
      },
      company: { 
        username: 'Demo Company', 
        wallet_address: '0xabcdef1234567890abcdef1234567890abcdef12' 
      },
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

  const handleLoginChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value
    });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (response.ok) {
        onLogin(data.user);
      } else {
        setLoginError(data.error || 'Login failed');
      }
    } catch (err) {
      setLoginError('Network error. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const roleOptions = [
    { value: 'cultivator', label: 'Cultivator', icon: Leaf, description: 'Plant trees and earn carbon credits', color: 'from-green-500 to-emerald-600' },
    { value: 'company', label: 'Company', icon: Building2, description: 'Buy carbon credits to offset emissions', color: 'from-blue-500 to-cyan-600' }
  ];

  const handleExplorerClick = () => {
    navigate('/explorer');
  };

  const handleCo2GraphClick = async () => {
    setShowCo2Graph(true);
    setCo2Loading(true);
    try {
      const response = await co2API.getDeclineProfile();
      setCo2Data(response.data.data || []);
    } catch (error) {
      console.error('Error fetching CO2 data:', error);
      setCo2Data([]);
    } finally {
      setCo2Loading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center animated-bg py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-400/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="login-container max-w-md w-full space-y-8 relative z-10">
        {/* Header */}
        <div className="login-header text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-green-500 rounded-full blur-2xl opacity-50 animate-pulse"></div>
              <Leaf className="h-20 w-20 text-green-500 relative z-10 float-animation glow-green" />
            </div>
          </div>
          <h2 className="text-4xl font-bold gradient-text mb-2">
            Welcome to DeCarbon
          </h2>
          <p className="text-sm text-gray-400 mb-1">by QuantumNodes</p>
          <p className="mt-4 text-sm text-gray-400">
            Join the carbon credit marketplace
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            type="button"
            onClick={handleExplorerClick}
            className="glass border border-gray-800 rounded-xl p-4 hover-lift group transition-all duration-300 hover:border-green-500/50 hover:bg-green-500/5"
          >
            <div className="flex flex-col items-center space-y-2">
              <div className="p-3 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                <Network className="h-6 w-6 text-green-500" />
              </div>
              <span className="text-sm font-semibold text-gray-300 group-hover:text-green-400 transition-colors">
                Blockchain Explorer
              </span>
            </div>
          </button>
          
          <button
            type="button"
            onClick={handleCo2GraphClick}
            className="glass border border-gray-800 rounded-xl p-4 hover-lift group transition-all duration-300 hover:border-blue-500/50 hover:bg-blue-500/5"
          >
            <div className="flex flex-col items-center space-y-2">
              <div className="p-3 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                <BarChart3 className="h-6 w-6 text-blue-500" />
              </div>
              <span className="text-sm font-semibold text-gray-300 group-hover:text-blue-400 transition-colors">
                CO2 Removal Graph
              </span>
            </div>
          </button>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div>
              <label htmlFor="name" className="label">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="input w-full"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="wallet_address" className="label">
                Wallet Address
              </label>
              <input
                id="wallet_address"
                name="wallet_address"
                type="text"
                required
                value={formData.wallet_address}
                onChange={handleChange}
                className="input w-full font-mono text-xs"
                placeholder="0x..."
              />
            </div>

            <div>
              <label className="label mb-3">
                Select Your Role
              </label>
              <div className="space-y-3">
                {roleOptions.map((role) => {
                  const Icon = role.icon;
                  const isSelected = formData.role === role.value;
                  return (
                    <label
                      key={role.value}
                      className={`relative flex items-start p-4 border rounded-xl cursor-pointer transition-all duration-300 hover-lift group ${
                        isSelected
                          ? 'border-green-500 bg-green-500/10 ring-2 ring-green-500/30'
                          : 'border-gray-800 bg-gray-900/50 hover:border-gray-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={role.value}
                        checked={isSelected}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div className="flex items-center space-x-4 w-full">
                        <div className={`p-2 rounded-lg ${
                          isSelected ? 'bg-green-500/20' : 'bg-gray-800'
                        }`}>
                          <Icon className={`h-5 w-5 ${
                            isSelected ? 'text-green-400' : 'text-gray-500 group-hover:text-green-400'
                          } transition-colors`} />
                        </div>
                        <div className="flex-1">
                          <div className={`text-sm font-semibold ${
                            isSelected ? 'text-green-400' : 'text-gray-300'
                          }`}>
                            {role.label}
                          </div>
                          <div className={`text-xs mt-0.5 ${
                            isSelected ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {role.description}
                          </div>
                        </div>
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {error && (
            <div className="glass border border-red-500/50 bg-red-500/10 rounded-lg p-4 animate-slide-up">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3.5 text-base font-semibold"
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
          <p className="text-xs text-gray-600">
            By registering, you agree to our terms of service and privacy policy.
          </p>
        </div>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-800" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 glass border border-gray-800 rounded-full text-gray-500">OR LOGIN</span>
          </div>
        </div>

        {/* Login Section */}
        <div className="mt-8">
          <h3 className="text-xl font-bold text-gray-200 mb-6 text-center">Login to Your Account</h3>
          <form className="space-y-6" onSubmit={handleLoginSubmit}>
            <div>
              <label htmlFor="login_username" className="label">
                Registered Name
              </label>
              <input
                id="login_username"
                name="username"
                type="text"
                required
                value={loginData.username}
                onChange={handleLoginChange}
                className="input w-full"
                placeholder="Enter your registered name"
              />
            </div>

            <div>
              <label htmlFor="login_wallet" className="label">
                Wallet Address
              </label>
              <input
                id="login_wallet"
                name="wallet_address"
                type="text"
                required
                value={loginData.wallet_address}
                onChange={handleLoginChange}
                className="input w-full font-mono text-xs"
                placeholder="0x..."
              />
              <p className="mt-1 text-xs text-gray-500">Enter the wallet address you used during registration</p>
            </div>

            {loginError && (
              <div className="glass border border-red-500/50 bg-red-500/10 rounded-lg p-4 animate-slide-up">
                <p className="text-sm text-red-400">{loginError}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loginLoading}
                className="btn btn-primary w-full py-3.5 text-base font-semibold"
              >
                {loginLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="spinner"></div>
                    <span>Logging in...</span>
                  </div>
                ) : (
                  'Login'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Demo Login Section */}
        <div className="mt-8 opacity-0 pointer-events-none">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-transparent mb-2">🎯 Quick Access</h3>
            <p className="text-xs text-transparent">Try the system with demo accounts</p>
          </div>
          <div className="demo-buttons grid grid-cols-1 gap-3">
            {[
              { role: 'cultivator', icon: User, label: 'Demo Cultivator' },
              { role: 'company', icon: Building2, label: 'Demo Company' }
            ].map(({ role, icon: Icon, label }) => (
              <button
                key={role}
                type="button"
                onClick={() => handleDemoLogin(role)}
                disabled={loading}
                className="btn btn-secondary w-full py-3.5 flex items-center justify-center space-x-3 hover-lift group bg-transparent border-transparent opacity-0"
              >
                <Icon className="h-5 w-5 text-transparent group-hover:text-transparent transition-colors" />
                <span className="font-medium text-transparent">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CO2 Graph Modal */}
      {showCo2Graph && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCo2Graph(false);
            }
          }}
        >
          <div 
            className="glass border border-gray-700 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <BarChart3 className="h-6 w-6 text-green-500" />
                <h3 className="text-2xl font-bold text-gray-200">CO2 Decline Profile</h3>
              </div>
              <button
                onClick={() => setShowCo2Graph(false)}
                className="p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <p className="text-sm text-gray-400 mb-6">
              Track the cumulative CO2 removal from the atmosphere by all cultivators over time
            </p>
            
            {co2Loading ? (
              <div className="flex justify-center py-16">
                <div className="text-center">
                  <div className="spinner mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading CO2 data...</p>
                </div>
              </div>
            ) : co2Data.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-400">No CO2 removal data available yet</p>
                <p className="text-sm text-gray-500 mt-2">Data will appear once cultivators start uploading approved plantations</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={co2Data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCo2Login" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9ca3af"
                    style={{ fontSize: '12px' }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                  />
                  <YAxis 
                    stroke="#9ca3af"
                    style={{ fontSize: '12px' }}
                    label={{ value: 'CO2 Removed (tons)', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af' } }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#e5e7eb'
                    }}
                    formatter={(value) => [`${value} tons`, 'CO2 Removed']}
                    labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString()}`}
                  />
                  <Legend 
                    wrapperStyle={{ color: '#9ca3af' }}
                    formatter={(value) => 'Cumulative CO2 Removed'}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="cumulative_co2" 
                    stroke="#22c55e" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorCo2Login)" 
                    name="Cumulative CO2 Removed"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
