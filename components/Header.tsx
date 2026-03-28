
import React from 'react';
import { AppStep, User } from '../types';

interface HeaderProps {
  user: User | null;
  currentStep: AppStep;
  onBack: () => void;
  onLogout: () => void;
  onLoginClick: () => void;
  onMyBookings: () => void;
  onHomeClick: () => void;
  onBrowseAll: () => void;
  onLatestNews: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  user, currentStep, onBack, onLogout, onLoginClick, onMyBookings, onHomeClick, onBrowseAll, onLatestNews 
}) => {
  // Logic updated to hide back button on LOGIN step
  const showBack = currentStep !== 'HOME' && 
                   currentStep !== 'CONFIRMATION' && 
                   currentStep !== 'MY_BOOKINGS' && 
                   currentStep !== 'LOGIN';
                   
  const showLoginButton = !user && currentStep !== 'LOGIN';

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-neutral-900/80 backdrop-blur-md border-b border-white/10 z-50 px-4 md:px-8 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {showBack && (
          <button 
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-full transition-colors flex items-center gap-2 text-rose-500 font-bold"
          >
            <i className="fas fa-arrow-left"></i>
            <span className="hidden md:inline">Back</span>
          </button>
        )}
        <div className="flex items-center gap-2 cursor-pointer group" onClick={onHomeClick}>
          <div className="w-8 h-8 bg-rose-600 rounded-lg flex items-center justify-center font-black italic group-hover:scale-110 transition-transform">N</div>
          <span className="text-xl font-bold tracking-tighter">NOVA<span className="text-rose-600">TICKET</span></span>
        </div>
      </div>

      <nav className="hidden lg:flex items-center gap-8">
        <button 
          onClick={onBrowseAll} 
          className={`text-sm font-bold transition-colors ${currentStep === 'BROWSE_ALL' ? 'text-rose-500' : 'text-neutral-400 hover:text-white'}`}
        >
          Explore
        </button>
        <button 
          onClick={onLatestNews} 
          className={`text-sm font-bold transition-colors ${currentStep === 'LATEST_NEWS' ? 'text-rose-500' : 'text-neutral-400 hover:text-white'}`}
        >
          News
        </button>
      </nav>

      <div className="flex items-center gap-2 md:gap-6">
        <a 
          href="#" 
          className="hidden sm:flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm font-bold"
          onClick={(e) => e.preventDefault()}
        >
          <i className="fas fa-circle-question"></i>
          Help
        </a>
        {user ? (
          <>
            <button 
              onClick={onMyBookings}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${currentStep === 'MY_BOOKINGS' ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/20' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
            >
              <i className="fas fa-ticket"></i>
              <span className="hidden md:inline">My Bookings</span>
            </button>
            
            <div className="flex items-center gap-3 border-l border-white/10 pl-4 md:pl-6">
              <div className="hidden md:block text-right">
                <p className="text-[10px] text-neutral-500 leading-none">Logged in as</p>
                <p className="text-sm font-semibold">{user.name}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center border-2 border-purple-400/30">
                <i className="fas fa-user text-white text-xs"></i>
              </div>
              <button onClick={onLogout} className="text-neutral-400 hover:text-white transition-colors p-2" title="Logout">
                <i className="fas fa-sign-out-alt"></i>
              </button>
            </div>
          </>
        ) : (
          showLoginButton && (
            <button 
              onClick={onLoginClick}
              className="bg-rose-600 hover:bg-rose-500 px-6 py-2 rounded-full text-sm font-bold transition-transform active:scale-95 shadow-lg shadow-rose-900/20"
            >
              Login
            </button>
          )
        )}
      </div>
    </header>
  );
};

export default Header;
