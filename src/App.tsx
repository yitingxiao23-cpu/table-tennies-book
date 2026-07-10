/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import StudentHome from './components/StudentHome';
import CoachHome from './components/CoachHome';
import BookingModal from './components/BookingModal';
import PaymentUploadModal from './components/PaymentUploadModal';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import ProfileCompletion from './components/ProfileCompletion';
import { Session, Booking, CoachProfile } from './types';
import StudentProfileView from './components/StudentProfileView';
import { UserCircle2, ArrowLeftRight, Home, LogOut } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { collection, onSnapshot, query, where, orderBy, doc, getDoc, runTransaction } from 'firebase/firestore';
import { db } from './firebase';

export default function App() {
  const { user, userProfile, loading, signOut } = useAuth();
  
  const [studentView, setStudentView] = useState<'landing' | 'booking' | 'my-bookings' | 'profile'>('landing');
  const [bookingTab, setBookingTab] = useState<'upcoming' | 'history'>('upcoming');
  
  const [sessions, setSessions] = useState<Session[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [allUsers, setAllUsers] = useState<Record<string, any>>({});
  const [profile, setProfile] = useState<CoachProfile>({
    name: '載入中...',
    slogan: '',
    philosophy: '',
    experience: ''
  });
  
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [selectedOfferedBooking, setSelectedOfferedBooking] = useState<Booking | null>(null);

  // Reset student view when user logs out
  useEffect(() => {
    if (!user) {
      setStudentView('landing');
      setBookingTab('upcoming');
    }
  }, [user]);

  // Load Data
  useEffect(() => {
    if (!user) return;

    // Load Profile
    const fetchProfile = async () => {
      // Assuming a single coach profile for MVP, using a fixed doc ID 'main_profile'
      const pDoc = await getDoc(doc(db, 'profiles', 'main_profile'));
      if (pDoc.exists()) {
        setProfile(pDoc.data() as CoachProfile);
      }
    };
    fetchProfile();

    // Listen to Sessions
    const qSessions = query(collection(db, 'schedules'));
    const unsubSessions = onSnapshot(qSessions, (snap) => {
      const fetchedSessions = snap.docs.map(d => ({ id: d.id, ...d.data() } as Session));
      // Sort sessions by date and time
      fetchedSessions.sort((a, b) => {
        const dateA = a.date || '';
        const dateB = b.date || '';
        if (dateA !== dateB) return dateA.localeCompare(dateB);
        const timeA = a.startTime || '';
        const timeB = b.startTime || '';
        return timeA.localeCompare(timeB);
      });
      setSessions(fetchedSessions);
    });

    // Listen to Bookings
    let qBookings;
    let unsubUsers = () => {};
    if (userProfile?.role === 'coach') {
      qBookings = query(collection(db, 'bookings'));
      const qUsers = query(collection(db, 'users'));
      unsubUsers = onSnapshot(qUsers, (snap) => {
        const usersMap: Record<string, any> = {};
        snap.docs.forEach(d => {
          usersMap[d.id] = d.data();
        });
        setAllUsers(usersMap);
      });
    } else if (userProfile?.role === 'student') {
      qBookings = query(collection(db, 'bookings'), where('studentId', '==', user.uid));
    }

    let unsubBookings = () => {};
    if (qBookings) {
      unsubBookings = onSnapshot(qBookings, (snap) => {
        const fetchedBookings = snap.docs.map(d => ({ id: d.id, ...d.data() } as Booking));
        // Sort bookings by createdAt descending
        fetchedBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setBookings(fetchedBookings);
      });
    }

    return () => {
      unsubSessions();
      unsubBookings();
      unsubUsers();
    };
  }, [user, userProfile?.role]);

  const handleBookSubmit = async (data: { studentName: string; lineId: string; email: string; paymentScreenshotUrl?: string; paymentLast5?: string; isWaitlist: boolean }) => {
    if (!selectedSession || !user) return;

    // Check if the student has already booked this session
    const hasExistingBooking = bookings.some(
      b => b.sessionId === selectedSession.id && b.status !== 'cancelled'
    );

    if (hasExistingBooking) {
      alert("您已經預約過此課程，請勿重複預約！");
      setSelectedSession(null);
      return;
    }
    
    try {
      const sessionRef = doc(db, 'schedules', selectedSession.id);
      const newBookingRef = doc(collection(db, 'bookings'));

      await runTransaction(db, async (transaction) => {
        const sfDoc = await transaction.get(sessionRef);
        if (!sfDoc.exists()) {
          throw "課程不存在!";
        }

        const sessionData = sfDoc.data() as Session;
        
        if (data.isWaitlist) {
          transaction.set(newBookingRef, {
            sessionId: selectedSession.id,
            studentId: user.uid,
            studentName: data.studentName,
            email: data.email,
            lineId: data.lineId,
            status: 'waitlist',
            createdAt: new Date().toISOString()
          });
        } else {
          const newBookedSlots = sessionData.bookedSlots + 1;
          if (newBookedSlots > sessionData.totalSlots) {
            throw "名額已滿，請關閉後重新選擇候補預約!";
          }
          transaction.update(sessionRef, { bookedSlots: newBookedSlots });
          const newBookingData: any = {
            sessionId: selectedSession.id,
            studentId: user.uid,
            studentName: data.studentName,
            email: data.email,
            lineId: data.lineId,
            status: 'pending',
            createdAt: new Date().toISOString()
          };
          if (data.paymentScreenshotUrl) newBookingData.paymentScreenshotUrl = data.paymentScreenshotUrl;
          if (data.paymentLast5) newBookingData.paymentLast5 = data.paymentLast5;

          transaction.set(newBookingRef, newBookingData);
        }
      });

      setSelectedSession(null);
      setStudentView('my-bookings');
    } catch (e) {
      alert("預約失敗: " + e);
    }
  };

  const handleOfferedPaymentSubmit = async (bookingId: string, paymentData: { paymentScreenshotUrl?: string; paymentLast5?: string }) => {
    if (!selectedOfferedBooking) return;
    
    try {
      const sessionRef = doc(db, 'schedules', selectedOfferedBooking.sessionId);
      const bookingRef = doc(db, 'bookings', bookingId);

      await runTransaction(db, async (transaction) => {
        const sDoc = await transaction.get(sessionRef);
        if (!sDoc.exists()) throw "課程不存在!";
        
        const bDoc = await transaction.get(bookingRef);
        if (!bDoc.exists() || bDoc.data().status !== 'offered') throw "無效的操作!";

        const updateData: any = { status: 'pending' };
        if (paymentData.paymentScreenshotUrl) updateData.paymentScreenshotUrl = paymentData.paymentScreenshotUrl;
        if (paymentData.paymentLast5) updateData.paymentLast5 = paymentData.paymentLast5;
        
        transaction.update(bookingRef, updateData);
      });

      setSelectedOfferedBooking(null);
      alert("成功確認預約，請等待教練確認付款！");
    } catch (e) {
      alert("處理失敗: " + e);
    }
  };

  const handleCancelBooking = async (booking: Booking) => {
    if (!window.confirm("確定要取消此預約嗎？")) return;
    try {
      await runTransaction(db, async (transaction) => {
        const bookingRef = doc(db, 'bookings', booking.id);
        const sessionRef = doc(db, 'schedules', booking.sessionId);
        
        const bDoc = await transaction.get(bookingRef);
        const sDoc = await transaction.get(sessionRef);
        
        if (!bDoc.exists() || !sDoc.exists()) throw new Error("資料不存在");

        if (bDoc.data().status !== 'cancelled') {
          const sData = sDoc.data() as Session;
          let newBookedSlots = Math.max(0, sData.bookedSlots - 1);
          
          if (bDoc.data().status !== 'waitlist') {
            const sessionBookings = bookings.filter(b => b.sessionId === booking.sessionId && b.id !== booking.id);
            const waitlisted = sessionBookings.filter(b => b.status === 'waitlist').sort((a, b) => a.createdAt.localeCompare(b.createdAt));
            
            if (waitlisted.length > 0) {
              const firstWaitlist = waitlisted[0];
              const fwRef = doc(db, 'bookings', firstWaitlist.id);
              transaction.update(fwRef, { status: 'offered' });
              newBookedSlots = sData.bookedSlots; 
            }
            transaction.update(sessionRef, { bookedSlots: newBookedSlots });
          }
          
          transaction.update(bookingRef, { status: 'cancelled' });
        }
      });
      alert("已成功取消預約");
    } catch (e) {
      alert("取消失敗: " + e);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#F6F5F2] flex justify-center items-center">載入中...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F6F5F2] text-[#2F3437] font-sans flex justify-center items-center p-4">
        <div className="w-full max-w-[420px] bg-white h-[800px] max-h-full rounded-[40px] flex flex-col shadow-2xl relative overflow-hidden border-8 border-white">
          <Login />
        </div>
      </div>
    );
  }

  if (userProfile && !userProfile.isProfileComplete) {
    return (
      <div className="min-h-screen bg-[#F6F5F2] text-[#2F3437] font-sans flex justify-center items-center p-4">
        <div className="w-full max-w-[420px] bg-white h-[800px] max-h-full rounded-[40px] flex flex-col shadow-2xl relative overflow-hidden border-8 border-white">
          <ProfileCompletion />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F5F2] text-[#2F3437] font-sans flex justify-center items-center p-4">
      <div className="w-full max-w-[420px] bg-white h-[800px] max-h-full rounded-[40px] flex flex-col shadow-2xl relative overflow-hidden border-8 border-white">
        
        <div className="flex-1 overflow-y-auto no-scrollbar relative">
          
          {userProfile?.role === 'student' ? (
            studentView === 'landing' ? (
              <LandingPage profile={profile} onEnterBooking={() => setStudentView('booking')} />
            ) : studentView === 'my-bookings' ? (
              <div className="flex flex-col h-full animate-in fade-in p-8 pt-10 pb-24">
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-2xl font-bold text-[#2F3437]">我的預約紀錄</h1>
                </div>
                
                <div className="flex bg-[#F6F5F2]/50 p-1 rounded-xl mb-4 border border-[#C9D6D0]">
                  <button 
                    onClick={() => setBookingTab('upcoming')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${bookingTab === 'upcoming' ? 'bg-white text-[#7FA8A4] shadow-sm' : 'text-[#7A7A7A] hover:bg-white/50'}`}
                  >
                    近期預約
                  </button>
                  <button 
                    onClick={() => setBookingTab('history')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${bookingTab === 'history' ? 'bg-white text-[#7FA8A4] shadow-sm' : 'text-[#7A7A7A] hover:bg-white/50'}`}
                  >
                    歷史課程
                  </button>
                </div>

                {bookings.filter(b => {
                  const s = sessions.find(sess => sess.id === b.sessionId);
                  if (!s) return false;
                  return bookingTab === 'history' ? s.status === 'completed' : s.status !== 'completed';
                }).length === 0 ? (
                  <p className="text-[#7A7A7A] mt-10 text-center font-bold text-sm">尚無相關預約紀錄。</p>
                ) : (
                  <div className="space-y-4">
                    {bookings.filter(b => {
                      const s = sessions.find(sess => sess.id === b.sessionId);
                      if (!s) return false;
                      return bookingTab === 'history' ? s.status === 'completed' : s.status !== 'completed';
                    }).map(b => {
                      const s = sessions.find(sess => sess.id === b.sessionId);
                      if (!s) return null;
                      return (
                         <div key={b.id} className={`rounded-3xl p-5 border border-[#C9D6D0]/50 ${s.status === 'completed' ? 'bg-white opacity-80' : 'bg-[#F6F5F2]'}`}>
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-[#7A7A7A] text-[10px] font-bold tracking-wider">{s.date}</span>
                                {s.location && <span className="text-[#7A7A7A] text-[10px] font-bold tracking-wider ml-2">📍 {s.location}</span>}
                              </div>
                              {s.status === 'completed' && <span className="bg-[#E0EBE8] text-[#7FA8A4] px-2 py-0.5 rounded text-[10px] font-bold">已完成</span>}
                            </div>
                            <h3 className={`font-bold mt-1 text-lg text-[#2F3437] ${s.status === 'completed' ? 'line-through decoration-[#7A7A7A]' : ''}`}>{s.title}</h3>
                            <div className="flex justify-between items-end mt-4">
                              <div>
                                <p className={`text-xs font-bold ${b.status === 'confirmed' ? 'text-green-500' : b.status === 'cancelled' ? 'text-red-500' : b.status === 'waitlist' ? 'text-orange-500' : b.status === 'offered' ? 'text-blue-500' : 'text-[#D9A46A]'}`}>
                                  {b.status === 'confirmed' ? '✅ 已確認' : b.status === 'cancelled' ? '❌ 已取消' : b.status === 'waitlist' ? `🕒 候補中 (第 ${bookings.filter(bk => bk.sessionId === b.sessionId && bk.status === 'waitlist').sort((x, y) => x.createdAt.localeCompare(y.createdAt)).findIndex(bk => bk.id === b.id) + 1} 順位)` : b.status === 'offered' ? '✨ 候補成功，請確認預約' : '⏳ 待確認付款'}
                                </p>
                              </div>
                              <span className="text-[#2F3437] font-bold text-sm">${s.price}</span>
                            </div>
                            {b.status === 'offered' && (
                              <button 
                                onClick={() => setSelectedOfferedBooking(b)}
                                className="w-full mt-3 bg-[#7FA8A4] text-white py-2 rounded-xl font-bold text-sm shadow-sm active:scale-95 transition-transform"
                              >
                                確認預約並上傳匯款
                              </button>
                            )}
                            {b.status !== 'cancelled' && s.status !== 'completed' && (
                              <button 
                                onClick={() => handleCancelBooking(b)}
                                className="w-full mt-2 bg-red-50 text-red-500 py-2 rounded-xl font-bold text-sm shadow-sm active:scale-95 transition-transform"
                              >
                                取消預約
                              </button>
                            )}
                         </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ) : studentView === 'profile' ? (
              <StudentProfileView />
            ) : (
              <StudentHome 
                sessions={sessions.filter(s => s.status !== 'completed')} 
                bookings={bookings}
                onBookClick={setSelectedSession} 
              />
            )
          ) : userProfile?.role === 'coach' ? (
             <CoachHome 
                sessions={sessions} 
                bookings={bookings} 
                profile={profile}
                allUsers={allUsers}
             />
          ) : (
             <div className="p-8 text-center mt-10">正在驗證您的身分...</div>
          )}

        </div>

        {selectedSession && (
          <BookingModal 
            session={selectedSession} 
            onClose={() => setSelectedSession(null)}
            onSubmit={handleBookSubmit}
          />
        )}
        
        {selectedOfferedBooking && (
          <PaymentUploadModal
            session={sessions.find(s => s.id === selectedOfferedBooking.sessionId)!}
            booking={selectedOfferedBooking}
            onClose={() => setSelectedOfferedBooking(null)}
            onSubmit={handleOfferedPaymentSubmit}
          />
        )}

        {!selectedSession && !selectedOfferedBooking && (
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-white border-t border-[#C9D6D0]/30 flex justify-around items-center px-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-40 pb-2">
            {userProfile?.role === 'student' ? (
              <>
                <button onClick={() => setStudentView('landing')} className={`flex flex-col items-center gap-1 ${studentView === 'landing' ? 'text-[#7FA8A4]' : 'text-[#7A7A7A] hover:text-[#2F3437]'}`}>
                  <div className={`p-1.5 rounded-xl ${studentView === 'landing' ? 'bg-[#7FA8A4]/10' : ''}`}><Home size={20} /></div>
                  <span className="text-[10px] font-bold">首頁</span>
                </button>
                <button onClick={() => setStudentView('booking')} className={`flex flex-col items-center gap-1 ${studentView === 'booking' ? 'text-[#7FA8A4]' : 'text-[#7A7A7A] hover:text-[#2F3437]'}`}>
                  <div className={`p-1.5 rounded-xl ${studentView === 'booking' ? 'bg-[#7FA8A4]/10' : ''}`}><span className="text-xl">📅</span></div>
                  <span className="text-[10px] font-bold">預約</span>
                </button>
                <button onClick={() => setStudentView('my-bookings')} className={`flex flex-col items-center gap-1 ${studentView === 'my-bookings' ? 'text-[#7FA8A4]' : 'text-[#7A7A7A] hover:text-[#2F3437]'}`}>
                  <div className={`p-1.5 rounded-xl ${studentView === 'my-bookings' ? 'bg-[#7FA8A4]/10' : ''}`}><span className="text-xl">📝</span></div>
                  <span className="text-[10px] font-bold">我的預約</span>
                </button>
                <button onClick={() => setStudentView('profile')} className={`flex flex-col items-center gap-1 ${studentView === 'profile' ? 'text-[#7FA8A4]' : 'text-[#7A7A7A] hover:text-[#2F3437]'}`}>
                  <div className={`p-1.5 rounded-xl ${studentView === 'profile' ? 'bg-[#7FA8A4]/10' : ''}`}><UserCircle2 size={20} /></div>
                  <span className="text-[10px] font-bold">個人資料</span>
                </button>
                <button onClick={() => signOut()} className="flex flex-col items-center gap-1 text-red-400 hover:text-red-500">
                  <div className="p-1.5 rounded-xl"><LogOut size={20} /></div>
                  <span className="text-[10px] font-bold">登出</span>
                </button>
              </>
            ) : (
              <>
                <div className="flex flex-col items-center gap-1 text-[#7FA8A4]">
                  <div className="p-1.5 rounded-xl bg-[#7FA8A4]/10"><UserCircle2 size={20} /></div>
                  <span className="text-[10px] font-bold">教練端</span>
                </div>
                <button onClick={() => signOut()} className="flex flex-col items-center gap-1 text-red-400 hover:text-red-500">
                  <div className="p-1.5 rounded-xl"><LogOut size={20} /></div>
                  <span className="text-[10px] font-bold">登出</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
