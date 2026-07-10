import { Session } from '../types';

interface DiscoveryProps {
  sessions: Session[];
  onBook: (session: Session) => void;
}

export default function Discovery({ sessions, onBook }: DiscoveryProps) {
  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <div className="px-8 pt-10 pb-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Discovery</h1>
          <div className="w-10 h-10 rounded-full bg-[#C9D6D0] flex items-center justify-center text-white font-bold">JD</div>
        </div>
        <p className="text-[#7A7A7A] text-sm mb-2">Available Sessions</p>
        <h2 className="text-lg font-semibold">Choose your coach</h2>
      </div>
      
      <div className="flex-1 px-6 space-y-4">
        {sessions.map((session, index) => {
          const slotsLeft = session.totalSlots - session.bookedSlots;
          const isFull = slotsLeft <= 0;
          const isPrimary = index % 2 === 0;

          return (
            <div 
              key={session.id} 
              className={`rounded-3xl p-5 border ${isPrimary ? 'bg-[#F6F5F2] border-transparent' : 'bg-white border-[#C9D6D0]'}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isPrimary ? 'text-[#D9A46A]' : 'text-[#7A7A7A]'}`}>
                    {session.date}
                  </span>
                  <h3 className="text-md font-bold mt-1">{session.title}</h3>
                </div>
                <div className={`px-3 py-1 rounded-full text-[11px] font-bold shadow-sm ${isPrimary ? 'bg-white text-[#7FA8A4]' : 'bg-[#F6F5F2] text-[#2F3437]'}`}>
                  ${session.price.toLocaleString()}
                </div>
              </div>
              <div className="flex items-center text-[#7A7A7A] text-xs gap-3 mb-4">
                <span>⏰ {session.startTime} - {session.endTime}</span>
                <span className={isFull ? 'text-red-500 font-medium' : ''}>👤 {isFull ? 'Full' : `${slotsLeft} Slots Left`}</span>
              </div>
              <button 
                onClick={() => onBook(session)}
                disabled={isFull}
                className={`w-full py-3 rounded-2xl font-semibold shadow-md transition-shadow active:shadow-inner disabled:opacity-50 disabled:cursor-not-allowed
                  ${isPrimary ? 'bg-[#7FA8A4] text-white' : 'bg-[#C9D6D0] text-[#2F3437]'}`}
              >
                {isFull ? 'Waitlist' : 'Book Now'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
