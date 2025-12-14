import React from 'react';
import config from '../../config';

const Home = () => {
  const REDIRECT_URI = `${config.frontendUrl}/secure`

  const handleLoginClick = () => {
    // 1. Generate random state for security
    const state = Math.random().toString(36).substring(7);

    // 2. Build params
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: REDIRECT_URI,
      state: state,
    });

    // 3. Redirect to Auth Server
    window.location.href = `${config.backendUrl}/auth/authorize?${params.toString()}`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 font-sans">
      <div className="bg-white p-10 rounded-2xl shadow-xl border border-blue-100 max-w-lg w-full text-center">
        
        {/* Logo */}
        <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg transform -rotate-6">
          <span className="text-3xl">🚀</span>
        </div>

        <h1 className="text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">
          Portal App
        </h1>
        <p className="text-slate-500 text-lg mb-10 leading-relaxed">
          This is an external client application. Click below to authenticate via the central SSO service.
        </p>

        <button
          onClick={handleLoginClick}
          className="w-full flex justify-center py-4 px-4 border border-transparent text-lg font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all"
        >
          Login with SSO
        </button>

        <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Debug Info</p>
            <div className="mt-4 text-left text-xs text-gray-600 space-y-2 bg-gray-50 p-4 rounded-lg border border-gray-200 font-mono">
                <p>Client ID: {config.clientId}</p>
                <p>Redirect: {REDIRECT_URI}</p>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Home;