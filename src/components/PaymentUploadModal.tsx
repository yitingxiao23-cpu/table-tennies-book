import React, { useState } from 'react';
import { Session, Booking } from '../types';
import { X } from 'lucide-react';

interface PaymentUploadModalProps {
  session: Session;
  booking: Booking;
  onClose: () => void;
  onSubmit: (bookingId: string, paymentData: { paymentScreenshotUrl?: string; paymentLast5?: string }) => void;
}

export default function PaymentUploadModal({ session, booking, onClose, onSubmit }: PaymentUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'screenshot' | 'last5'>('screenshot');
  const [paymentLast5, setPaymentLast5] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

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

    if (paymentMethod === 'screenshot') {
      if (!file) {
        setError("請先上傳匯款截圖");
        return;
      }

      setUploading(true);
      try {
        const base64Url = await compressImage(file);
        await onSubmit(booking.id, { paymentScreenshotUrl: base64Url });
        setUploading(false);
      } catch (error) {
        console.error(error);
        setError("圖片處理失敗，請重試");
        setUploading(false);
      }
    } else {
      if (!paymentLast5 || paymentLast5.length !== 5) {
        setError("請輸入完整的帳戶後五碼");
        return;
      }
      
      setUploading(true);
      try {
        await onSubmit(booking.id, { paymentLast5 });
        setUploading(false);
      } catch (error) {
        console.error(error);
        setError("處理失敗，請重試");
        setUploading(false);
      }
    }
  };

  return (
    <div className="absolute inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center animate-in fade-in">
      <div className="bg-[#F6F5F2] w-full max-w-[420px] rounded-t-[32px] sm:rounded-[32px] p-6 sm:p-8 animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-4 shadow-2xl pb-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#2F3437]">確認候補預約</h2>
          <button onClick={onClose} className="bg-black/5 p-2 rounded-full hover:bg-black/10 transition-colors">
            <X size={20} className="text-[#2F3437]" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-[#7A7A7A] text-sm">恭喜候補成功！請上傳匯款截圖以完成預約「{session.title}」。</p>
          {session.bankInfo && (
            <div className="mt-3 bg-white p-3 rounded-lg border border-[#C9D6D0]/50">
              <p className="text-[#7A7A7A] text-xs font-bold mb-1">請匯款至以下帳戶：</p>
              <p className="text-[#2F3437] text-sm font-bold">{session.bankInfo}</p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
          
          {error && <p className="text-red-500 text-xs font-bold text-center mt-2">{error}</p>}

          <button 
            type="submit" 
            disabled={uploading}
            className="w-full bg-[#7FA8A4] text-white py-4 rounded-2xl font-bold shadow-md mt-6 active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {uploading ? '處理中...' : '確認上傳並預約'}
          </button>
        </form>
      </div>
    </div>
  );
}
