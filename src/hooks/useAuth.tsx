import React, { useState, useEffect, createContext, useContext } from 'react';
import { User } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface UserData {
  uid: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, userData: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Fetch or create user record
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        
        let data: UserData;
        if (userSnap.exists()) {
          data = userSnap.data() as UserData;
        } else {
          data = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || 'Unknown',
            email: firebaseUser.email || '',
            role: 'student', // default role
          };
          await setDoc(userRef, {
            ...data,
            createdAt: Date.now()
          });
        }
        setUserData(data);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
