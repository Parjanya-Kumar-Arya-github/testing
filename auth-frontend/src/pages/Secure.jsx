import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../../config'; // Ensure this path is correct

const Secure = () => {
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State just for displaying the token in the UI (optional)
  const [displayToken, setDisplayToken] = useState('');

  useEffect(() => {
    // Helper to read cookie for display (only works if cookie is NOT HttpOnly)
    const getTokenFromCookie = () => {
      const match = document.cookie.match(new RegExp('(^| )access_token=([^;]+)'));
      if (match) return match[2];
      return 'Hidden (HttpOnly) or Not Found';
    };

    async function getUser() {
      try {
        setLoading(true);
        // 1. Fetch User Profile using Cookies (credentials: include)
        const res = await fetch(`${config.backendUrl}/auth/profile`, {
          method: 'GET',
          credentials: 'include', // This sends the cookies automatically
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
            // If 401/403, the cookie is likely invalid/expired
            if (res.status === 401 || res.status === 403) {
                throw new Error("Unauthorized: Please log in again.");
            }
            throw new Error(`Server Error: ${res.statusText}`);
        }

        const userData = await res.json();
        setUser(userData);
        setDisplayToken(getTokenFromCookie());

      } catch (err) {
        console.error("Profile fetch failed:", err);
        setError(err.message || "Something went wrong");
        // Optional: Auto-redirect to login on error
        // navigate('/'); 
      } finally {
        setLoading(false);
      }
    }

    // ACTUALLY CALL THE FUNCTION
    getUser();
  }, [navigate]);

  const handleLogout = async () => {
    try {
        // Call backend to clear cookies (important for HttpOnly cookies)
        await fetch(`${config.backendUrl}/auth/logout`, { 
            method: 'POST',
            credentials: 'include' 
        });
    } catch (e) {
        console.error("Logout failed", e);
    }
    // Clear local state/storage if any
    setUser(null);
    // Redirect home
    navigate('/');
  };

  const testApiCall = async () => {
    try {
      const res = await fetch(`${config.backendUrl}/auth/profile`, {
        method: 'GET',
        credentials: 'include'
      });
      const data = await res.json();
      alert(`API Response: ${JSON.stringify(data, null, 2)}`);
    } catch (err) {
      alert("API Call Failed");
    }
  };

  // --- Render States ---

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-xl font-semibold text-gray-600">Verifying Session...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
                <div className="text-red-500 text-5xl mb-4">⚠️</div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Access Denied</h2>
                <p className="text-gray-600 mb-6">{error}</p>
                <button 
                    onClick={() => navigate('/')}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                    Back to Login
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <span className="text-3xl">🍪</span> Secure Dashboard
            </h1>
            <p className="opacity-90 text-sm mt-1">Authenticated via HttpOnly Cookies</p>
          </div>
          <button 
            onClick={handleLogout}
            className="bg-indigo-700 hover:bg-indigo-800 text-white px-4 py-2 rounded-lg text-sm transition-colors border border-indigo-500 shadow-sm"
          >
            Sign Out
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          
          {/* User Profile Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 border-b pb-3 mb-4 flex items-center gap-2">
                User Identity
                <span className="text-xs font-normal text-green-600 bg-green-100 px-2 py-0.5 rounded-full">Active</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Name</label>
                <div className="mt-1 text-gray-900 font-medium text-lg">{user?.name || 'Unknown'}</div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Email</label>
                <div className="mt-1 text-gray-900 font-medium">{user?.email}</div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">User ID</label>
                <div className="mt-1 text-gray-500 font-mono text-xs bg-gray-50 p-1 rounded inline-block">
                    {user?.sub || user?.id}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Roles</label>
                <div className="mt-2 flex flex-wrap gap-2">
                    {user?.globalRole?.length > 0 ? (
                        user.globalRole.map(r => (
                            <span key={r} className="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full font-bold border border-indigo-200">
                                {r}
                            </span>
                        ))
                    ) : (
                        <span className="text-gray-400 text-sm italic">No specific roles</span>
                    )}
                </div>
              </div>
            </div>
          </div>

          {/* Token Inspector */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <div>
                    <h2 className="text-lg font-semibold text-slate-800">Session Cookie Status</h2>
                    <p className="text-xs text-slate-500">Browser is managing credentials automatically</p>
                </div>
                <button 
                  onClick={testApiCall}
                  className="bg-slate-800 hover:bg-black text-white px-4 py-2 rounded-lg text-sm transition shadow-md flex items-center gap-2"
                >
                  <span>⚡</span> Test API Connectivity
                </button>
            </div>
            
            <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto border border-slate-700 shadow-inner">
              <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full ${displayToken.includes('Hidden') ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                  <span className="text-xs text-slate-400 uppercase tracking-widest font-bold">Cookie Value</span>
              </div>
              <code className="text-indigo-300 text-xs break-all font-mono">
                {displayToken}
              </code>
            </div>
            <p className="text-xs text-gray-500 mt-3 flex gap-2 items-start">
               <span className="text-blue-500">ℹ️</span> 
               <span>
                 If this says <strong>"Hidden"</strong>, your backend is correctly setting <code>HttpOnly</code> cookies. 
                 JavaScript cannot read them for security, but the browser will still send them with requests.
               </span>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Secure;