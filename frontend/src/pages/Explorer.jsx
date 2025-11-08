import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { 
  Search, 
  Shield, 
  ArrowRight, 
  Clock,
  Hash,
  User,
  Leaf
} from 'lucide-react';
import { explorerAPI } from '../utils/api';

const Explorer = ({ user }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const timelineRef = useRef(null);

  useEffect(() => {
    gsap.fromTo('.explorer-container', 
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
    );
    fetchTransactions();
  }, []);

  useEffect(() => {
    if (transactions.length > 0) {
      animateBlocks();
    }
  }, [transactions]);

  const fetchTransactions = async () => {
    try {
      const response = await explorerAPI.getTransactions();
      setTransactions(response.data.transactions || []);
    } catch (error) {
      setMessage('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const animateBlocks = () => {
    const blocks = timelineRef.current?.querySelectorAll('.block-card');
    if (blocks) {
      gsap.fromTo(blocks, 
        { 
          opacity: 0, 
          x: (index) => index % 2 === 0 ? -100 : 100,
          scale: 0.8
        },
        { 
          opacity: 1, 
          x: 0, 
          scale: 1,
          duration: 0.8,
          stagger: 0.2,
          ease: 'power3.out'
        }
      );
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString()
    };
  };

  const getTransactionIcon = (type) => {
    return type === 'minting' ? <Leaf className="h-5 w-5 text-green-500" /> : <ArrowRight className="h-5 w-5 text-blue-500" />;
  };

  const getTransactionColor = (type) => {
    return type === 'minting' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800';
  };

  return (
    <div className="explorer-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Shield className="h-8 w-8 text-primary-600 mr-3 pulse-glow" />
          <h1 className="text-4xl font-bold text-gray-900">
            Blockchain Explorer
          </h1>
        </div>
        <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-100 to-green-100 rounded-full text-primary-800 font-semibold text-sm">
          <Shield className="h-4 w-4 mr-2" />
          Immutable Ledger
        </div>
        <p className="text-lg text-gray-600 mt-4">
          Explore all carbon credit transactions on the blockchain
        </p>
      </div>

      {message && (
        <div className="mb-6 p-4 rounded-md bg-red-50 text-red-700">
          {message}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-primary-600 mb-2">
            {transactions.length}
          </div>
          <div className="text-gray-600">Total Transactions</div>
        </div>
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-primary-600 mb-2">
            {Math.max(...transactions.map(tx => tx.block_number), 0)}
          </div>
          <div className="text-gray-600">Latest Block</div>
        </div>
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-primary-600 mb-2">
            {transactions.reduce((sum, tx) => sum + tx.credits, 0).toFixed(1)}
          </div>
          <div className="text-gray-600">Total Credits</div>
        </div>
      </div>

      {/* Blockchain Timeline */}
      <div className="card p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <Search className="h-6 w-6 mr-2 text-primary-600" />
          Transaction History
        </h2>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="spinner"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No transactions found
          </div>
        ) : (
          <div ref={timelineRef} className="blockchain-timeline space-y-8">
            {transactions.map((tx, index) => {
              const timestamp = formatTimestamp(tx.timestamp);
              return (
                <div key={tx.id} className="block-card">
                  <div className={`relative bg-white rounded-lg shadow-lg p-6 border-l-4 ${
                    tx.type === 'minting' ? 'border-green-500' : 'border-blue-500'
                  }`}>
                    {/* Block Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <Hash className="h-4 w-4 text-gray-500" />
                          <span className="font-mono text-sm text-gray-600">
                            Block #{tx.block_number}
                          </span>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getTransactionColor(tx.type)}`}>
                          {getTransactionIcon(tx.type)}
                          <span className="ml-1 capitalize">{tx.type}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        <span>{timestamp.date} {timestamp.time}</span>
                      </div>
                    </div>

                    {/* Transaction Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-sm font-medium text-gray-500 mb-1">Transaction Hash</div>
                        <div className="font-mono text-sm bg-gray-100 p-2 rounded break-all">
                          {tx.tx_hash}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-500 mb-1">Credits</div>
                        <div className="text-2xl font-bold text-primary-600">
                          {tx.credits}
                        </div>
                      </div>
                    </div>

                    {/* Users */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium text-gray-500 mb-1">From</div>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{tx.from_user}</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-500 mb-1">To</div>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{tx.to_user}</span>
                        </div>
                      </div>
                    </div>

                    {/* Arrow for transfer transactions */}
                    {tx.type === 'transfer' && (
                      <div className="absolute top-1/2 right-4 transform -translate-y-1/2">
                        <ArrowRight className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Explorer;




