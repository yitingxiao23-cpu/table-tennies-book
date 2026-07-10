import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: (isCoachAttempt?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  updateUserProfile: async () => {}
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          // Fetch role from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

          if (userDoc.exists()) {
            const data = userDoc.data() as UserProfile;
            
            // Only update role if we just performed a specific login attempt
            const pendingRole = sessionStorage.getItem('pending_login_role');
            if (pendingRole && (pendingRole === 'coach' || pendingRole === 'student')) {
              if (data.role !== pendingRole) {
                data.role = pendingRole;
                await setDoc(doc(db, 'users', firebaseUser.uid), { role: pendingRole }, { merge: true });
              }
              sessionStorage.removeItem('pending_login_role');
            }
            
            setUserProfile(data);
          } else {
            // Default to student if new user, coach must be set manually in DB or via a specific signup flow
            const pendingRole = sessionStorage.getItem('pending_login_role');
            const role = pendingRole === 'coach' ? 'coach' : 'student';
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || '',
              role: role,
              isProfileComplete: false,
              createdAt: new Date().toISOString()
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
            setUserProfile(newProfile);
            sessionStorage.removeItem('pending_login_role');
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (isCoachAttempt: boolean = false) => {
    sessionStorage.setItem('pending_login_role', isCoachAttempt ? 'coach' : 'student');
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid), data, { merge: true });
      setUserProfile(prev => prev ? { ...prev, ...data } : null);
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signInWithGoogle, signOut: handleSignOut, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
