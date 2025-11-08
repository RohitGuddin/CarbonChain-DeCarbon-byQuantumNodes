import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { 
  Search, 
  Shield, 
  ArrowRight, 
  Clock,
  Hash,
  User,
  Leaf,
  TrendingUp
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
    return type === 'minting' ? <Leaf className="h-5 w-5 text-green-500" /> : <ArrowRight className="h-5 w-5 text-blue-400" />;
  };

  const getTransactionColor = (type) => {
    return type === 'minting' 
      ? 'bg-green-500/20 text-green-400 border-green-500/30' 
      : 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  };

  return (
    <div className="explorer-container min-h-screen animated-bg py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-green-500 rounded-full blur-2xl opacity-30"></div>
            <Shield className="h-16 w-16 text-green-500 relative z-10 pulse-glow" />
          </div>
        </div>
        <h1 className="text-5xl font-bold gradient-text mb-4">
          Blockchain Explorer
        </h1>
        <div className="inline-flex items-center px-4 py-2 glass border border-green-500/30 rounded-full text-green-400 font-semibold text-sm mb-4">
          <Shield className="h-4 w-4 mr-2" />
          Immutable Ledger
        </div>
        <p className="text-lg text-gray-400">
          Explore all carbon credit transactions on the blockchain
        </p>
      </div>

      {message && (
        <div className="mb-6 p-4 rounded-lg glass border border-red-500/50 bg-red-500/10 text-red-400 animate-slide-up">
          {message}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="card card-glow p-6 text-center hover-lift">
          <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-3" />
          <div className="text-4xl font-bold gradient-text mb-2">
            {transactions.length}
          </div>
          <div className="text-gray-400">Total Transactions</div>
        </div>
        <div className="card card-glow p-6 text-center hover-lift">
          <Hash className="h-8 w-8 text-green-500 mx-auto mb-3" />
          <div className="text-4xl font-bold gradient-text mb-2">
            {Math.max(...transactions.map(tx => tx.block_number), 0)}
          </div>
          <div className="text-gray-400">Latest Block</div>
        </div>
        <div className="card card-glow p-6 text-center hover-lift">
          <Leaf className="h-8 w-8 text-green-500 mx-auto mb-3" />
          <div className="text-4xl font-bold gradient-text mb-2">
            {transactions.reduce((sum, tx) => sum + tx.credits, 0).toFixed(1)}
          </div>
          <div className="text-gray-400">Total Credits</div>
        </div>
      </div>

      {/* Blockchain Timeline */}
      <div className="card card-glow p-8 hover-lift">
        <h2 className="text-3xl font-bold text-gray-200 mb-8 flex items-center">
          <Search className="h-7 w-7 mr-3 text-green-500" />
          Transaction History
        </h2>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="text-center">
              <div className="spinner mx-auto mb-4"></div>
              <p className="text-gray-400">Loading transactions...</p>
            </div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-block p-6 glass border border-gray-800 rounded-full mb-4">
              <Search className="h-12 w-12 text-gray-600" />
            </div>
            <p className="text-xl text-gray-400">No transactions found</p>
            <p className="text-sm text-gray-500 mt-2">Transactions will appear here once they are created</p>
          </div>
        ) : (
          <div ref={timelineRef} className="blockchain-timeline space-y-8">
            {transactions.map((tx, index) => {
              const timestamp = formatTimestamp(tx.timestamp);
              return (
                <div key={tx.id} className="block-card">
                  <div className={`relative glass border rounded-xl shadow-2xl p-6 border-l-4 hover-lift ${
                    tx.type === 'minting' ? 'border-l-green-500' : 'border-l-blue-500'
                  }`}>
                    {/* Block Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2 glass border border-gray-800 px-3 py-1.5 rounded-lg">
                          <Hash className="h-4 w-4 text-gray-400" />
                          <span className="font-mono text-sm text-gray-300">
                            Block #{tx.block_number}
                          </span>
                        </div>
                        <div className={`px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center space-x-1 ${getTransactionColor(tx.type)}`}>
                          {getTransactionIcon(tx.type)}
                          <span className="capitalize">{tx.type}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-400 glass border border-gray-800 px-3 py-1.5 rounded-lg">
                        <Clock className="h-4 w-4" />
                        <span>{timestamp.date} {timestamp.time}</span>
                      </div>
                    </div>

                    {/* Transaction Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="glass border border-gray-800 p-4 rounded-lg">
                        <div className="text-xs font-medium text-gray-400 mb-2">Transaction Hash</div>
                        <div className="font-mono text-xs bg-gray-900 p-3 rounded break-all text-gray-300 border border-gray-800">
                          {tx.tx_hash}
                        </div>
                      </div>
                      <div className="glass border border-gray-800 p-4 rounded-lg">
                        <div className="text-xs font-medium text-gray-400 mb-2">Credits</div>
                        <div className="text-3xl font-bold gradient-text">
                          {tx.credits}
                        </div>
                      </div>
                    </div>

                    {/* Users */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="glass border border-gray-800 p-4 rounded-lg">
                        <div className="text-xs font-medium text-gray-400 mb-2">From</div>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-300">{tx.from_user}</span>
                        </div>
                      </div>
                      <div className="glass border border-gray-800 p-4 rounded-lg">
                        <div className="text-xs font-medium text-gray-400 mb-2">To</div>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-300">{tx.to_user}</span>
                        </div>
                      </div>
                    </div>

                    {/* Arrow for transfer transactions */}
                    {tx.type === 'transfer' && (
                      <div className="absolute top-1/2 right-6 transform -translate-y-1/2">
                        <ArrowRight className="h-8 w-8 text-blue-400 opacity-50" />
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
