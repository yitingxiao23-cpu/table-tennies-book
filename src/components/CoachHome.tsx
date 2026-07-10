import React, { useState } from 'react';
import { Session, Booking, CoachProfile } from '../types';
import { doc, runTransaction, updateDoc, collection, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface CoachHomeProps {
  sessions: Session[];
  bookings: Booking[];
  profile: CoachProfile;
  allUsers?: Record<string, any>;
}

export default function CoachHome({ sessions, bookings, profile, allUsers = {} }: CoachHomeProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'profile'>('dashboard');
  
  // Session Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('桌球訓練');
  const [newDescription, setNewDescription] = useState('');
  const [newBankInfo, setNewBankInfo] = useState('');
  const [newLocation, setNewLocation] = useState('台北市體育館');
  
  // Format today's date as YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];
  const [newDate, setNewDate] = useState(today);
  const [newStart, setNewStart] = useState('10:00');
  const [newEnd, setNewEnd] = useState('11:30');
  const [newPrice, setNewPrice] = useState(1000);
  const [newSlots, setNewSlots] = useState(4);

  // Profile Form State
  const [editProfile, setEditProfile] = useState<CoachProfile>(profile);
  const [saveMessage, setSaveMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

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
            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
          } else {
            if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
          }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = (e) => reject(e);
      };
      reader.onerror = (e) => reject(e);
    });
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (deletingId === sessionId) {
      try {
        setActionError('');
        const sessionBookings = bookings.filter(b => b.sessionId === sessionId && b.status !== 'cancelled');
        if (sessionBookings.length > 0) {
          setActionError("無法刪除：該課程尚有預約。請先取消所有預約。");
          setDeletingId(null);
          return;
        }
        await deleteDoc(doc(db, 'schedules', sessionId));
        setDeletingId(null);
      } catch (err: any) {
        setActionError("刪除失敗: " + err.message);
      }
    } else {
      setDeletingId(sessionId);
      // Auto cancel after 3 seconds
      setTimeout(() => setDeletingId(null), 3000);
    }
  };

  const handleCompleteSession = async (sessionId: string) => {
    try {
      setActionError('');
      await updateDoc(doc(db, 'schedules', sessionId), {
        status: 'completed'
      });
    } catch (err: any) {
      setActionError("完成課程失敗: " + err.message);
    }
  };

  const handleOpenAdd = () => {
    setEditingSessionId(null);
    setNewTitle('桌球訓練');
    setNewDescription('');
    setNewBankInfo('');
    setNewLocation('台北市體育館');
    setNewDate(today);
    setNewStart('10:00');
    setNewEnd('11:30');
    setNewPrice(1000);
    setNewSlots(4);
    setShowAddForm(true);
  };

  const handleEditSession = (session: Session) => {
    setNewTitle(session.title);
    setNewDescription(session.description || '');
    setNewBankInfo(session.bankInfo || '');
    setNewLocation(session.location || '');
    setNewDate(session.date);
    setNewStart(session.startTime);
    setNewEnd(session.endTime);
    setNewPrice(session.price);
    setNewSlots(session.totalSlots);
    setEditingSessionId(session.id);
    setShowAddForm(true);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionError('');

      // Check for overlapping sessions
      const hasOverlap = sessions.some(session => {
        if (editingSessionId && session.id === editingSessionId) return false;
        if (session.date !== newDate) return false;
        // Check if newStart is before existing end AND newEnd is after existing start
        return (newStart < session.endTime && newEnd > session.startTime);
      });

      if (hasOverlap) {
        setActionError("課程時間與現有課程重疊，請確認時間。");
        return;
      }

      if (editingSessionId) {
        await updateDoc(doc(db, 'schedules', editingSessionId), {
          title: newTitle,
          description: newDescription,
          bankInfo: newBankInfo,
          location: newLocation,
          date: newDate,
          startTime: newStart,
          endTime: newEnd,
          price: newPrice,
          totalSlots: newSlots,
        });
      } else {
        const newSessionRef = doc(collection(db, 'schedules'));
        await setDoc(newSessionRef, {
          title: newTitle,
          description: newDescription,
          bankInfo: newBankInfo,
          location: newLocation,
          date: newDate,
          startTime: newStart,
          endTime: newEnd,
          price: newPrice,
          totalSlots: newSlots,
          bookedSlots: 0,
          createdAt: new Date().toISOString()
        });
      }
      setShowAddForm(false);
      setEditingSessionId(null);
    } catch (err: any) {
      setActionError((editingSessionId ? "更新" : "新增") + "失敗: " + err.message);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaveMessage('');
      await setDoc(doc(db, 'profiles', 'main_profile'), {
        ...editProfile
      });
      setSaveMessage('首頁設定已儲存！');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err: any) {
      setSaveMessage("儲存失敗: " + err.message);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file);
        setEditProfile({...editProfile, imageUrl: compressedBase64});
      } catch (err) {
        setSaveMessage('圖片處理失敗，請重試');
      }
    }
  };

  const handleExperiencePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if ((editProfile.photos?.length || 0) >= 4) {
        setSaveMessage('最多只能上傳 4 張經歷照片');
        return;
      }
      try {
        const compressedBase64 = await compressImage(file);
        const currentPhotos = editProfile.photos || [];
        setEditProfile({...editProfile, photos: [...currentPhotos, compressedBase64]});
      } catch (err) {
        setSaveMessage('圖片處理失敗，請重試');
      }
    }
  };

  const handleRemoveExperiencePhoto = (index: number) => {
    if (!editProfile.photos) return;
    const newPhotos = [...editProfile.photos];
    newPhotos.splice(index, 1);
    setEditProfile({...editProfile, photos: newPhotos});
  };

  const updateBookingStatus = async (booking: Booking, newStatus: 'confirmed' | 'cancelled') => {
    try {
      setActionError('');
      await runTransaction(db, async (transaction) => {
        const bookingRef = doc(db, 'bookings', booking.id);
        const sessionRef = doc(db, 'schedules', booking.sessionId);
        
        const bDoc = await transaction.get(bookingRef);
        const sDoc = await transaction.get(sessionRef);
        
        if (!bDoc.exists() || !sDoc.exists()) throw new Error("資料不存在");

        if (newStatus === 'cancelled' && bDoc.data().status !== 'cancelled') {
          const sData = sDoc.data() as Session;
          let newBookedSlots = Math.max(0, sData.bookedSlots - 1);
          
          if (bDoc.data().status !== 'waitlist') {
            // Check if there are waitlisted users
            const sessionBookings = bookings.filter(b => b.sessionId === booking.sessionId && b.id !== booking.id);
            const waitlisted = sessionBookings.filter(b => b.status === 'waitlist').sort((a, b) => a.createdAt.localeCompare(b.createdAt));
            
            if (waitlisted.length > 0) {
              // Move first waitlisted user to pending
              const firstWaitlist = waitlisted[0];
              const fwRef = doc(db, 'bookings', firstWaitlist.id);
              transaction.update(fwRef, { status: 'offered' });
              
              const studentName = firstWaitlist.studentName;
              alert(`已自動將候補學生 ${studentName} 轉為候補成功（待上傳匯款截圖），系統將自動發送 EMAIL 通知。`);
              
              // Keep bookedSlots the same because waitlist took the spot
              newBookedSlots = sData.bookedSlots; 
            }
            transaction.update(sessionRef, { bookedSlots: newBookedSlots });
          }
        }
        
        transaction.update(bookingRef, { status: newStatus });
      });
    } catch (err: any) {
      setActionError("更新狀態失敗: " + err.message);
    }
  };

  if (showAddForm) {
    return (
      <div className="flex flex-col h-full px-8 pt-10 pb-4 animate-in fade-in">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[#2F3437]">{editingSessionId ? '編輯課程時段' : '新增課程時段'}</h1>
          <button onClick={() => { setShowAddForm(false); setEditingSessionId(null); }} className="text-[#7A7A7A] p-2 hover:bg-gray-100 rounded-full">✕</button>
        </div>
        <form onSubmit={handleAdd} className="space-y-4 overflow-y-auto no-scrollbar pb-24">
           <div>
            <label className="block text-sm font-bold text-[#7A7A7A] mb-1">課程名稱</label>
            <input required type="text" value={newTitle || ''} onChange={e => setNewTitle(e.target.value)} className="w-full bg-white border border-[#C9D6D0] rounded-xl px-4 py-3 text-[#2F3437] focus:outline-none focus:border-[#7FA8A4]" />
          </div>
          <div>
            <label className="block text-sm font-bold text-[#7A7A7A] mb-1">課程簡介 (選填)</label>
            <textarea value={newDescription || ''} onChange={e => setNewDescription(e.target.value)} className="w-full bg-white border border-[#C9D6D0] rounded-xl px-4 py-3 text-[#2F3437] focus:outline-none focus:border-[#7FA8A4]" rows={2} />
          </div>
          <div>
            <label className="block text-sm font-bold text-[#7A7A7A] mb-1">匯款資訊 (銀行代碼與帳號)</label>
            <input type="text" value={newBankInfo || ''} onChange={e => setNewBankInfo(e.target.value)} className="w-full bg-white border border-[#C9D6D0] rounded-xl px-4 py-3 text-[#2F3437] focus:outline-none focus:border-[#7FA8A4]" placeholder="例如: 玉山銀行(808) 1234-5678" />
          </div>
          <div>
            <label className="block text-sm font-bold text-[#7A7A7A] mb-1">上課地點</label>
            <input required type="text" value={newLocation || ''} onChange={e => setNewLocation(e.target.value)} className="w-full bg-white border border-[#C9D6D0] rounded-xl px-4 py-3 text-[#2F3437] focus:outline-none focus:border-[#7FA8A4]" />
          </div>
          <div>
            <label className="block text-sm font-bold text-[#7A7A7A] mb-1">日期</label>
            <input required type="date" value={newDate || ''} onChange={e => setNewDate(e.target.value)} className="w-full bg-white border border-[#C9D6D0] rounded-xl px-4 py-3 text-[#2F3437] focus:outline-none focus:border-[#7FA8A4]" />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-bold text-[#7A7A7A] mb-1">開始時間</label>
              <input required type="time" value={newStart || ''} onChange={e => setNewStart(e.target.value)} className="w-full bg-white border border-[#C9D6D0] rounded-xl px-4 py-3 text-[#2F3437] focus:outline-none focus:border-[#7FA8A4]" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-bold text-[#7A7A7A] mb-1">結束時間</label>
              <input required type="time" value={newEnd || ''} onChange={e => setNewEnd(e.target.value)} className="w-full bg-white border border-[#C9D6D0] rounded-xl px-4 py-3 text-[#2F3437] focus:outline-none focus:border-[#7FA8A4]" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-[#7A7A7A] mb-1">費用</label>
            <input required type="number" value={newPrice ?? ''} onChange={e => setNewPrice(Number(e.target.value))} className="w-full bg-white border border-[#C9D6D0] rounded-xl px-4 py-3 text-[#2F3437] focus:outline-none focus:border-[#7FA8A4]" />
          </div>
          <div>
            <label className="block text-sm font-bold text-[#7A7A7A] mb-1">提供名額</label>
            <input required type="number" value={newSlots ?? ''} onChange={e => setNewSlots(Number(e.target.value))} className="w-full bg-white border border-[#C9D6D0] rounded-xl px-4 py-3 text-[#2F3437] focus:outline-none focus:border-[#7FA8A4]" />
          </div>
          <button type="submit" className="w-full bg-[#7FA8A4] text-white py-4 rounded-2xl font-bold shadow-md mt-4 active:scale-[0.98] transition-transform">
            {editingSessionId ? '更新時段' : '儲存時段'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <div className="bg-[#7FA8A4] px-8 pt-10 pb-6 rounded-b-[40px] shadow-sm relative">
        <h1 className="text-2xl font-bold text-white mb-1">教練管理後台</h1>
        <p className="text-[#E0EBE8] text-sm mb-6">隨時更新您的課程與首頁</p>
        
        <div className="flex bg-[#F6F5F2]/20 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-white text-[#7FA8A4] shadow-sm' : 'text-white hover:bg-white/10'}`}
          >
            近期課程
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === 'history' ? 'bg-white text-[#7FA8A4] shadow-sm' : 'text-white hover:bg-white/10'}`}
          >
            歷史課程
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === 'profile' ? 'bg-white text-[#7FA8A4] shadow-sm' : 'text-white hover:bg-white/10'}`}
          >
            首頁設定
          </button>
        </div>
      </div>
      
      <div className="flex-1 px-6 mt-6 space-y-4 overflow-y-auto no-scrollbar pb-32">
        {activeTab === 'dashboard' && (
          <>
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-bold text-[#2F3437]">近期課程</h2>
              <button onClick={handleOpenAdd} className="text-[#D9A46A] font-bold text-sm bg-[#D9A46A]/10 px-4 py-2 rounded-full hover:bg-[#D9A46A]/20 transition-colors">
                + 新增時段
              </button>
            </div>
            
            {actionError && <p className="text-red-500 text-xs font-bold mb-4 px-1">{actionError}</p>}
            
            {sessions.filter(s => s.status !== 'completed').map((session) => {
              const sessionBookings = bookings.filter(b => b.sessionId === session.id);
              const isDeleting = deletingId === session.id;
              return (
                <div key={session.id} className="bg-white rounded-3xl p-5 border border-[#C9D6D0] shadow-sm mb-4 relative overflow-hidden">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-[#2F3437]">{session.title}</h3>
                    <div className="flex gap-2 items-center">
                      <span className="text-[#7FA8A4] font-bold text-sm">${session.price}</span>
                      <button onClick={() => handleEditSession(session)} className="font-bold text-xs p-1.5 px-3 rounded transition-colors text-blue-400 hover:text-blue-600 bg-blue-50 hover:bg-blue-100" title="編輯課程">
                        編輯
                      </button>
                      <button onClick={() => handleDeleteSession(session.id)} className={`font-bold text-xs p-1.5 px-3 rounded transition-colors ${isDeleting ? 'bg-red-500 text-white shadow-sm' : 'text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100'}`} title="刪除課程">
                        {isDeleting ? '確認刪除' : '✕'}
                      </button>
                    </div>
                  </div>
                  <p className="text-[#7A7A7A] text-xs font-bold mb-1">{session.date} • {session.startTime} - {session.endTime}</p>
                  {session.location && <p className="text-[#7A7A7A] text-xs font-bold mb-1 flex items-center gap-1">📍 {session.location}</p>}
                  <div className="mt-3 flex gap-2">
                    <span className="bg-[#F6F5F2] text-[#7A7A7A] px-2 py-1 rounded-md text-[10px] font-bold">提供: {session.totalSlots}名</span>
                    <span className="bg-[#C9D6D0]/30 text-[#7FA8A4] px-2 py-1 rounded-md text-[10px] font-bold">已預約: {session.bookedSlots}名</span>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-[#F6F5F2]">
                    <button onClick={() => handleCompleteSession(session.id)} className="w-full bg-[#E0EBE8] text-[#7FA8A4] py-2 rounded-xl font-bold text-sm hover:bg-[#C9D6D0] transition-colors">
                      標記為已完成課程 ✓
                    </button>
                  </div>

                  {sessionBookings.length > 0 && (
                    <div className="mt-4 border-t border-[#F6F5F2] pt-3">
                      <p className="text-[11px] font-bold text-[#7A7A7A] mb-2">預約名單與付款狀態:</p>
                      <div className="space-y-2">
                        {sessionBookings.map((b, i) => {
                          const studentProfile = allUsers[b.studentId];
                          return (
                            <div key={i} className="text-xs text-[#2F3437] flex flex-col py-2 bg-[#F6F5F2] px-3 rounded-lg mb-1 border border-[#C9D6D0]/30">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-sm">{b.studentName}</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${b.status === 'confirmed' ? 'bg-green-100 text-green-600' : b.status === 'cancelled' ? 'bg-red-100 text-red-600' : b.status === 'waitlist' ? 'bg-orange-100 text-orange-600' : b.status === 'offered' ? 'bg-blue-100 text-blue-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                  {b.status === 'confirmed' ? '已確認' : b.status === 'cancelled' ? '已取消' : b.status === 'waitlist' ? `候補中 (第 ${sessionBookings.filter(bk => bk.status === 'waitlist').sort((x, y) => x.createdAt.localeCompare(y.createdAt)).findIndex(bk => bk.id === b.id) + 1} 順位)` : b.status === 'offered' ? '候補成功，待學生上傳匯款' : '待確認付款'}
                                </span>
                              </div>
                              <div className="text-[#7A7A7A] text-[10px] mb-2 font-bold space-y-0.5">
                                <div>LINE: {b.lineId}</div>
                                {studentProfile?.phone && <div>電話: {studentProfile.phone}</div>}
                                {studentProfile?.email && <div>Email: {studentProfile.email}</div>}
                              </div>
                              
                              {b.paymentScreenshotUrl && (
                                <button onClick={() => setViewingImage(b.paymentScreenshotUrl)} className="text-[#7FA8A4] text-xs underline mb-2 block font-bold text-left">
                                  查看匯款截圖
                                </button>
                              )}
                              
                              {b.paymentLast5 && (
                                <div className="text-[#7FA8A4] text-[11px] mb-2 font-bold bg-[#E0EBE8] px-2 py-1 rounded w-fit">
                                  帳戶後五碼: {b.paymentLast5}
                                </div>
                              )}
                              
                              {b.status === 'pending' && (
                                <div className="flex gap-2 mt-1">
                                  <button onClick={() => updateBookingStatus(b, 'confirmed')} className="flex-1 bg-[#7FA8A4] text-white py-1.5 rounded-md font-bold">確認付款</button>
                                  <button onClick={() => updateBookingStatus(b, 'cancelled')} className="flex-1 bg-red-500/10 text-red-500 py-1.5 rounded-md font-bold hover:bg-red-500/20">取消預約</button>
                                </div>
                              )}
                              {b.status === 'confirmed' && (
                                 <button onClick={() => updateBookingStatus(b, 'cancelled')} className="mt-1 w-full bg-red-500/10 text-red-500 py-1.5 rounded-md font-bold hover:bg-red-500/20">取消預約</button>
                              )}
                              {b.status === 'waitlist' && (
                                <div className="flex gap-2 mt-1">
                                  <button onClick={() => updateBookingStatus(b, 'cancelled')} className="flex-1 bg-red-500/10 text-red-500 py-1.5 rounded-md font-bold hover:bg-red-500/20">取消候補</button>
                                </div>
                              )}
                              {b.status === 'offered' && (
                                <div className="flex gap-2 mt-1">
                                  <button onClick={() => updateBookingStatus(b, 'cancelled')} className="flex-1 bg-red-500/10 text-red-500 py-1.5 rounded-md font-bold hover:bg-red-500/20">取消資格</button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            
            {sessions.filter(s => s.status !== 'completed').length === 0 && (
              <div className="text-center text-[#7A7A7A] mt-10 text-sm font-bold">
                目前尚無近期課程，點擊上方新增時段。
              </div>
            )}
          </>
        )}

        {activeTab === 'history' && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-[#2F3437]">歷史課程</h2>
            </div>
            
            {sessions.filter(s => s.status === 'completed').length === 0 ? (
              <div className="text-center text-[#7A7A7A] mt-10 font-bold text-sm">
                目前尚無歷史課程紀錄。
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.filter(s => s.status === 'completed').map((session) => {
                  const sessionBookings = bookings.filter(b => b.sessionId === session.id);
                  const isDeleting = deletingId === session.id;
                  return (
                    <div key={session.id} className="bg-white rounded-3xl p-5 border border-[#C9D6D0] shadow-sm opacity-80">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-[#2F3437] line-through decoration-[#7A7A7A]">{session.title}</h3>
                        <div className="flex gap-2 items-center">
                          <span className="bg-[#E0EBE8] text-[#7FA8A4] px-2 py-1 rounded text-xs font-bold">已完成</span>
                          <button onClick={() => handleDeleteSession(session.id)} className={`font-bold text-xs p-1.5 px-3 rounded transition-colors ${isDeleting ? 'bg-red-500 text-white shadow-sm' : 'text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100'}`} title="刪除課程">
                            {isDeleting ? '確認刪除' : '✕'}
                          </button>
                        </div>
                      </div>
                      <p className="text-[#7A7A7A] text-xs font-bold mb-1">{session.date} • {session.startTime} - {session.endTime}</p>
                      {session.location && <p className="text-[#7A7A7A] text-xs font-bold mb-1 flex items-center gap-1">📍 {session.location}</p>}
                      
                      <div className="mt-3 text-xs font-bold text-[#7A7A7A]">
                        總預約人數: {session.bookedSlots} / {session.totalSlots}
                      </div>

                      {sessionBookings.length > 0 && (
                        <div className="mt-4 border-t border-[#F6F5F2] pt-3">
                          <p className="text-[11px] font-bold text-[#7A7A7A] mb-2">參與學生與聯絡資訊:</p>
                          <div className="space-y-1">
                            {sessionBookings.filter(b => b.status === 'confirmed').map((b, i) => {
                              const studentProfile = allUsers[b.studentId];
                              return (
                                <div key={i} className="bg-[#F6F5F2] p-2 rounded-lg text-[10px] text-[#2F3437] font-bold">
                                  <div className="flex justify-between mb-0.5">
                                    <span className="font-extrabold text-xs text-[#2F3437]">{b.studentName}</span>
                                    <span className="text-[#7A7A7A]">LINE: {b.lineId}</span>
                                  </div>
                                  <div className="text-[#7A7A7A] flex gap-3 flex-wrap">
                                    {studentProfile?.phone && <span>📞 {studentProfile.phone}</span>}
                                    {studentProfile?.email && <span>✉️ {studentProfile.email}</span>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-4 animate-in fade-in">
             <div className="bg-white p-5 rounded-3xl border border-[#C9D6D0] shadow-sm space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#7A7A7A] mb-1">教練名稱</label>
                <input 
                  type="text" 
                  value={editProfile.name || ''} 
                  onChange={e => setEditProfile({...editProfile, name: e.target.value})} 
                  className="w-full bg-[#F6F5F2] border border-[#C9D6D0] rounded-xl px-4 py-3 text-[#2F3437] focus:outline-none focus:border-[#7FA8A4]" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#7A7A7A] mb-1">首頁標語 (Slogan)</label>
                <input 
                  type="text" 
                  value={editProfile.slogan || ''} 
                  onChange={e => setEditProfile({...editProfile, slogan: e.target.value})} 
                  className="w-full bg-[#F6F5F2] border border-[#C9D6D0] rounded-xl px-4 py-3 text-[#2F3437] focus:outline-none focus:border-[#7FA8A4]" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#7A7A7A] mb-1">教學理念</label>
                <textarea 
                  value={editProfile.philosophy || ''} 
                  onChange={e => setEditProfile({...editProfile, philosophy: e.target.value})} 
                  className="w-full bg-[#F6F5F2] border border-[#C9D6D0] rounded-xl px-4 py-3 text-[#2F3437] focus:outline-none focus:border-[#7FA8A4]" 
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#7A7A7A] mb-1">教練經歷</label>
                <textarea 
                  value={editProfile.experience || ''} 
                  onChange={e => setEditProfile({...editProfile, experience: e.target.value})} 
                  className="w-full bg-[#F6F5F2] border border-[#C9D6D0] rounded-xl px-4 py-3 text-[#2F3437] focus:outline-none focus:border-[#7FA8A4] mb-3" 
                  rows={4}
                />
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold text-[#7A7A7A]">經歷照片 (最多 4 張)</label>
                    <span className="text-xs text-[#7A7A7A]">{editProfile.photos?.length || 0} / 4</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    {editProfile.photos?.map((photo, index) => (
                      <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-[#C9D6D0] group">
                        <img src={photo} alt={`Experience ${index + 1}`} className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => handleRemoveExperiencePhoto(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-80 hover:opacity-100"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {(!editProfile.photos || editProfile.photos.length < 4) && (
                      <label className="aspect-square rounded-xl border-2 border-dashed border-[#C9D6D0] flex flex-col items-center justify-center text-[#7A7A7A] hover:bg-[#F6F5F2] cursor-pointer transition-colors">
                        <span className="text-2xl mb-1">+</span>
                        <span className="text-[10px] font-bold">上傳照片</span>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleExperiencePhotoUpload} 
                          className="hidden" 
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-[#7A7A7A] mb-1">教練照片 (圖片網址或上傳)</label>
                <div className="flex flex-col gap-3">
                  <input 
                    type="text" 
                    value={editProfile.imageUrl || ''} 
                    onChange={e => setEditProfile({...editProfile, imageUrl: e.target.value})} 
                    className="w-full bg-[#F6F5F2] border border-[#C9D6D0] rounded-xl px-4 py-3 text-[#2F3437] focus:outline-none focus:border-[#7FA8A4] text-sm" 
                    placeholder="輸入網址..."
                  />
                  <div className="flex items-center gap-4">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleImageUpload} 
                      className="w-full bg-[#F6F5F2] border border-[#C9D6D0] rounded-xl px-4 py-3 text-[#2F3437] focus:outline-none focus:border-[#7FA8A4] text-sm" 
                    />
                    {editProfile.imageUrl && (
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#C9D6D0] shadow-sm shrink-0">
                        <img src={editProfile.imageUrl} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {saveMessage && (
                <p className={`text-center font-bold text-sm ${saveMessage.includes('失敗') ? 'text-red-500' : 'text-green-600'}`}>
                  {saveMessage}
                </p>
              )}

              <button type="submit" className="w-full bg-[#7FA8A4] text-white py-4 rounded-2xl font-bold shadow-md mt-4 active:scale-[0.98] transition-transform">
                儲存首頁設定
              </button>
            </div>
          </form>
        )}
      </div>

      {viewingImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setViewingImage(null)}>
          <div className="relative max-w-2xl w-full flex flex-col items-center gap-4" onClick={e => e.stopPropagation()}>
            <button onClick={() => setViewingImage(null)} className="absolute -top-12 right-0 text-white font-bold text-lg px-4 py-2 hover:bg-white/10 rounded-full transition-colors">
              關閉 ✕
            </button>
            <img src={viewingImage} alt="Payment Screenshot" className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl" />
          </div>
        </div>
      )}

    </div>
  );
}
