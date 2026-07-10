export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: 'student' | 'coach';
  lineId?: string;
  phone?: string;
  isProfileComplete: boolean;
  createdAt: string;
}

export interface CoachProfile {
  name: string;
  slogan: string;
  philosophy: string;
  experience: string;
  imageUrl?: string;
  photos?: string[];
}

export interface Session {
  id: string;
  title: string;
  description?: string;
  bankInfo?: string;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  price: number;
  totalSlots: number;
  bookedSlots: number;
  status?: 'active' | 'completed';
}

export interface Booking {
  id: string;
  sessionId: string;
  studentId: string;
  studentName: string;
  email: string;
  lineId: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'waitlist' | 'offered';
  paymentScreenshotUrl?: string;
  paymentLast5?: string;
  createdAt: string;
  reminderSent?: boolean;
  reminderSentAt?: string;
}
