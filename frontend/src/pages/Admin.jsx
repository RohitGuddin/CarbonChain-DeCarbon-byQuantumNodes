import React, { useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  Image as ImageIcon,
  User,
  Calendar,
  Leaf
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
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      // Try both endpoints for compatibility
      const response = await fetch('/api/pending-requests');
      if (response.ok) {
        const data = await response.json();
        console.log('Pending requests data:', data);
        setRequests(data.requests || []);
        if (data.requests && data.requests.length === 0) {
          setMessage('No pending requests at this time');
        } else {
          setMessage(''); // Clear message if there are requests
        }
      } else {
        // Fallback to admin/requests endpoint
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
    <div className="admin-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Admin Dashboard
        </h1>
        <p className="text-lg text-gray-600">
          Review and approve plantation requests
        </p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-md ${
          message.includes('successfully') ? 'bg-green-50 text-green-700' : 
          message.includes('No pending') ? 'bg-blue-50 text-blue-700' : 
          'bg-red-50 text-red-700'
        }`}>
          {message}
          {message.includes('successfully') && (
            <button 
              onClick={() => setMessage('')} 
              className="ml-2 text-sm underline"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Pending Requests ({requests.length})
          </h2>
          <button
            onClick={fetchPendingRequests}
            disabled={loading}
            className="btn btn-secondary px-4 py-2"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="spinner"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No pending requests
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map((request) => (
              <div key={request.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-gray-500" />
                    <span className="font-medium">{request.user_name}</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(request.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="mb-4">
                  <img
                    src={`/api/uploads/${request.photo_path.split('/').pop()}`}
                    alt="Plantation"
                    className="w-full h-32 object-cover rounded-md"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="w-full h-32 bg-white rounded-md border-2 border-gray-200 flex items-center justify-center" style={{display: 'none'}}>
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2">
                    <Leaf className="h-4 w-4 text-primary-600" />
                    <span className="text-sm font-medium">Plant: {request.plant_type}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    CO2 Removed: {request.co2_removed} tons
                  </div>
                  <div className="text-xs text-gray-500">
                    User: {request.user_name}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleApprove(request.id, 'approve')}
                    className="flex-1 btn btn-primary py-2 text-sm flex items-center justify-center"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleApprove(request.id, 'reject')}
                    className="flex-1 btn btn-secondary py-2 text-sm flex items-center justify-center"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
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



