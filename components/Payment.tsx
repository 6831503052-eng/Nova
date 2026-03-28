
import React, { useState } from 'react';
import { Event } from '../types';

interface PaymentProps {
  event: Event;
  seats: string[];
  timer: number;
  onSuccess: () => void;
}

const Payment: React.FC<PaymentProps> = ({ event, seats, timer, onSuccess }) => {
  const [method, setMethod] = useState<'CARD' | 'QR' | 'WALLET'>('CARD');
  const [isProcessing, setIsProcessing] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePay = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onSuccess();
    }, 2000);
  };

  const total = seats.length * 7500; // Simplified for prototype

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 pb-24">
      <div className="lg:col-span-2 space-y-6">
        {/* Timer Header */}
        <div className="bg-rose-600/10 border border-rose-500/20 rounded-2xl p-4 flex items-center justify-between">
           <div className="flex items-center gap-3">
             <i className="fas fa-clock text-rose-500 animate-pulse"></i>
             <span className="text-sm font-bold text-rose-500 uppercase tracking-wider">Seats held for:</span>
           </div>
           <span className="text-2xl font-black tabular-nums text-rose-500">{formatTime(timer)}</span>
        </div>

        <section className="bg-neutral-900 border border-white/10 rounded-3xl p-6 md:p-8">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-purple-600 text-sm flex items-center justify-center">1</span>
            Payment Method
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <button 
              onClick={() => setMethod('CARD')}
              className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-4 ${method === 'CARD' ? 'bg-rose-600/10 border-rose-600 shadow-xl' : 'bg-black border-white/5 hover:border-white/20'}`}
            >
              <i className="fas fa-credit-card text-2xl"></i>
              <span className="font-bold text-sm">Credit / Debit Card</span>
            </button>
            <button 
              onClick={() => setMethod('QR')}
              className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-4 ${method === 'QR' ? 'bg-rose-600/10 border-rose-600 shadow-xl' : 'bg-black border-white/5 hover:border-white/20'}`}
            >
              <i className="fas fa-qrcode text-2xl"></i>
              <span className="font-bold text-sm">PromptPay QR</span>
            </button>
            <button 
              onClick={() => setMethod('WALLET')}
              className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-4 ${method === 'WALLET' ? 'bg-rose-600/10 border-rose-600 shadow-xl' : 'bg-black border-white/5 hover:border-white/20'}`}
            >
              <i className="fas fa-wallet text-2xl"></i>
              <span className="font-bold text-sm">TrueMoney Wallet</span>
            </button>
          </div>

          {method === 'CARD' && (
            <div className="space-y-4 animate-fadeIn">
               <div className="grid grid-cols-2 gap-4">
                 <div className="col-span-2">
                   <label className="text-[10px] font-bold text-neutral-500 uppercase mb-2 block">Card Number</label>
                   <input className="w-full bg-black border border-white/10 rounded-xl px-4 py-3" placeholder="•••• •••• •••• ••••" />
                 </div>
                 <div>
                   <label className="text-[10px] font-bold text-neutral-500 uppercase mb-2 block">Expiry Date</label>
                   <input className="w-full bg-black border border-white/10 rounded-xl px-4 py-3" placeholder="MM / YY" />
                 </div>
                 <div>
                   <label className="text-[10px] font-bold text-neutral-500 uppercase mb-2 block">CVV</label>
                   <input className="w-full bg-black border border-white/10 rounded-xl px-4 py-3" placeholder="•••" />
                 </div>
               </div>
            </div>
          )}

          {method === 'QR' && (
            <div className="flex flex-col items-center py-8 animate-fadeIn">
              <div className="w-48 h-48 bg-white p-2 rounded-xl mb-4">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=NovaTicket-Payment" alt="QR" className="w-full h-full" />
              </div>
              <p className="text-sm text-neutral-400">Scan this QR code with your banking app</p>
            </div>
          )}
        </section>
      </div>

      <div className="space-y-6">
        <section className="bg-neutral-900 border border-white/10 rounded-3xl p-6 sticky top-24">
          <h2 className="text-xl font-bold mb-6">Order Summary</h2>
          <div className="flex items-start gap-4 mb-6 border-b border-white/5 pb-6">
            <img src={event.image} className="w-20 h-20 rounded-xl object-cover" />
            <div>
              <h3 className="font-bold leading-tight">{event.title}</h3>
              <p className="text-xs text-neutral-500 mt-1">{event.date}</p>
              <p className="text-xs text-rose-500 font-bold mt-1">{event.venue}</p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Selected Seats ({seats.length})</span>
              <span className="font-bold">{seats.join(', ')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Service Fee</span>
              <span className="font-bold">200 THB</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">VAT (7%)</span>
              <span className="font-bold">Included</span>
            </div>
          </div>

          <div className="border-t border-white/10 pt-4 mb-8">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold">Grand Total</span>
              <span className="text-2xl font-black text-rose-500">{(total + 200).toLocaleString()} THB</span>
            </div>
          </div>

          <button 
            onClick={handlePay}
            disabled={isProcessing}
            className="w-full bg-rose-600 hover:bg-rose-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-rose-900/40 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
          >
            {isProcessing ? (
               <><i className="fas fa-spinner fa-spin"></i> Processing...</>
            ) : (
               <>Pay Now & Secure Tickets</>
            )}
          </button>
          
          <p className="text-center text-[10px] text-neutral-500 mt-4 px-4 leading-relaxed">
            By clicking Pay Now, you agree to our Terms of Use and Ticket Policies. All sales are final.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Payment;
