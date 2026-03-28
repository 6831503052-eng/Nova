
import React, { useState } from 'react';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulation of login
    onLogin({
      id: 'usr_1',
      name: email.split('@')[0] || 'User',
      email: email
    });
  };

  return (
    <div className="flex items-center justify-center p-6 mt-12">
      <div className="w-full max-w-md bg-neutral-900 border border-white/10 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-3">
             <i className="fas fa-lock text-white text-2xl"></i>
          </div>
          <h2 className="text-3xl font-bold">Secure Login</h2>
          <p className="text-neutral-500 text-sm mt-2">Access your tickets and bookings</p>
          
          <div className="mt-4 p-3 bg-rose-600/10 border border-rose-600/20 rounded-xl text-rose-500 text-xs font-bold flex items-center justify-center gap-2">
            <i className="fas fa-info-circle"></i>
            Authentication required to continue booking
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-rose-600 transition-colors text-white"
              placeholder="name@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-rose-600 transition-colors text-white"
              placeholder="••••••••"
            />
          </div>
          <div className="flex items-center justify-between text-xs text-rose-500 font-bold">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="accent-rose-600" /> Remember Me
            </label>
            <button type="button" className="hover:underline">Forgot Password?</button>
          </div>
          <button 
            type="submit"
            className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-rose-900/20 transition-transform active:scale-95"
          >
            SIGN IN
          </button>
        </form>

        <div className="mt-10 pt-6 border-t border-white/5 text-center">
          <p className="text-neutral-500 text-sm">Don't have an account?</p>
          <button className="text-purple-500 font-bold text-sm mt-1 hover:underline">Create NovaAccount</button>
        </div>
      </div>
    </div>
  );
};

export default Login;
