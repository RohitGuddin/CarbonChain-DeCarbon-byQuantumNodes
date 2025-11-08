import React from 'react';
import { Leaf } from 'lucide-react';

const LoadingSpinner = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-100">
      <div className="text-center">
        <div className="relative">
          <Leaf className="h-16 w-16 text-green-600 mx-auto animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="spinner"></div>
          </div>
        </div>
        <p className="mt-4 text-lg font-medium text-gray-700">Loading CarbonChain...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;




