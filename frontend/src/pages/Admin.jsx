import React, { useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  Image as ImageIcon,
  User,
  Calendar,
  Leaf,
  RefreshCw,
  Shield
} from 'lucide-react';
import { plantationAPI } from '../utils/api';

const AdminDashboard = ({ user }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    gsap.fromTo('.admin-container', 
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
    );
    gsap.fromTo('.request-card', 
      { opacity: 0, scale: 0.95 },
      { opacity: 1, scale: 1, duration: 0.5, delay: 0.2, stagger: 0.05, ease: 'power3.out' }
    );
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/pending-requests');
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
        if (data.requests && data.requests.length === 0) {
          setMessage('No pending requests at this time');
        } else {
          setMessage('');
        }
      } else {
        const fallbackResponse = await fetch('/api/admin/requests');
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          setRequests(fallbackData.requests || []);
        } else {
          throw new Error('Failed to fetch requests');
        }
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      setMessage(`Failed to fetch requests: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId, action) => {
    try {
      const response = await fetch(`/api/approve-request/${requestId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          admin_id: user.id,
          action: action
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessage(`Request ${action}d successfully! Credits: ${data.credits || 0}`);
        fetchPendingRequests();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Action failed');
      }
    } catch (error) {
      setMessage(`Failed to ${action} request: ${error.message}`);
    }
  };

  return (
    <div className="admin-container min-h-screen animated-bg py-8 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="absolute inset-0 bg-green-500 rounded-full blur-2xl opacity-30"></div>
            <Shield className="h-16 w-16 text-green-500 relative z-10" />
          </div>
        </div>
        <h1 className="text-5xl font-bold gradient-text mb-4">
          Admin Dashboard
        </h1>
        <p className="text-lg text-gray-400">
          Review and approve plantation requests
        </p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg glass border animate-slide-up ${
          message.includes('successfully') 
            ? 'border-green-500/50 bg-green-500/10 text-green-400' 
            : message.includes('No pending')
            ? 'border-blue-500/50 bg-blue-500/10 text-blue-400'
            : 'border-red-500/50 bg-red-500/10 text-red-400'
        }`}>
          <div className="flex items-center justify-between">
            <span>{message}</span>
            {message.includes('successfully') && (
              <button 
                onClick={() => setMessage('')} 
                className="ml-4 text-sm text-gray-400 hover:text-gray-300 transition-colors"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      )}

      <div className="card card-glow p-8 hover-lift">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-200 flex items-center">
            <Leaf className="h-7 w-7 mr-3 text-green-500" />
            Pending Requests
            <span className="ml-3 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-lg font-semibold border border-green-500/30">
              {requests.length}
            </span>
          </h2>
          <button
            onClick={fetchPendingRequests}
            disabled={loading}
            className="btn btn-secondary px-4 py-2 flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="text-center">
              <div className="spinner mx-auto mb-4"></div>
              <p className="text-gray-400">Loading requests...</p>
            </div>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-block p-6 glass border border-gray-800 rounded-full mb-4">
              <CheckCircle className="h-12 w-12 text-gray-600" />
            </div>
            <p className="text-xl text-gray-400">No pending requests</p>
            <p className="text-sm text-gray-500 mt-2">All requests have been processed</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map((request) => (
              <div key={request.id} className="request-card card card-glow p-6 hover-lift border border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 glass border border-gray-800 rounded-lg">
                      <User className="h-4 w-4 text-gray-400" />
                    </div>
                    <div>
                      <span className="font-semibold text-gray-200 block">{request.user_name}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(request.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mb-4 rounded-lg overflow-hidden border border-gray-800">
                  <img
                    src={`/api/uploads/${request.photo_path.split('/').pop()}`}
                    alt="Plantation"
                    className="w-full h-40 object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) {
                        e.target.nextSibling.style.display = 'flex';
                      }
                    }}
                  />
                  <div className="w-full h-40 glass border border-gray-800 flex items-center justify-center" style={{display: 'none'}}>
                    <ImageIcon className="h-10 w-10 text-gray-600" />
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center space-x-2 glass border border-gray-800 p-3 rounded-lg">
                    <Leaf className="h-4 w-4 text-green-500" />
                    <div className="flex-1">
                      <span className="text-xs text-gray-400 block">Plant Type</span>
                      <span className="text-sm font-semibold text-gray-200">{request.plant_type}</span>
                    </div>
                  </div>
                  <div className="glass border border-gray-800 p-3 rounded-lg">
                    <span className="text-xs text-gray-400 block">CO2 Removed</span>
                    <span className="text-lg font-bold text-green-400">{request.co2_removed} tons</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(request.created_at).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => handleApprove(request.id, 'approve')}
                    className="flex-1 btn btn-primary py-2.5 text-sm flex items-center justify-center space-x-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => handleApprove(request.id, 'reject')}
                    className="flex-1 btn btn-secondary py-2.5 text-sm flex items-center justify-center space-x-2"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
