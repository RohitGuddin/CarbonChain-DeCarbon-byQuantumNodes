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
  Clock
} from 'lucide-react';
import { plantationAPI, userAPI, invoiceAPI } from '../utils/api';

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

  useEffect(() => {
    // Animate dashboard on mount
    gsap.fromTo('.dashboard-container', 
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
    );
    
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await userAPI.getUserCredits(user.id);
      setUserCredits(response.data);
      setRequests(response.data.credits || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Set default values for hackathon demo
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
      // Start AI analysis immediately
      await analyzeImageWithAI(file);
    }
  };

  const analyzeImageWithAI = async (file) => {
    setAiLoading(true);
    setShowAIAnalysis(false);
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      // Mock EXIF data for demo
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
      setMessage(error.message || 'AI analysis failed. Using fallback detection - please try uploading again.');
      // Even if AI fails, we should still allow upload with fallback data
      // The backend will use fallback detection if AI fails
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
      
      // Use AI analysis data
      const plantationData = {
        plant_type: aiAnalysis.plant_type,
        area: aiAnalysis.area,
        location: aiAnalysis.location,
        planting_date: aiAnalysis.planting_date,
        growth_stage: aiAnalysis.growth_stage
      };
      formData.append('plantation_data', JSON.stringify(plantationData));

      const response = await plantationAPI.uploadRequest(formData);
      
      setMessage(`Request uploaded successfully! AI detected: ${aiAnalysis.plant_type} (${(aiAnalysis.confidence * 100).toFixed(1)}% confidence)`);
      
      // Reset form
      setUploadData({ photo: null, co2_removed: '' });
      setAiAnalysis(null);
      setShowAIAnalysis(false);
      document.getElementById('photo-upload').value = '';
      
      // Refresh user data
      fetchUserData();
      
    } catch (error) {
      setMessage(error.response?.data?.error || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = async (requestId) => {
    try {
      console.log(`Downloading invoice for request ID: ${requestId}`);
      const response = await invoiceAPI.getInvoice(requestId);
      
      if (!response.data) {
        throw new Error('No invoice data received');
      }
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice_${requestId}.pdf`;
      a.style.display = 'none';
      
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
      
      setMessage(`Invoice downloaded successfully!`);
      setTimeout(() => setMessage(''), 3000);
      
    } catch (error) {
      console.error('Download error:', error);
      setMessage(`Failed to download invoice: ${error.response?.data?.error || error.message}`);
      setTimeout(() => setMessage(''), 5000);
    }
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="dashboard-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome, {user.name}!
        </h1>
        <p className="text-lg text-gray-600">
          Upload your plantation photos and earn carbon credits
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Form */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Upload className="h-6 w-6 mr-2 text-primary-600" />
              Upload Plantation Request
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plantation Photo
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-primary-400 transition-colors">
                  <div className="space-y-1 text-center">
                    <Camera className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="photo-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
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
                  <p className="mt-2 text-sm text-green-600">
                    Selected: {uploadData.photo.name}
                  </p>
                )}
              </div>

              {/* AI Analysis Loading */}
              {aiLoading && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                  <div className="flex items-center justify-center space-x-3">
                    <div className="spinner"></div>
                    <div>
                      <h3 className="text-lg font-medium text-blue-900">AI Analysis in Progress</h3>
                      <p className="text-blue-700">Analyzing your plantation photo...</p>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Analysis Results */}
              {showAIAnalysis && aiAnalysis && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-green-900 mb-4 flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    AI Analysis Results
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-green-700">Plant Type</label>
                      <p className="text-green-900 font-semibold">{aiAnalysis.plant_type}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-green-700">Confidence</label>
                      <p className="text-green-900 font-semibold">{(aiAnalysis.confidence * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-green-700">Location</label>
                      <p className="text-green-900 font-semibold">{aiAnalysis.location}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-green-700">Estimated Area</label>
                      <p className="text-green-900 font-semibold">{aiAnalysis.area}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-green-700">Planting Date</label>
                      <p className="text-green-900 font-semibold">{aiAnalysis.planting_date}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-green-700">Growth Stage</label>
                      <p className="text-green-900 font-semibold">{aiAnalysis.growth_stage}</p>
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
              <div className={`mt-4 p-4 rounded-md ${
                message.includes('successfully') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {message}
              </div>
            )}
          </div>
        </div>

        {/* Wallet & Stats */}
        <div className="space-y-6">
          {/* Wallet Card */}
          <div className="card p-6 bg-gradient-to-br from-primary-50 to-primary-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Wallet className="h-5 w-5 mr-2 text-primary-600" />
              Your Wallet
            </h3>
            <div className="text-3xl font-bold text-primary-700 mb-2">
              {userCredits?.total_credits?.toFixed(2) || '0.00'}
            </div>
            <div className="text-sm text-primary-600">Carbon Credits</div>
            <div className="mt-4 text-xs text-gray-600">
              Wallet: {user.wallet_address.slice(0, 10)}...
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Activity
            </h3>
            <div className="space-y-3">
              {userCredits?.recent_transactions?.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Leaf className="h-4 w-4 text-primary-600" />
                    <span className={tx.type === 'received' ? 'text-green-600' : 'text-red-600'}>
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
        <div className="mt-8">
          <div className="card p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              Your Carbon Credits
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plant Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Credits
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
                    <tr key={credit.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {credit.plant_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {credit.credits}
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
                        {credit.status === 'approved' ? (
                          <button
                            onClick={() => downloadInvoice(credit.request_id)}
                            className="text-primary-600 hover:text-primary-900 flex items-center"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Invoice
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
    </div>
  );
};

export default CultivatorDashboard;



