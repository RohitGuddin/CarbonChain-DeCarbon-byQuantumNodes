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
  const [selectedTxId, setSelectedTxId] = useState(null);
  const timelineRef = useRef(null);
  const transactionRefs = useRef({});

  useEffect(() => {
    gsap.fromTo('.explorer-container', 
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
    );
    fetchTransactions();
  }, []);

  // Auto-scroll to latest block when transactions are loaded
  useEffect(() => {
    if (transactions.length > 0 && !loading) {
      setTimeout(() => {
        const container = timelineRef.current?.parentElement;
        if (container) {
          container.scrollTo({
            left: container.scrollWidth,
            behavior: 'smooth'
          });
        }
      }, 1500);
    }
  }, [transactions.length, loading]);

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
    const blocks = timelineRef.current?.querySelectorAll('.block-cube-3d');
    if (blocks) {
      blocks.forEach((block, index) => {
        // Set initial 3D position
        gsap.set(block, {
          rotationX: -25,
          rotationY: (index % 2 === 0 ? -15 : 15),
          z: -400,
          opacity: 0,
          scale: 0.5,
          transformPerspective: 1500,
          transformOrigin: "center center"
        });

        // Animate to final position with 3D effect
        gsap.to(block, {
          rotationX: 0,
          rotationY: 0,
          z: 0,
          opacity: 1,
          scale: 1,
          duration: 1.5,
          delay: index * 0.08,
          ease: 'power3.out',
          onComplete: () => {
            // Add subtle continuous float
            gsap.to(block, {
              y: -3,
              duration: 2 + (index % 4) * 0.5,
              repeat: -1,
              yoyo: true,
              ease: 'sine.inOut'
            });
          }
        });

        // Interactive 3D hover effects
        block.addEventListener('mouseenter', () => {
          gsap.to(block, {
            rotationY: (index % 2 === 0 ? 15 : -15),
            rotationX: 8,
            z: 80,
            scale: 1.05, // Reduced scale to prevent layout shifts
            duration: 0.4,
            ease: 'power2.out',
            transformOrigin: "center center"
          });
        });

        block.addEventListener('mouseleave', () => {
          gsap.to(block, {
            rotationY: 0,
            rotationX: 0,
            z: 0,
            scale: 1,
            duration: 0.4,
            ease: 'power2.out',
            transformOrigin: "center center"
          });
        });

        // Parallax mouse tracking
        block.addEventListener('mousemove', (e) => {
          const rect = block.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          const rotateX = ((y - centerY) / centerY) * -15;
          const rotateY = ((x - centerX) / centerX) * 15;

          gsap.to(block, {
            rotationX: rotateX,
            rotationY: rotateY,
            duration: 0.2,
            ease: 'power1.out'
          });
        });
      });
    }
  };

  // Calculate block size based on credits
  const getBlockSize = (credits) => {
    const baseSize = 80;
    const maxSize = 180;
    const size = Math.min(baseSize + (credits * 2), maxSize);
    return size;
  };

  // Handle block click - scroll to transaction detail
  const handleBlockClick = (txId, txHash) => {
    setSelectedTxId(txId);
    const transactionElement = transactionRefs.current[txId];
    
    if (transactionElement) {
      // Scroll to the transaction detail with smooth behavior
      transactionElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
      
      // Add a highlight effect
      transactionElement.classList.add('transaction-highlight');
      
      // Remove highlight after animation
      setTimeout(() => {
        transactionElement.classList.remove('transaction-highlight');
        // Keep selected state for a bit longer
        setTimeout(() => {
          setSelectedTxId(null);
        }, 2000);
      }, 2000);
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

      {/* Mempool-style Block Grid */}
      <div className="card card-glow p-8 hover-lift">
        <h2 className="text-3xl font-bold text-gray-200 mb-6 flex items-center">
          <Search className="h-7 w-7 mr-3 text-green-500" />
          Block Explorer
        </h2>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="text-center">
              <div className="spinner mx-auto mb-4"></div>
              <p className="text-gray-400">Loading blocks...</p>
            </div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-block p-6 glass border border-gray-800 rounded-full mb-4">
              <Search className="h-12 w-12 text-gray-600" />
            </div>
            <p className="text-xl text-gray-400">No blocks found</p>
            <p className="text-sm text-gray-500 mt-2">Blocks will appear here once transactions are created</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Blockchain Chain - Horizontal Scrollable */}
            <div className="blockchain-chain-container">
              <div ref={timelineRef} className="blockchain-chain perspective-3d">
                {transactions.map((tx, index) => {
                  const timestamp = formatTimestamp(tx.timestamp);
                  const blockSize = getBlockSize(tx.credits);
                  const isMinting = tx.type === 'minting';
                  
                  return (
                    <React.Fragment key={tx.id}>
                      {/* Chain Link Connector */}
                      {index > 0 && (
                        <div className="chain-connector">
                          <div className="chain-link-line"></div>
                          <div className="chain-link-arrow">
                            <ArrowRight className="h-4 w-4 text-green-500/50" />
                          </div>
                        </div>
                      )}
                      
                      {/* 3D Block Cube */}
                      <div
                        className="block-cube-3d"
                        data-tx-id={tx.id}
                        data-tx-hash={tx.tx_hash}
                        style={{
                          width: `${blockSize}px`,
                          height: `${blockSize}px`,
                          minWidth: `${blockSize}px`,
                          transformStyle: 'preserve-3d',
                          cursor: 'pointer',
                          flexShrink: 0
                        }}
                        title={`Block #${tx.block_number} - ${tx.credits} Credits - Click to view details`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBlockClick(tx.id, tx.tx_hash);
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleBlockClick(tx.id, tx.tx_hash);
                          }
                        }}
                      >
                    {/* 3D Cube Container */}
                    <div
                      className="block-cube-inner"
                      style={{
                        width: '100%',
                        height: '100%',
                        transformStyle: 'preserve-3d',
                        position: 'relative'
                      }}
                    >
                      {/* Front Face */}
                      <div
                        className={`block-face block-front absolute inset-0 rounded-lg border-2 flex flex-col items-center justify-center p-2 ${
                          isMinting
                            ? 'bg-gradient-to-br from-green-600/90 to-green-800/90 border-green-400/50'
                            : 'bg-gradient-to-br from-blue-600/90 to-blue-800/90 border-blue-400/50'
                        }`}
                        style={{
                          transform: 'translateZ(15px)',
                          boxShadow: `0 0 25px ${isMinting ? 'rgba(34, 197, 94, 0.5)' : 'rgba(59, 130, 246, 0.5)'}, inset 0 0 15px ${isMinting ? 'rgba(34, 197, 94, 0.2)' : 'rgba(59, 130, 246, 0.2)'}`
                        }}
                      >
                        <Hash className={`h-4 w-4 mb-1 ${isMinting ? 'text-green-200' : 'text-blue-200'}`} />
                        <div className={`text-[10px] font-bold ${isMinting ? 'text-green-100' : 'text-blue-100'}`}>
                          #{tx.block_number}
                        </div>
                        <div className={`text-base font-bold mt-0.5 ${isMinting ? 'text-green-100' : 'text-blue-100'}`}>
                          {tx.credits}
                        </div>
                        <div className={`text-[9px] mt-0.5 ${isMinting ? 'text-green-200' : 'text-blue-200'}`}>
                          Credits
                        </div>
                      </div>

                      {/* Top Face */}
                      <div
                        className={`block-face block-top absolute inset-0 rounded-lg ${
                          isMinting ? 'bg-green-700/90' : 'bg-blue-700/90'
                        }`}
                        style={{
                          transform: 'rotateX(90deg) translateZ(15px)',
                          transformOrigin: 'top',
                          height: '15px'
                        }}
                      />

                      {/* Right Face */}
                      <div
                        className={`block-face block-right absolute inset-0 rounded-lg ${
                          isMinting ? 'bg-green-800/90' : 'bg-blue-800/90'
                        }`}
                        style={{
                          transform: 'rotateY(90deg) translateZ(15px)',
                          transformOrigin: 'right',
                          width: '15px'
                        }}
                      />
                    </div>

                    {/* Tooltip on hover */}
                    <div className="block-tooltip absolute -top-2 left-1/2 transform -translate-x-1/2 -translate-y-full mb-2 opacity-0 pointer-events-none transition-opacity duration-300 z-[100]">
                      <div className="glass border border-gray-700 rounded-lg p-3 text-xs min-w-[200px] shadow-2xl relative z-[100]">
                        <div className="font-bold text-gray-200 mb-1">Block #{tx.block_number}</div>
                        <div className="text-gray-400 space-y-1">
                          <div>Credits: <span className="text-green-400 font-semibold">{tx.credits}</span></div>
                          <div>Type: <span className="capitalize">{tx.type}</span></div>
                          <div className="font-mono text-[10px] break-all">{tx.tx_hash.substring(0, 16)}...</div>
                          <div className="text-[10px]">{timestamp.date} {timestamp.time}</div>
                        </div>
                      </div>
                    </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Detailed View Toggle */}
            <div className="mt-12 pt-8 border-t border-gray-800 relative z-10 bg-black/50 backdrop-blur-sm">
              <h3 className="text-xl font-bold text-gray-200 mb-4">Transaction Details</h3>
              <div className="space-y-4">
                {transactions.map((tx, index) => {
                  const timestamp = formatTimestamp(tx.timestamp);
                  const isSelected = selectedTxId === tx.id;
                  return (
                    <div
                      key={tx.id}
                      ref={(el) => {
                        if (el) {
                          transactionRefs.current[tx.id] = el;
                        }
                      }}
                      className={`glass border rounded-lg p-4 hover-lift transition-all duration-300 ${
                        tx.type === 'minting' ? 'border-green-500/30' : 'border-blue-500/30'
                      } ${
                        isSelected ? 'ring-4 ring-green-500/50 border-green-500 scale-[1.02] shadow-2xl' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Hash className="h-4 w-4 text-gray-400" />
                            <span className="font-mono text-sm text-gray-300">Block #{tx.block_number}</span>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center space-x-1 ${getTransactionColor(tx.type)}`}>
                            {getTransactionIcon(tx.type)}
                            <span className="capitalize">{tx.type}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="text-gray-400">
                            <span className="font-semibold text-green-400">{tx.credits}</span> Credits
                          </div>
                          <div className="flex items-center space-x-2 text-gray-500">
                            <Clock className="h-4 w-4" />
                            <span>{timestamp.date} {timestamp.time}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 font-mono text-xs text-gray-500 break-all">
                        {tx.tx_hash}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Explorer;
