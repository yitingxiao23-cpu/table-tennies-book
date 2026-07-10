import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileCompletion() {
  const { userProfile, updateUserProfile } = useAuth();
  const [name, setName] = useState(userProfile?.name || '');
  const [lineId, setLineId] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateUserProfile({
        name,
        lineId,
        phone,
        isProfileComplete: true,
      });
    } catch (err) {
      alert("儲存失敗");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in p-8 justify-center items-center bg-[#F6F5F2]">
      <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-xl border border-[#C9D6D0]/50">
        <h2 className="text-2xl font-bold text-center text-[#2F3437] mb-2">完善個人資料</h2>
        <p className="text-sm text-[#7A7A7A] text-center mb-6">為了提供更好的預約服務，請填寫以下資訊</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-[#7A7A7A] mb-1">Email</label>
            <input 
              type="email" 
              value={userProfile?.email || ''}
              disabled
              className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed" 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[#7A7A7A] mb-1">真實姓名 (必填)</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-[#F6F5F2] border border-[#C9D6D0] rounded-xl px-4 py-3 text-[#2F3437] focus:outline-none focus:border-[#7FA8A4]" 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[#7A7A7A] mb-1">LINE ID (必填)</label>
            <input 
              type="text" 
              required
              value={lineId}
              onChange={e => setLineId(e.target.value)}
              className="w-full bg-[#F6F5F2] border border-[#C9D6D0] rounded-xl px-4 py-3 text-[#2F3437] focus:outline-none focus:border-[#7FA8A4]" 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[#7A7A7A] mb-1">聯絡電話 (選填)</label>
            <input 
              type="tel" 
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full bg-[#F6F5F2] border border-[#C9D6D0] rounded-xl px-4 py-3 text-[#2F3437] focus:outline-none focus:border-[#7FA8A4]" 
            />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-[#7FA8A4] text-white py-4 rounded-xl font-bold shadow-md mt-4 disabled:opacity-50">
            {loading ? '儲存中...' : '完成設定'}
          </button>
        </form>
      </div>
    </div>
  );
}
