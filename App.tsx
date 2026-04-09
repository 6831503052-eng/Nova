
import React, { useState, useEffect } from 'react';
import { AppStep, Event, User, PerformanceRound, Booking } from './types';
import Header from './components/Header';
import Home from './components/Home';
import EventDetail from './components/EventDetail';
import Login from './components/Login';
import QueueRoom from './components/QueueRoom';
import SeatingPlan from './components/SeatingPlan';
import Payment from './components/Payment';
import Confirmation from './components/Confirmation';
import MyBookings from './components/MyBookings';
import BrowseAll from './components/BrowseAll';
import LatestNews from './components/LatestNews';
import { io } from 'socket.io-client';

interface Notification {
  type: 'UPCOMING_SALE' | 'SALE_OPEN';
  title: string;
  message: string;
  eventId: string;
}

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<AppStep>('HOME');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedRound, setSelectedRound] = useState<PerformanceRound | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [bookingTimer, setBookingTimer] = useState<number>(0);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [validatedTotal, setValidatedTotal] = useState<number | null>(null);
  const [validationToken, setValidationToken] = useState<string | null>(null);

  useEffect(() => {
    const socket = io();
    
    socket.on('notification', (data: Notification) => {
      // Only show notification if user is logged in
      if (user) {
        console.log('Received notification:', data);
        setNotification(data);
        // Auto-hide after 10 seconds
        setTimeout(() => setNotification(null), 10000);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user]); // Re-bind when user state changes

  const goBack = () => {
    switch (currentStep) {
      case 'EVENT_DETAIL': setCurrentStep('BROWSE_ALL'); break;
      case 'LOGIN': setCurrentStep('EVENT_DETAIL'); break;
      case 'QUEUE': setCurrentStep('EVENT_DETAIL'); break;
      case 'SEATING': setCurrentStep('HOME'); break;
      case 'PAYMENT': setCurrentStep('SEATING'); break;
      case 'MY_BOOKINGS': handleReturnHome(); break;
      case 'BROWSE_ALL': setCurrentStep('HOME'); break;
      case 'LATEST_NEWS': setCurrentStep('HOME'); break;
      default: setCurrentStep('HOME');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setBookings([]); // Clear bookings on logout
    if (['QUEUE', 'SEATING', 'PAYMENT', 'MY_BOOKINGS'].includes(currentStep)) {
      setCurrentStep('LOGIN');
    }
  };

  useEffect(() => {
    let interval: any;
    if (bookingTimer > 0) {
      interval = setInterval(() => {
        setBookingTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [bookingTimer]);

  const handleSelectEvent = (event: Event) => {
    setSelectedEvent(event);
    setCurrentStep('EVENT_DETAIL');
  };

  const handleRoundSelected = (round: PerformanceRound) => {
    setSelectedRound(round);
    if (!user) {
      setCurrentStep('LOGIN');
    } else {
      setCurrentStep('QUEUE');
    }
  };

  const handleLoginSuccess = async (userData: User) => {
    setUser(userData);
    
    // Fetch persistent bookings from server
    try {
      const response = await fetch(`/api/bookings/${userData.email}`);
      const data = await response.json();
      setBookings(data);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    }

    if (selectedEvent && selectedRound) {
      setCurrentStep('QUEUE');
    } else {
      setCurrentStep('HOME');
    }
  };

  const handleQueueFinished = React.useCallback(() => {
    setCurrentStep('SEATING');
  }, []);

  const handleSeatsConfirmed = async (seats: string[]) => {
    if (!selectedEvent) return;
    
    setSelectedSeats(seats);
    
    try {
      // Secure Price Validation (Backend as Single Source of Truth)
      const response = await fetch('/api/checkout/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: selectedEvent.id, seats })
      });
      
      const data = await response.json();
      if (data.success) {
        setValidatedTotal(data.total);
        setValidationToken(data.token);
        setBookingTimer(600);
        setCurrentStep('PAYMENT');
      } else {
        alert('Price validation failed. Please try again.');
      }
    } catch (error) {
      console.error('Validation error:', error);
      alert('Network error during price validation.');
    }
  };

  const handlePaymentSuccess = async () => {
    const now = new Date();
    const dateStr = now.getFullYear().toString() + 
                    (now.getMonth() + 1).toString().padStart(2, '0') + 
                    now.getDate().toString().padStart(2, '0');
    const sequence = (bookings.length + 1).toString().padStart(4, '0');
    
    const newBooking: Booking = {
      orderId: `NV-${dateStr}-${sequence}`,
      event: selectedEvent!,
      roundId: selectedRound!.id, // Store roundId for persistent seat blocking
      seats: selectedSeats,
      totalPrice: validatedTotal || (selectedSeats.length * 7500 + 200),
      bookingDate: now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    };

    // Save booking to server for persistence
    try {
      await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email, booking: newBooking })
      });
    } catch (error) {
      console.error('Failed to save booking:', error);
    }

    setBookings([newBooking, ...bookings]);
    setCurrentStep('CONFIRMATION');
  };

  const handleReturnHome = () => {
    setCurrentStep('HOME');
    setSelectedEvent(null);
    setSelectedRound(null);
    setSelectedSeats([]);
  };

  const handleGoToMyBookings = () => {
    setCurrentStep('MY_BOOKINGS');
    setSelectedEvent(null);
    setSelectedRound(null);
    setSelectedSeats([]);
  };

  const handleGoToBrowseAll = () => {
    setCurrentStep('BROWSE_ALL');
    setSelectedEvent(null);
    setSelectedRound(null);
    setSelectedSeats([]);
  };

  const handleTriggerLogin = () => {
    setCurrentStep('LOGIN');
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-950 text-white">
      <Header 
        user={user} 
        currentStep={currentStep} 
        onBack={goBack} 
        onLogout={handleLogout}
        onLoginClick={() => setCurrentStep('LOGIN')}
        onMyBookings={handleGoToMyBookings}
        onHomeClick={handleReturnHome}
        onBrowseAll={() => setCurrentStep('BROWSE_ALL')}
        onLatestNews={() => setCurrentStep('LATEST_NEWS')}
      />

      <main className="flex-1 overflow-y-auto pt-16">
        {currentStep === 'HOME' && (
          <Home 
            onSelectEvent={handleSelectEvent} 
            onBrowseAll={() => setCurrentStep('BROWSE_ALL')}
            onLatestNews={() => setCurrentStep('LATEST_NEWS')}
          />
        )}
        {currentStep === 'BROWSE_ALL' && <BrowseAll onSelectEvent={handleSelectEvent} />}
        {currentStep === 'LATEST_NEWS' && <LatestNews onSelectEvent={handleSelectEvent} />}
        {currentStep === 'EVENT_DETAIL' && selectedEvent && (
          <EventDetail 
            event={selectedEvent} 
            user={user}
            onRoundSelect={handleRoundSelected} 
            onTriggerLogin={handleTriggerLogin}
          />
        )}
        {currentStep === 'LOGIN' && <Login onLogin={handleLoginSuccess} />}
        {currentStep === 'QUEUE' && <QueueRoom onFinished={handleQueueFinished} event={selectedEvent!} />}
        {currentStep === 'SEATING' && selectedEvent && selectedRound && (
          <SeatingPlan 
            event={selectedEvent} 
            selectedRound={selectedRound}
            bookings={bookings}
            user={user!}
            onConfirm={handleSeatsConfirmed} 
          />
        )}
        {currentStep === 'PAYMENT' && selectedEvent && (
          <Payment 
            event={selectedEvent} 
            seats={selectedSeats} 
            timer={bookingTimer}
            total={validatedTotal || 0}
            onSuccess={handlePaymentSuccess}
          />
        )}
        {currentStep === 'CONFIRMATION' && selectedEvent && (
          <Confirmation 
            event={selectedEvent} 
            seats={selectedSeats} 
            orderId={bookings[0]?.orderId || ''}
            onViewBookings={handleGoToMyBookings}
            onBookAnother={handleReturnHome}
          />
        )}
        {currentStep === 'MY_BOOKINGS' && (
          <MyBookings 
            bookings={bookings} 
            onExplore={handleGoToBrowseAll} 
            onBack={handleReturnHome}
          />
        )}
      </main>

      {/* Real-time Notification System UI */}
      {notification && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4 animate-slideDown">
          <div className={`p-6 rounded-3xl border shadow-2xl backdrop-blur-xl flex items-start gap-4 ${
            notification.type === 'SALE_OPEN' 
              ? 'bg-rose-600/90 border-rose-400 text-white' 
              : 'bg-neutral-900/90 border-white/20 text-white'
          }`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              notification.type === 'SALE_OPEN' ? 'bg-white/20' : 'bg-rose-600/20'
            }`}>
              <i className={`fas ${notification.type === 'SALE_OPEN' ? 'fa-bolt' : 'fa-clock'} text-xl`}></i>
            </div>
            <div className="flex-1">
              <h4 className="font-black text-lg leading-tight mb-1">{notification.title}</h4>
              <p className="text-sm opacity-90 leading-relaxed">{notification.message}</p>
              <button 
                onClick={() => setNotification(null)}
                className="mt-3 text-xs font-black uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      <button className="fixed bottom-6 right-6 w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center shadow-lg hover:bg-purple-500 transition-colors z-50">
        <i className="fas fa-question text-white"></i>
      </button>
    </div>
  );
};

export default App;
