import React from 'react';
import { Leaf } from 'lucide-react';

const LoadingSpinner = () => {
  return (
    <div className="min-h-screen flex items-center justify-center animated-bg">
      <div className="text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-green-500 rounded-full blur-2xl opacity-50 animate-pulse"></div>
          <Leaf className="h-20 w-20 text-green-500 mx-auto relative z-10 float-animation glow-green" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="spinner"></div>
          </div>
        </div>
        <p className="text-lg font-medium text-gray-300">
          Loading <span className="gradient-text font-bold">DeCarbon</span>
          <span className="text-xs text-gray-500 ml-1">by QuantumNodes</span>...
        </p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
