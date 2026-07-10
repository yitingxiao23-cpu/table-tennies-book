import React, { useState } from 'react';
import { Session } from '../types';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

interface BookingModalProps {
  session: Session;
  onClose: () => void;
  onSubmit: (data: { studentName: string; lineId: string; email: string; paymentScreenshotUrl?: string; paymentLast5?: string; isWaitlist: boolean }) => Promise<void>;
}

export default function BookingModal({ session, onClose, onSubmit }: BookingModalProps) {
  const { user, userProfile } = useAuth();
  
  const studentName = userProfile?.name || user?.displayName || '';
  const lineId = userProfile?.lineId || '';
  const email = userProfile?.email || user?.email || '';
  
  const isWaitlist = session.bookedSlots >= session.totalSlots;
  
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const [error, setError] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<'screenshot' | 'last5'>('screenshot');
  const [paymentLast5, setPaymentLast5] = useState('');

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = (e) => reject(e);
      };
      reader.onerror = (e) => reject(e);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (isWaitlist) {
      setUploading(true);
      try {
        await onSubmit({ studentName, lineId, email, isWaitlist: true });
        setUploading(false);
      } catch (error) {
        console.error(error);
        setError("預約失敗，請重試");
        setUploading(false);
      }
      return;
    }

    if (paymentMethod === 'screenshot') {
      if (!file) {
        setError("請先上傳匯款截圖");
        return;
      }
      
      setUploading(true);
      try {
        const base64Url = await compressImage(file);
        await onSubmit({ studentName, lineId, email, paymentScreenshotUrl: base64Url, isWaitlist: false });
        setUploading(false);
      } catch (error) {
        console.error(error);
        setError("上傳或預約失敗，請重試");
        setUploading(false);
      }
    } else {
      if (!paymentLast5 || paymentLast5.length !== 5) {
        setError("請輸入完整的帳戶後五碼");
        return;
      }

      setUploading(true);
      try {
        await onSubmit({ studentName, lineId, email, paymentLast5, isWaitlist: false });
        setUploading(false);
      } catch (error) {
        console.error(error);
        setError("預約失敗，請重試");
        setUploading(false);
      }
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full rounded-t-[40px] p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-300 max-h-[90%] overflow-y-auto no-scrollbar">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-[#2F3437]">確認預約資料</h2>
          <button onClick={onClose} disabled={uploading} className="text-[#7A7A7A] p-2 hover:bg-gray-100 rounded-full disabled:opacity-50">✕</button>
        </div>

        <div className="bg-[#F6F5F2] p-4 rounded-2xl mb-6 border border-[#C9D6D0]/50">
          <h3 className="font-bold text-[#2F3437]">{session.title}</h3>
          <p className="text-[#7A7A7A] text-sm mt-1">{session.date} | {session.startTime} - {session.endTime}</p>
          <p className="text-[#D9A46A] font-bold mt-2">費用: ${session.price.toLocaleString()}</p>
          {session.description && (
            <p className="text-[#2F3437] text-sm mt-3 pt-3 border-t border-[#C9D6D0]/30">{session.description}</p>
          )}
          {session.bankInfo && !isWaitlist && (
            <div className="mt-3 bg-white p-3 rounded-lg border border-[#C9D6D0]/50">
              <p className="text-[#7A7A7A] text-xs font-bold mb-1">請匯款至以下帳戶：</p>
              <p className="text-[#2F3437] text-sm font-bold">{session.bankInfo}</p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-[#7A7A7A] mb-1">姓名</label>
            <input 
              required
              type="text" 
              value={studentName}
              readOnly
              className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed" 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[#7A7A7A] mb-1">LINE ID</label>
            <input 
              required
              type="text" 
              value={lineId}
              readOnly
              className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed" 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[#7A7A7A] mb-1">Email</label>
            <input 
              required
              type="email" 
              value={email}
              readOnly
              className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed" 
            />
          </div>
          
          {!isWaitlist && (
            <div className="pt-2">
              <label className="block text-sm font-bold text-[#7A7A7A] mb-3">匯款確認方式</label>
              
              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="paymentMethod" 
                    value="screenshot"
                    checked={paymentMethod === 'screenshot'}
                    onChange={() => setPaymentMethod('screenshot')}
                    className="accent-[#7FA8A4]"
                  />
                  <span className="text-sm font-bold text-[#2F3437]">上傳匯款截圖</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="paymentMethod" 
                    value="last5"
                    checked={paymentMethod === 'last5'}
                    onChange={() => setPaymentMethod('last5')}
                    className="accent-[#7FA8A4]"
                  />
                  <span className="text-sm font-bold text-[#2F3437]">提供帳戶後五碼</span>
                </label>
              </div>

              {paymentMethod === 'screenshot' ? (
                <div>
                  <input 
                    type="file" 
                    accept="image/*"
                    required
                    disabled={uploading}
                    onChange={e => setFile(e.target.files?.[0] || null)}
                    className="w-full bg-white border border-[#C9D6D0] rounded-xl px-4 py-3 text-[#2F3437] focus:outline-none focus:border-[#7FA8A4] text-sm" 
                  />
                  {file && (
                    <p className="text-xs text-[#7A7A7A] mt-2">已選擇: {file.name}</p>
                  )}
                  {uploading && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-3">
                      <div className="bg-[#7FA8A4] h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <input 
                    type="text" 
                    maxLength={5}
                    placeholder="請輸入帳戶後五碼"
                    value={paymentLast5}
                    onChange={e => setPaymentLast5(e.target.value.replace(/\D/g, ''))}
                    required
                    disabled={uploading}
                    className="w-full bg-white border border-[#C9D6D0] rounded-xl px-4 py-3 text-[#2F3437] focus:outline-none focus:border-[#7FA8A4] text-sm" 
                  />
                </div>
              )}
            </div>
          )}
          
          {error && <p className="text-red-500 text-xs font-bold text-center mt-2">{error}</p>}

          <button 
            type="submit"
            disabled={uploading}
            className="w-full bg-[#7FA8A4] text-white py-4 rounded-2xl font-bold shadow-md mt-6 active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {uploading ? '處理中...' : isWaitlist ? '確認加入備取' : '確認送出預約'}
          </button>
        </form>
      </div>
    </div>
  );
}
