import React, { useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { 
  Upload, 
  Leaf, 
  Wallet, 
  Download, 
  Camera, 
  CheckCircle,
  AlertCircle,
  Clock,
  Edit,
  X,
  Save
} from 'lucide-react';
import { plantationAPI, userAPI, invoiceAPI, co2API } from '../utils/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

const CultivatorDashboard = ({ user }) => {
  const [uploadData, setUploadData] = useState({
    photo: null,
    co2_removed: ''
  });
  const [userCredits, setUserCredits] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(null);
  const [editingPrice, setEditingPrice] = useState(null);
  const [priceInput, setPriceInput] = useState('');
  const [updatingPrice, setUpdatingPrice] = useState(false);
  const [co2Data, setCo2Data] = useState([]);
  const [co2Loading, setCo2Loading] = useState(true);

  useEffect(() => {
    // Animate dashboard on mount
    gsap.fromTo('.dashboard-container', 
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
    );
    
    fetchUserData();
    fetchCo2DeclineProfile();
  }, []);

  const fetchCo2DeclineProfile = async () => {
    try {
      setCo2Loading(true);
      const response = await co2API.getDeclineProfile();
      setCo2Data(response.data.data || []);
    } catch (error) {
      console.error('Error fetching CO2 decline profile:', error);
      setCo2Data([]);
    } finally {
      setCo2Loading(false);
    }
  };

  const fetchUserData = async () => {
    try {
      const response = await userAPI.getUserCredits(user.id);
      setUserCredits(response.data);
      setRequests(response.data.credits || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUserCredits({
        total_credits: 0,
        credits: [],
        recent_transactions: []
      });
      setRequests([]);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadData({ ...uploadData, photo: file });
      await analyzeImageWithAI(file);
    }
  };

  const analyzeImageWithAI = async (file) => {
    setAiLoading(true);
    setShowAIAnalysis(false);
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const exifData = {
        latitude: 12.9716 + (Math.random() - 0.5) * 0.1,
        longitude: 77.5946 + (Math.random() - 0.5) * 0.1,
        altitude: 920 + Math.random() * 100,
        timestamp: new Date().toISOString()
      };
      formData.append('exif_data', JSON.stringify(exifData));
      
      const response = await fetch('/api/analyze-plantation', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        setAiAnalysis(result);
        setShowAIAnalysis(true);
        setMessage('AI analysis completed successfully!');
      } else {
        const errorData = await response.json().catch(() => ({ error: 'AI analysis failed' }));
        throw new Error(errorData.error || 'AI analysis failed');
      }
    } catch (error) {
      console.error('AI analysis error:', error);
      setMessage(error.message || 'Plantation review could not be completed. Upload the photo again.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!uploadData.photo) {
      setMessage('Please select a photo first');
      return;
    }

    if (!aiAnalysis) {
      setMessage('Please wait for AI analysis to complete');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('image', uploadData.photo);
      formData.append('user_id', user.id);
      
      const plantationData = {
        plant_type: aiAnalysis.plant_type,
        area: aiAnalysis.area,
        location: aiAnalysis.location,
        planting_date: aiAnalysis.planting_date,
        growth_stage: aiAnalysis.growth_stage
      };
      formData.append('plantation_data', JSON.stringify(plantationData));

      const response = await plantationAPI.uploadRequest(formData);
      
      // Show auto-approval/rejection message
      if (response.data.approved) {
        setMessage(`✅ ${response.data.message} Credits issued: ${response.data.plant_type} detected!`);
      } else {
        setMessage(`❌ ${response.data.message}`);
      }
      
      setUploadData({ photo: null, co2_removed: '' });
      setAiAnalysis(null);
      setShowAIAnalysis(false);
      document.getElementById('photo-upload').value = '';
      
      fetchUserData();
      
    } catch (error) {
      setMessage(error.response?.data?.error || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = async (requestId) => {
    if (!requestId) {
      console.error('No request ID provided');
      setMessage('Error: No request ID available');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    if (downloadingInvoice === requestId) {
      console.log('Already downloading this invoice');
      return;
    }

    try {
      setDownloadingInvoice(requestId);
      console.log('Downloading invoice for request ID:', requestId);
      setMessage('Downloading invoice...');
      
      const response = await fetch(`/api/invoice/${requestId}`, {
        method: 'GET',
      });
      
      console.log('Invoice response status:', response.status);
      const contentType = response.headers.get('content-type');
      console.log('Content-Type:', contentType);
      
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            console.error('Failed to parse error JSON:', e);
          }
        }
        
        throw new Error(errorMessage);
      }
      
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Server returned JSON instead of PDF');
      }
      
      const blob = await response.blob();
      console.log('Invoice blob type:', blob.type);
      console.log('Invoice blob size:', blob.size);
      
      if (!blob || blob.size === 0) {
        throw new Error('Received empty invoice file');
      }
      
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice_${requestId}.pdf`;
      link.style.position = 'fixed';
      link.style.left = '-9999px';
      link.style.top = '-9999px';
      
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 1000);
        setDownloadingInvoice(null);
      }, 100);
      
      setMessage(`Invoice download started! Check your downloads folder.`);
      setTimeout(() => setMessage(''), 3000);
      
    } catch (error) {
      console.error('Download error:', error);
      const errorMessage = error.message || 'Failed to download invoice';
      setMessage(`Failed to download invoice: ${errorMessage}`);
      setTimeout(() => setMessage(''), 5000);
      setDownloadingInvoice(null);
    }
  };

  const handleSetPrice = async (creditId, currentPrice, e) => {
    // Prevent event propagation
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log('handleSetPrice called:', { creditId, currentPrice, editingPrice, creditIdType: typeof creditId, editingPriceType: typeof editingPrice });
    
    // Find the credit to check its status
    const credit = requests.find(c => Number(c.id) === Number(creditId));
    
    // Only allow price editing for approved credits
    if (credit && credit.status !== 'approved') {
      setMessage('You can only set price after your plantation request is automatically approved (Mangrove detected)');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    
    // Ensure type consistency for comparison
    const normalizedCreditId = Number(creditId);
    const normalizedEditingPrice = editingPrice ? Number(editingPrice) : null;
    
    if (normalizedEditingPrice === normalizedCreditId) {
      // Save price
      const price = parseFloat(priceInput);
      if (isNaN(price) || price <= 0) {
        setMessage('Please enter a valid price greater than 0');
        setTimeout(() => setMessage(''), 3000);
        return;
      }

      setUpdatingPrice(true);
      try {
        const response = await fetch(`/api/credit/${creditId}/set-price`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            price_per_credit: price,
            user_id: user.id
          })
        });

        const data = await response.json();

        if (response.ok) {
          setMessage('Price updated successfully!');
          setTimeout(() => setMessage(''), 3000);
          setEditingPrice(null);
          setPriceInput('');
          fetchUserData(); // Refresh data
        } else {
          setMessage(data.error || 'Failed to update price');
          setTimeout(() => setMessage(''), 3000);
        }
      } catch (error) {
        setMessage('Failed to update price');
        setTimeout(() => setMessage(''), 3000);
      } finally {
        setUpdatingPrice(false);
      }
    } else {
      // Start editing
      setEditingPrice(normalizedCreditId);
      setPriceInput(currentPrice ? currentPrice.toString() : '100');
    }
  };

  const cancelPriceEdit = () => {
    setEditingPrice(null);
    setPriceInput('');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  // Updated to match marketplace theme
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500/10 text-green-400 border border-green-500/30';
      case 'rejected':
        return 'bg-red-500/10 text-red-400 border border-red-500/30';
      default:
        return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30';
    }
  };

  return (
    <div className="dashboard-container min-h-screen animated-bg py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold gradient-text mb-4">
          Welcome, {user.name}!
        </h1>
        <p className="text-lg text-gray-400">
          Upload your plantation photos and earn carbon credits
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Form */}
        <div className="lg:col-span-2">
          <div className="card card-glow p-6">
            <h2 className="text-2xl font-bold text-gray-200 mb-2 flex items-center">
              <Upload className="h-6 w-6 mr-2 text-primary-500" />
              Upload Plantation Request
            </h2>
            <p className="text-sm text-gray-400 mb-6 ml-8">
              📌 <strong>Auto-Approval:</strong> Only Mangrove trees are automatically approved. Other plant types will be rejected.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Plantation Photo
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-700 border-dashed rounded-lg hover:border-primary-500 transition-colors bg-white/5">
                  <div className="space-y-1 text-center">
                    <Camera className="mx-auto h-12 w-12 text-gray-500" />
                    <div className="flex text-sm text-gray-400">
                      <label
                        htmlFor="photo-upload"
                        className="relative cursor-pointer bg-transparent rounded-md font-medium text-primary-500 hover:text-primary-400 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-900 focus-within:ring-primary-500"
                      >
                        <span>Upload a photo</span>
                        <input
                          id="photo-upload"
                          name="photo-upload"
                          type="file"
                          className="sr-only"
                          accept="image/*"
                          onChange={handleFileChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                  </div>
                </div>
                {uploadData.photo && (
                  <p className="mt-2 text-sm text-green-400">
                    Selected: {uploadData.photo.name}
                  </p>
                )}
              </div>

              {/* AI Analysis Loading */}
              {aiLoading && (
                <div className="glass border border-blue-500/30 bg-blue-500/10 rounded-lg p-6 text-center">
                  <div className="flex items-center justify-center space-x-3">
                    <div className="spinner"></div>
                    <div>
                      <h3 className="text-lg font-medium text-blue-300">AI Analysis in Progress</h3>
                      <p className="text-blue-400">Analyzing your plantation photo...</p>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Analysis Results */}
              {showAIAnalysis && aiAnalysis && (
                <div className="glass border border-green-500/30 bg-green-500/10 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-green-300 mb-4 flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    AI Analysis Results
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-green-500">Plant Type</label>
                      <p className="text-green-300 font-semibold">{aiAnalysis.plant_type}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-green-500">Confidence</label>
                      <p className="text-green-300 font-semibold">{(aiAnalysis.confidence * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-green-500">Location</label>
                      <p className="text-green-300 font-semibold">{aiAnalysis.location}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-green-500">Estimated Area</label>
                      <p className="text-green-300 font-semibold">{aiAnalysis.area}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-green-500">Planting Date</label>
                      <p className="text-green-300 font-semibold">{aiAnalysis.planting_date}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-green-500">Growth Stage</label>
                      <p className="text-green-300 font-semibold">{aiAnalysis.growth_stage}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !uploadData.photo || !aiAnalysis || aiLoading}
                className="btn btn-primary w-full py-3 text-base font-medium"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="spinner"></div>
                    <span>Uploading...</span>
                  </div>
                ) : (
                  'Upload Request'
                )}
              </button>
            </form>

            {message && (
              <div className={`mt-4 p-4 rounded-lg glass border animate-slide-up ${
                message.includes('successfully') 
                  ? 'border-green-500/50 bg-green-500/10 text-green-400' 
                  : 'border-red-500/50 bg-red-500/10 text-red-400'
              }`}>
                {message}
              </div>
            )}
          </div>
        </div>

        {/* Wallet & Stats */}
        <div className="space-y-6">
          {/* Wallet Card */}
          <div className="card card-glow p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/30 hover-lift">
            <h3 className="text-lg font-semibold text-gray-300 mb-4 flex items-center">
              <Wallet className="h-5 w-5 mr-2 text-primary-500" />
              Your Wallet
            </h3>
            <div className="text-3xl font-bold gradient-text mb-2">
              {userCredits?.total_credits?.toFixed(2) || '0.00'}
            </div>
            <div className="text-sm text-green-400">Carbon Credits</div>
            <div className="mt-4 text-xs text-gray-500">
              Wallet: {user.wallet_address.slice(0, 10)}...
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card card-glow p-6 hover-lift">
            <h3 className="text-lg font-semibold text-gray-300 mb-4">
              Recent Activity
            </h3>
            <div className="space-y-3">
              {userCredits?.recent_transactions?.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Leaf className="h-4 w-4 text-primary-500" />
                    <span className={tx.type === 'received' ? 'text-green-400' : 'text-red-400'}>
                      {tx.type === 'received' ? '+' : '-'}{tx.credits}
                    </span>
                  </div>
                  <span className="text-gray-500">
                    {new Date(tx.timestamp).toLocaleDateString()}
                  </span>
                </div>
              )) || (
                <p className="text-gray-500 text-sm">No recent activity</p>
              )}
            </div>
          </div>
        </div>
      </div>


      {/* Credits History */}
      {requests.length > 0 && (
        <div className="mt-8 bg-gray-900">
          <div className="card p-6">
            <h3 className="text-xl font-semibold text-gray-100 mb-6">
              Your Carbon Credits
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-900">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plant Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Credits
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price/Credit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requests.map((credit) => (
                    <tr key={credit.id} className="bg-gray-900 hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-100">
                        {credit.plant_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-100 ">
                        {credit.credits}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-100">
                        {credit.status === 'approved' ? (
                          Number(editingPrice) === Number(credit.id) ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={priceInput}
                                onChange={(e) => setPriceInput(e.target.value)}
                                className="w-24 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-gray-100 text-sm focus:outline-none focus:border-green-500"
                                placeholder="Price"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={(e) => handleSetPrice(credit.id, credit.price_per_credit, e)}
                                disabled={updatingPrice}
                                className="p-1 text-green-500 hover:text-green-400 transition-colors"
                                title="Save"
                              >
                                <Save className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={cancelPriceEdit}
                                className="p-1 text-red-500 hover:text-red-400 transition-colors"
                                title="Cancel"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <span>₹{credit.price_per_credit?.toFixed(2) || '100.00'}</span>
                              <button
                                type="button"
                                onClick={(e) => handleSetPrice(credit.id, credit.price_per_credit, e)}
                                className="p-1 text-gray-400 hover:text-green-400 transition-colors"
                                title="Edit price"
                              >
                                <Edit className="h-3 w-3" />
                              </button>
                            </div>
                          )
                        ) : (
                          <span className="text-gray-500 text-sm">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(credit.status)}`}>
                          {getStatusIcon(credit.status)}
                          <span className="ml-1">{credit.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(credit.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {credit.status === 'approved' && credit.request_id ? (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('Invoice button clicked, request_id:', credit.request_id);
                              downloadInvoice(credit.request_id);
                            }}
                            disabled={downloadingInvoice === credit.request_id}
                            className={`inline-flex items-center px-3 py-1.5 rounded-lg transition-all duration-300 font-medium text-sm ${
                              downloadingInvoice === credit.request_id
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : 'bg-primary-600 hover:bg-primary-700 text-white cursor-pointer'
                            }`}
                            type="button"
                          >
                            {downloadingInvoice === credit.request_id ? (
                              <>
                                <div className="spinner mr-1.5" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></div>
                                Downloading...
                              </>
                            ) : (
                              <>
                                <Download className="h-4 w-4 mr-1.5" />
                                Invoice
                              </>
                            )}
                          </button>
                        ) : (
                          <span className="text-gray-400 text-sm">Not available</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CO2 Decline Profile */}
      <div className="mt-8">
        <div className="card card-glow p-6 hover-lift">
          <h3 className="text-2xl font-bold text-gray-200 mb-6 flex items-center">
            <Leaf className="h-6 w-6 mr-2 text-green-500" />
            CO2 Decline Profile
          </h3>
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
                  <linearGradient id="colorCo2" x1="0" y1="0" x2="0" y2="1">
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
                  fill="url(#colorCo2)" 
                  name="Cumulative CO2 Removed"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default CultivatorDashboard;
