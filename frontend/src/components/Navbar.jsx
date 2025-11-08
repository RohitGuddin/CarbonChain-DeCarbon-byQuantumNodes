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
      console.log('🔄 Fetching credits for user:', user.id);
      const response = await fetch(`/api/user/${user.id}/credits`);
      const data = await response.json();
      console.log('💰 Credits response:', data);
      const newCredits = data.total_credits || 0;
      console.log('💳 Setting credits to:', newCredits);
      setUserCredits(newCredits);
    } catch (error) {
      console.error('❌ Error fetching user credits:', error);
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
    <nav className="navbar bg-white shadow-lg border-b border-primary-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="flex-shrink-0">
              <Leaf className="h-8 w-8 text-primary-600" />
            </div>
            <span className="text-xl font-bold text-primary-800">
              CarbonChain
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* User Info & Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Wallet Balance */}
            <div className="flex items-center space-x-2 bg-primary-50 px-3 py-2 rounded-lg">
              <Wallet className={`h-4 w-4 text-primary-600 ${isUpdatingCredits ? 'animate-pulse' : ''}`} />
              <span className="text-sm font-medium text-primary-700">
                {isUpdatingCredits ? 'Updating...' : `${userCredits.toFixed(2)} Credits`}
              </span>
              <button
                onClick={fetchUserCredits}
                className="p-1 text-primary-600 hover:text-primary-800 transition-colors"
                title="Refresh Credits"
              >
                <RefreshCw className={`h-3 w-3 ${isUpdatingCredits ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-2">
              <div className="text-sm">
                <div className="font-medium text-gray-900">{user.name}</div>
                <div className="text-gray-500 capitalize">{user.role}</div>
              </div>
              <button
                onClick={onLogout}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              
              {/* Mobile User Info */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between px-3 py-2">
                  <div>
                    <div className="font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500 capitalize">{user.role}</div>
                    <div className="text-sm text-primary-600">
                      {isUpdatingCredits ? 'Updating...' : `${userCredits.toFixed(2)} Credits`}
                    </div>
                  </div>
                  <button
                    onClick={onLogout}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
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




