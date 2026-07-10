import { Session, Booking, CoachProfile } from './types';

export const INITIAL_PROFILE: CoachProfile = {
  name: '王教練',
  slogan: '讓桌球成為你生活的一部分，輕鬆享受運動樂趣！',
  philosophy: '我相信每個人都能在桌球中找到樂趣。我的教學理念是從基本功紮根，並在輕鬆的氛圍中享受運動帶來的健康與快樂。不論你是初學者還是想精進技巧，我都會為你量身打造適合的訓練計畫，讓我們一起在球桌上揮灑汗水！',
  experience: '• 國家級桌球教練\n• 10年教學經驗\n• 曾任多所學校校隊指導教練\n• 全國桌球錦標賽單打前八強',
  imageUrl: 'https://images.unsplash.com/photo-1534158914592-062992fbe900?auto=format&fit=crop&q=80&w=300&h=300'
};

export const INITIAL_SESSIONS: Session[] = [
  {
    id: '1',
    title: '進階技巧訓練',
    description: '針對已有基礎的學員，加強多球訓練與實戰應用。',
    bankInfo: '玉山銀行(808) 1234-5678-9012',
    date: '10月24日 (一)',
    startTime: '14:00',
    endTime: '15:30',
    price: 1200,
    totalSlots: 4,
    bookedSlots: 2,
  },
  {
    id: '2',
    title: '初學基礎班',
    description: '從握拍、基本腳步開始，適合完全沒有經驗的初學者。',
    bankInfo: '玉山銀行(808) 1234-5678-9012',
    date: '10月25日 (二)',
    startTime: '09:00',
    endTime: '10:00',
    price: 800,
    totalSlots: 8,
    bookedSlots: 4,
  }
];

export const INITIAL_BOOKINGS: Booking[] = [];
