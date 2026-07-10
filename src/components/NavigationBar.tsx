import { Home, Calendar, User } from 'lucide-react';

interface NavigationBarProps {
  activeTab: 'home' | 'bookings' | 'profile';
  onTabChange: (tab: 'home' | 'bookings' | 'profile') => void;
}

export default function NavigationBar({ activeTab, onTabChange }: NavigationBarProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-20 bg-white border-t border-[#F6F5F2] flex justify-around items-center px-6 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
      <button 
        onClick={() => onTabChange('home')}
        className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-[#7FA8A4]' : 'text-[#7A7A7A]'} hover:text-[#7FA8A4] transition-colors`}
      >
        <div className={`w-1 h-1 rounded-full mb-1 transition-colors ${activeTab === 'home' ? 'bg-[#7FA8A4]' : 'bg-transparent'}`}></div>
        <Home size={20} className={activeTab === 'home' ? 'stroke-2' : 'stroke-[1.5]'} />
        <span className="text-[10px] font-bold uppercase mt-1">Home</span>
      </button>
      
      <button 
        onClick={() => onTabChange('bookings')}
        className={`flex flex-col items-center gap-1 ${activeTab === 'bookings' ? 'text-[#7FA8A4]' : 'text-[#7A7A7A]'} hover:text-[#7FA8A4] transition-colors`}
      >
        <div className={`w-1 h-1 rounded-full mb-1 transition-colors ${activeTab === 'bookings' ? 'bg-[#7FA8A4]' : 'bg-transparent'}`}></div>
        <Calendar size={20} className={activeTab === 'bookings' ? 'stroke-2' : 'stroke-[1.5]'} />
        <span className="text-[10px] font-bold uppercase mt-1">Bookings</span>
      </button>
      
      <button 
        onClick={() => onTabChange('profile')}
        className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-[#7FA8A4]' : 'text-[#7A7A7A]'} hover:text-[#7FA8A4] transition-colors`}
      >
        <div className={`w-1 h-1 rounded-full mb-1 transition-colors ${activeTab === 'profile' ? 'bg-[#7FA8A4]' : 'bg-transparent'}`}></div>
        <User size={20} className={activeTab === 'profile' ? 'stroke-2' : 'stroke-[1.5]'} />
        <span className="text-[10px] font-bold uppercase mt-1">Profile</span>
      </button>
    </div>
  );
}
