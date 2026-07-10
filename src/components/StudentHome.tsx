import { Session, Booking } from '../types';

interface StudentHomeProps {
  sessions: Session[];
  bookings: Booking[];
  onBookClick: (session: Session) => void;
}

export default function StudentHome({ sessions, bookings, onBookClick }: StudentHomeProps) {
  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <div className="px-8 pt-10 pb-4">
        <h1 className="text-2xl font-bold mb-2">桌球課程預約</h1>
        <p className="text-[#7A7A7A] text-sm">選擇您想上的時段</p>
      </div>
      
      <div className="flex-1 px-6 space-y-4 pb-24">
        {sessions.map((session, index) => {
          const slotsLeft = session.totalSlots - session.bookedSlots;
          const isFull = slotsLeft <= 0;
          const isPrimary = index % 2 === 0;
          
          const hasBooked = bookings.some(b => b.sessionId === session.id && b.status !== 'cancelled');

          return (
            <div 
              key={session.id} 
              className={`rounded-3xl p-5 border ${isPrimary ? 'bg-[#F6F5F2] border-transparent' : 'bg-white border-[#C9D6D0]'}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className={`text-[12px] font-bold tracking-wider ${isPrimary ? 'text-[#D9A46A]' : 'text-[#7A7A7A]'}`}>
                    {session.date}
                  </span>
                  <h3 className="text-lg font-bold mt-1 text-[#2F3437]">{session.title}</h3>
                  {session.description && (
                    <p className="text-[#7A7A7A] text-xs mt-1 line-clamp-2">{session.description}</p>
                  )}
                </div>
                <div className={`px-3 py-1 rounded-full text-[12px] font-bold shadow-sm ${isPrimary ? 'bg-white text-[#7FA8A4]' : 'bg-[#F6F5F2] text-[#2F3437]'}`}>
                  ${session.price.toLocaleString()}
                </div>
              </div>
              <div className="flex flex-col text-[#7A7A7A] text-sm gap-1 mb-4 font-bold">
                <span className="flex items-center gap-1">⏰ {session.startTime} - {session.endTime}</span>
                {session.location && <span className="flex items-center gap-1">📍 {session.location}</span>}
                <span className={`mt-1 flex items-center gap-1 ${isFull ? 'text-red-500' : 'text-[#7FA8A4]'}`}>
                  👤 剩餘名額: {slotsLeft}
                </span>
              </div>
              <button 
                onClick={() => !hasBooked && onBookClick(session)}
                disabled={hasBooked}
                className={`w-full py-3 rounded-2xl font-bold shadow-md transition-shadow active:shadow-inner
                  ${hasBooked ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-70' : isFull ? 'bg-orange-100 text-orange-600' : isPrimary ? 'bg-[#7FA8A4] text-white' : 'bg-[#C9D6D0] text-[#2F3437]'}`}
              >
                {hasBooked ? '已預約' : isFull ? '候補預約' : '立即預約'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
