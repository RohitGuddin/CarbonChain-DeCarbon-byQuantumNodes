import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { gsap } from 'gsap';
import { 
  Leaf, 
  ShoppingCart, 
  Search, 
  User, 
  LogOut, 
  Menu, 
  X,
  Wallet,
  RefreshCw
} from 'lucide-react';

const Navbar = ({ user, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userCredits, setUserCredits] = useState(0);
  const [isUpdatingCredits, setIsUpdatingCredits] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Animate navbar on mount
    gsap.fromTo('.navbar', 
      { y: -100, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
    );
  }, []);

  useEffect(() => {
    // Fetch user credits
    if (user) {
      fetchUserCredits();
      
      // Set up polling to refresh credits every 3 seconds
      const interval = setInterval(() => {
        fetchUserCredits();
      }, 3000);
      
      return () => {
        clearInterval(interval);
      };
    }
  }, [user]);

  const fetchUserCredits = async () => {
    try {
      setIsUpdatingCredits(true);
      const response = await fetch(`/api/user/${user.id}/credits`);
      const data = await response.json();
      const newCredits = data.total_credits || 0;
      setUserCredits(newCredits);
    } catch (error) {
      console.error('Error fetching user credits:', error);
    } finally {
      setIsUpdatingCredits(false);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: Leaf },
    { name: 'Explorer', path: '/explorer', icon: Search },
  ];

  // Add marketplace link only for company users (not admin)
  if (user?.role !== 'admin') {
    navItems.splice(1, 0, { name: 'Marketplace', path: '/marketplace', icon: ShoppingCart });
  }

  if (user?.role === 'admin') {
    navItems.push({ name: 'Admin', path: '/admin', icon: User });
  }

  return (
    <nav className="navbar glass border-b border-gray-800 sticky top-0 z-50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-green-500 rounded-lg blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <Leaf className="h-8 w-8 text-green-500 relative z-10 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold gradient-text">
                EcoChain
              </span>
              <span className="text-xs text-gray-500 -mt-1">by QuantumNodes</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 relative group ${
                    isActive
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'text-gray-400 hover:text-green-400 hover:bg-gray-800/50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 to-green-400"></div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* User Info & Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Wallet Balance */}
            <div className="flex items-center space-x-2 glass border border-gray-800 px-4 py-2 rounded-lg hover:border-green-500/50 transition-all duration-300">
              <Wallet className={`h-4 w-4 text-green-500 ${isUpdatingCredits ? 'animate-pulse' : ''}`} />
              <span className="text-sm font-medium text-gray-200">
                {isUpdatingCredits ? 'Updating...' : `${userCredits.toFixed(2)} Credits`}
              </span>
              <button
                onClick={fetchUserCredits}
                className="p-1 text-gray-400 hover:text-green-500 transition-colors rounded hover:bg-gray-800"
                title="Refresh Credits"
              >
                <RefreshCw className={`h-3 w-3 ${isUpdatingCredits ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-3 glass border border-gray-800 px-4 py-2 rounded-lg">
              <div className="text-sm">
                <div className="font-medium text-gray-200">{user.name}</div>
                <div className="text-xs text-gray-500 capitalize">{user.role}</div>
              </div>
              <button
                onClick={onLogout}
                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-300"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-400 hover:text-green-400 transition-colors"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-800 py-4 animate-slide-up">
            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'text-gray-400 hover:text-green-400 hover:bg-gray-800/50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              
              {/* Mobile User Info */}
              <div className="pt-4 border-t border-gray-800">
                <div className="flex items-center justify-between px-3 py-2 glass border border-gray-800 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-200">{user.name}</div>
                    <div className="text-xs text-gray-500 capitalize">{user.role}</div>
                    <div className="text-sm text-green-400 font-medium mt-1">
                      {isUpdatingCredits ? 'Updating...' : `${userCredits.toFixed(2)} Credits`}
                    </div>
                  </div>
                  <button
                    onClick={onLogout}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
