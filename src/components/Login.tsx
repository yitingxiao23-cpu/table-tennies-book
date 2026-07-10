import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserCircle2, User } from 'lucide-react';

export default function Login() {
  const { signInWithGoogle } = useAuth();
  const [roleMode, setRoleMode] = useState<'select' | 'student' | 'coach'>('select');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleStudentLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      setError('');
      await signInWithGoogle(false);
    } catch (err: any) {
      if (err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user' || err.code === 'auth/user-cancelled') {
        // Ignore popup closed errors
        setIsLoggingIn(false);
        return;
      }
      if (err.message && err.message.includes('Pending promise was never set')) {
        setError('登入彈出視窗被阻擋或發生錯誤，請點擊右上角「在新分頁開啟」後再試一次');
        setIsLoggingIn(false);
        return;
      }
      setError('登入失敗，請稍後再試 (' + (err.code || err.message) + ')');
      setIsLoggingIn(false);
    }
  };

  const handleCoachLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn) return;
    
    // Use a simple hardcoded passcode for the coach
    if (passcode === 'peiting0710') {
      setIsLoggingIn(true);
      try {
        setError('');
        await signInWithGoogle(true);
      } catch (err: any) {
        if (err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user' || err.code === 'auth/user-cancelled') {
          // Ignore popup closed errors
          setIsLoggingIn(false);
          return;
        }
        if (err.message && err.message.includes('Pending promise was never set')) {
          setError('登入彈出視窗被阻擋或發生錯誤，請點擊右上角「在新分頁開啟」後再試一次');
          setIsLoggingIn(false);
          return;
        }
        setError('登入失敗，請稍後再試 (' + (err.code || err.message) + ')');
        setIsLoggingIn(false);
      }
    } else {
      setError('密碼錯誤');
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in p-8 justify-center items-center bg-[#F6F5F2]">
      <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-xl border border-[#C9D6D0]/50 text-center">
        
        {roleMode === 'select' && (
          <div className="animate-in slide-in-from-bottom-4 fade-in">
            <div className="w-20 h-20 bg-[#7FA8A4]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🏓</span>
            </div>
            <h2 className="text-2xl font-bold text-[#2F3437] mb-2">
              桌球預約系統
            </h2>
            <p className="text-sm text-[#7A7A7A] mb-8">請選擇您的身分登入</p>

            <div className="space-y-4">
              <button 
                onClick={() => { setRoleMode('student'); setError(''); }}
                className="w-full bg-white border-2 border-[#E0EBE8] text-[#2F3437] py-4 rounded-2xl font-bold hover:bg-[#F6F5F2] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
              >
                <User size={20} className="text-[#7FA8A4]" />
                我是學生
              </button>
              
              <button 
                onClick={() => { setRoleMode('coach'); setError(''); }}
                className="w-full bg-white border-2 border-[#E0EBE8] text-[#2F3437] py-4 rounded-2xl font-bold hover:bg-[#F6F5F2] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
              >
                <UserCircle2 size={20} className="text-[#D9A46A]" />
                我是教練
              </button>
            </div>
          </div>
        )}

        {roleMode === 'student' && (
          <div className="animate-in slide-in-from-right-4 fade-in">
             <button onClick={() => { setRoleMode('select'); setError(''); }} className="text-[#7A7A7A] text-sm mb-6 flex items-center gap-1 hover:text-[#2F3437] transition-colors">
                &larr; 返回
             </button>
             <h2 className="text-2xl font-bold text-[#2F3437] mb-2">學生登入</h2>
             <p className="text-sm text-[#7A7A7A] mb-8">使用 Google 帳號快速登入</p>
             
             {error && <p className="text-red-500 text-xs font-bold mb-4 px-1 text-center">{error}</p>}

             <button 
              onClick={handleStudentLogin}
              disabled={isLoggingIn}
              className={`w-full bg-white border-2 border-[#E0EBE8] text-[#2F3437] py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 shadow-sm ${isLoggingIn ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 active:scale-[0.98]'}`}
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
              {isLoggingIn ? '登入中...' : '使用 Google 登入'}
            </button>
          </div>
        )}

        {roleMode === 'coach' && (
          <div className="animate-in slide-in-from-right-4 fade-in text-left">
             <button onClick={() => { setRoleMode('select'); setError(''); }} className="text-[#7A7A7A] text-sm mb-6 flex items-center gap-1 hover:text-[#2F3437] transition-colors">
                &larr; 返回
             </button>
             <h2 className="text-2xl font-bold text-[#2F3437] mb-2 text-center">教練登入</h2>
             <p className="text-sm text-[#7A7A7A] mb-8 text-center">請輸入專屬密碼以驗證身分</p>
             
             <form onSubmit={handleCoachLogin} className="space-y-4">
                <div>
                  <input 
                    type="password" 
                    value={passcode}
                    onChange={e => setPasscode(e.target.value)}
                    placeholder="請輸入密碼"
                    className="w-full bg-[#F6F5F2] border border-[#C9D6D0] rounded-xl px-4 py-3 text-[#2F3437] focus:outline-none focus:border-[#D9A46A]" 
                    required
                  />
                  {error && <p className="text-red-500 text-xs font-bold mt-2 px-1">{error}</p>}
                </div>
                <button 
                  type="submit"
                  disabled={isLoggingIn}
                  className={`w-full bg-[#D9A46A] text-white py-4 rounded-xl font-bold shadow-md transition-all ${isLoggingIn ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#C8955A] active:scale-[0.98]'}`}
                >
                  {isLoggingIn ? '登入中...' : '驗證並使用 Google 登入'}
                </button>
             </form>
          </div>
        )}
      </div>
    </div>
  );
}
