import { useState } from 'react';
import { CoachProfile } from '../types';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface LandingPageProps {
  profile: CoachProfile;
  onEnterBooking: () => void;
}

export default function LandingPage({ profile, onEnterBooking }: LandingPageProps) {
  const [showPhilosophy, setShowPhilosophy] = useState(false);
  const [showExperience, setShowExperience] = useState(false);

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500 overflow-y-auto no-scrollbar pb-32">
      <div className="px-8 pt-12 pb-10 bg-[#7FA8A4] text-white rounded-b-[48px] shadow-sm relative overflow-hidden flex flex-col items-center text-center">
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        {profile.imageUrl ? (
          <div className="w-40 h-40 rounded-full mb-6 border-4 border-white shadow-xl overflow-hidden relative z-10 bg-white">
             <img src={profile.imageUrl} alt={profile.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
        ) : (
          <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center text-5xl mb-6 backdrop-blur-sm border-2 border-white/30 shadow-inner relative z-10">
            🏓
          </div>
        )}
        <h1 className="text-3xl font-bold mb-3 relative z-10">{profile.name} 桌球教室</h1>
        <p className="text-white/90 text-sm font-bold tracking-wide relative z-10">{profile.slogan}</p>
      </div>
      
      <div className="px-8 mt-8 space-y-4">
        {/* Philosophy Accordion */}
        <div className="bg-white rounded-3xl border border-[#C9D6D0]/50 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden transition-all">
          <button 
            onClick={() => setShowPhilosophy(!showPhilosophy)}
            className="w-full p-6 flex justify-between items-center bg-white active:bg-gray-50 transition-colors"
          >
            <h2 className="text-lg font-bold text-[#2F3437] flex items-center gap-2">
              <span className="w-1.5 h-4 bg-[#D9A46A] rounded-full inline-block"></span>
              教學理念
            </h2>
            {showPhilosophy ? <ChevronUp className="text-[#7A7A7A]" size={20} /> : <ChevronDown className="text-[#7A7A7A]" size={20} />}
          </button>
          
          {showPhilosophy && (
            <div className="px-6 pb-6 pt-2 animate-in slide-in-from-top-2 relative">
              <div className="absolute top-0 left-4 text-4xl text-[#7FA8A4]/10 font-serif">"</div>
              <p className="text-[#7A7A7A] text-sm leading-relaxed whitespace-pre-wrap relative z-10 font-medium">
                {profile.philosophy}
              </p>
            </div>
          )}
        </div>

        {/* Experience Accordion */}
        <div className="bg-white rounded-3xl border border-[#C9D6D0]/50 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden transition-all">
          <button 
            onClick={() => setShowExperience(!showExperience)}
            className="w-full p-6 flex justify-between items-center bg-white active:bg-gray-50 transition-colors"
          >
            <h2 className="text-lg font-bold text-[#2F3437] flex items-center gap-2">
              <span className="w-1.5 h-4 bg-[#7FA8A4] rounded-full inline-block"></span>
              教練經歷
            </h2>
            {showExperience ? <ChevronUp className="text-[#7A7A7A]" size={20} /> : <ChevronDown className="text-[#7A7A7A]" size={20} />}
          </button>

          {showExperience && (
            <div className="px-6 pb-6 pt-2 animate-in slide-in-from-top-2">
              <p className="text-[#7A7A7A] text-sm leading-relaxed whitespace-pre-wrap font-medium mb-4">
                {profile.experience}
              </p>
              {profile.photos && profile.photos.length > 0 && (
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {profile.photos.map((photo, i) => (
                    <div key={i} className="aspect-square rounded-xl overflow-hidden border border-[#C9D6D0]/50 shadow-sm">
                      <img src={photo} alt={`Coach Experience ${i + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="px-8 mt-10">
        <button 
          onClick={onEnterBooking}
          className="w-full bg-[#2F3437] text-white py-4 rounded-2xl font-bold shadow-xl active:scale-[0.98] transition-transform flex justify-center items-center gap-2"
        >
          查看可預約課程 
          <span className="text-lg">→</span>
        </button>
      </div>
    </div>
  );
}
