import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile } from '../types';

export default function StudentProfileView() {
  const { userProfile, updateUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(userProfile?.name || '');
  const [lineId, setLineId] = useState(userProfile?.lineId || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!userProfile) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await updateUserProfile({
        name,
        lineId,
        phone,
      });
      setIsEditing(false);
    } catch (err) {
      setError("儲存失敗，請重試");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in p-8 pt-10 pb-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#2F3437]">個人資料</h1>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="text-sm font-bold text-[#7FA8A4] hover:text-[#5E837F] bg-[#E0EBE8] px-3 py-1 rounded-lg"
          >
            編輯資料
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl shadow-sm border border-[#C9D6D0]/50 space-y-4">
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
          
          {error && <p className="text-red-500 text-xs font-bold">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button 
              type="button" 
              onClick={() => {
                setIsEditing(false);
                setName(userProfile.name || '');
                setLineId(userProfile.lineId || '');
                setPhone(userProfile.phone || '');
              }}
              className="flex-1 bg-gray-100 text-gray-500 py-3 rounded-xl font-bold hover:bg-gray-200"
            >
              取消
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="flex-1 bg-[#7FA8A4] text-white py-3 rounded-xl font-bold shadow-sm hover:bg-[#6A9490]"
            >
              {loading ? '儲存中...' : '儲存變更'}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#C9D6D0]/50 space-y-4">
          <div>
            <label className="block text-sm font-bold text-[#7A7A7A]">姓名</label>
            <p className="text-[#2F3437] font-bold">{userProfile.name}</p>
          </div>
          <div>
            <label className="block text-sm font-bold text-[#7A7A7A]">LINE ID</label>
            <p className="text-[#2F3437] font-bold">{userProfile.lineId}</p>
          </div>
          <div>
            <label className="block text-sm font-bold text-[#7A7A7A]">Email</label>
            <p className="text-[#2F3437] font-bold">{userProfile.email}</p>
          </div>
          <div>
            <label className="block text-sm font-bold text-[#7A7A7A]">聯絡電話</label>
            <p className="text-[#2F3437] font-bold">{userProfile.phone || '未提供'}</p>
          </div>
        </div>
      )}
    </div>
  );
}
