import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import config from '../../config';

const Login = () => {
  const [searchParams] = useSearchParams();
  
  // 1. Extract params passed by the Backend /authorize redirection
  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const state = searchParams.get('state'); 
  const authMode = searchParams.get('AUTHMODE') || 'PASSWORD';
  const name = searchParams.get('name') || 'Service';

  // 2. UI State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [clientName, setClientName] = useState('Service');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(searchParams.get('error') || "");

  // Fetch client name for display
  useEffect(() => {
    if (clientId) {
            fetch(`${config.backendUrl}/clients/public/${clientId}`)
                .then(res => res.json())
                .then(data =>{ 
                setClientName(data.name || 'Service')
                console.log(data);
                })
                .catch(() => setClientName('External Service'));
        }
  }, [clientId]);

  function handleIITD() {
    const params = new URLSearchParams({
        client_id: clientId, // Ensure this variable is defined in your scope
        redirect_uri: redirectUri,
        requested_role: "User",
    });

    // Navigate the browser directly to the backend
    let url = `${config.backendUrl}/iitd/oauth/redirect?${params.toString()}`;
    window.location.href = url;
    }


  async function handleLogin(e) {
    e.preventDefault(); 
    setIsLoading(true);
    setErrorMsg("");

    try {
        const res = await fetch(`${config.backendUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials:'include',
            body: JSON.stringify({
                email,
                password,
                client_id: clientId,
                redirect_uri: redirectUri,
                state: state 
            })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || 'Login failed');
        }

        // SUCCESS: Redirect back to the client app
        if (data.redirectUrl) {
            window.location.href = data.redirectUrl;
        } else {
            console.error("No redirect URL returned from backend");
        }

    } catch (error) {
        setErrorMsg(error.message || "An unexpected error occurred.");
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 font-sans">
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 w-full max-w-md transition-all">
        
        {/* Header */}
        <div className="mb-6 text-center">
            <h2 className="text-2xl text-slate-800 font-bold mb-2">BSW Auth</h2>
            <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
                <p className="text-xs text-slate-500">
                    Continue to <span className="font-bold text-slate-700">{clientName}</span>
                </p>
            </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center">
            <span>⚠️ {errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
            {(authMode === 'BOTH' || authMode === 'PASS' || authMode === 'PASSWORD') && (
            <>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
                    <input 
                        name="email"
                        type="email" 
                        onChange={(e) => setEmail(e.currentTarget.value)}
                        value={email}
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-800 focus:outline-none"
                        placeholder="name@example.com"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                    <input 
                        name="password"
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.currentTarget.value)}
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-800 focus:outline-none"
                        placeholder="••••••••"
                    />
                </div>
                
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-slate-900 hover:bg-black text-white font-semibold py-3 px-4 rounded-lg transition-all disabled:opacity-70"
                >
                    {isLoading ? "Signing In..." : "Sign In"}
                </button>
            </>
            )}
        </form>
        
        {/* IITD Option */}
        {(authMode === 'BOTH' || authMode === 'IITD_ONLY') && (
            <>
               {authMode === 'BOTH' && (
                    <div className="relative flex py-5 items-center">
                        <div className="flex-grow border-t border-gray-200"></div>
                        <span className="flex-shrink mx-4 text-gray-400 text-xs uppercase">Or continue with</span>
                        <div className="flex-grow border-t border-gray-200"></div>
                    </div>
                )}
                
                <button
                    type="button"
                    className="w-full flex items-center justify-center gap-3 bg-[#E11F25] hover:bg-[#c41b20] text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
                    onClick={handleIITD}
                >
                    <span>🏛️</span> 
                    <span>Log in with IITD Kerberos</span>
                </button>
            </>
        )}
      </div>
    </div>
  );
};

export default Login;