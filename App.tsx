
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

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<AppStep>('HOME');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedRound, setSelectedRound] = useState<PerformanceRound | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [bookingTimer, setBookingTimer] = useState<number>(0);
  const [bookings, setBookings] = useState<Booking[]>([]);

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

  const handleLoginSuccess = (userData: User) => {
    setUser(userData);
    if (selectedEvent && selectedRound) {
      setCurrentStep('QUEUE');
    } else {
      setCurrentStep('HOME');
    }
  };

  const handleQueueFinished = () => {
    setCurrentStep('SEATING');
  };

  const handleSeatsConfirmed = (seats: string[]) => {
    setSelectedSeats(seats);
    setBookingTimer(600);
    setCurrentStep('PAYMENT');
  };

  const handlePaymentSuccess = () => {
    const newBooking: Booking = {
      orderId: `NV-${Math.floor(Math.random() * 90000000 + 10000000)}`,
      event: selectedEvent!,
      roundId: selectedRound!.id, // Store roundId for persistent seat blocking
      seats: selectedSeats,
      totalPrice: selectedSeats.length * 7500 + 200,
      bookingDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    };
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
            onConfirm={handleSeatsConfirmed} 
          />
        )}
        {currentStep === 'PAYMENT' && selectedEvent && (
          <Payment 
            event={selectedEvent} 
            seats={selectedSeats} 
            timer={bookingTimer}
            onSuccess={handlePaymentSuccess}
          />
        )}
        {currentStep === 'CONFIRMATION' && selectedEvent && (
          <Confirmation 
            event={selectedEvent} 
            seats={selectedSeats} 
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

      <button className="fixed bottom-6 right-6 w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center shadow-lg hover:bg-purple-500 transition-colors z-50">
        <i className="fas fa-question text-white"></i>
      </button>
    </div>
  );
};

export default App;
