'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '@/lib/firebase';
import { AuthContextType, AuthProviderProps, UserProfile } from '@/lib/auth';
import { User } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Pre-authenticated user for desktop app
  const createPreAuthUser = () => {
    // Use Eric Vo's real Firebase UID to fetch actual creature data
    const preAuthUser = {
      uid: '6wbqAvVg9VaVBC5Ywgyolv2hi5M2', // Eric Vo's real Firebase UID
      email: 'allamasaid@gmail.com',
      displayName: 'Eric Vo',
      photoURL:
        'https://lh3.googleusercontent.com/a/ACg8ocLg0UF62Th6EEyczPoc7bhwB7X-mLL7Sd7Ey_ck3wil6NzC2w=s96-c',
    } as User;

    const preAuthProfile: UserProfile = {
      uid: preAuthUser.uid,
      displayName: preAuthUser.displayName,
      email: preAuthUser.email,
      photoURL: preAuthUser.photoURL,
      createdAt: new Date('2025-08-17T09:43:26.000Z'), // August 17, 2025 at 5:43:26 AM UTC-4
      lastLoginAt: new Date('2025-08-22T14:44:32.000Z'), // August 22, 2025 at 10:44:32 AM UTC-4
      provider: 'google' as const,
    };

    return { user: preAuthUser, profile: preAuthProfile };
  };

  // Temporary function to find Eric Vo's real UID
  const findEricVoUID = async () => {
    try {
      console.log("Searching for Eric Vo's creature in Firestore...");

      // Query creatures collection for Eric Vo's email
      const creaturesRef = collection(db, 'creatures');
      const q = query(
        creaturesRef,
        where('ownerEmail', '==', 'allamasaid@gmail.com')
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const creatureDoc = querySnapshot.docs[0];
        const creatureData = creatureDoc.data();
        console.log("Found Eric Vo's creature:", creatureData);
        console.log("Eric Vo's UID should be:", creatureData.ownerId);
        return creatureData.ownerId;
      } else {
        console.log('No creature found for Eric Vo');
        return null;
      }
    } catch (error) {
      console.error("Error finding Eric Vo's UID:", error);
      return null;
    }
  };

  const createUserProfile = async (
    user: User,
    additionalData: { provider: 'email' | 'google'; displayName?: string } = {
      provider: 'email',
    }
  ) => {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      const { displayName, email, photoURL } = user;
      const createdAt = serverTimestamp();

      try {
        await setDoc(userRef, {
          displayName: additionalData.displayName || displayName,
          email,
          photoURL,
          createdAt,
          lastLoginAt: createdAt,
          provider: additionalData.provider,
        });
      } catch (error) {
        console.error('Error creating user profile:', error);
        throw error;
      }
    } else {
      // Update last login time
      await setDoc(
        userRef,
        {
          lastLoginAt: serverTimestamp(),
        },
        { merge: true }
      );
    }

    // Fetch and return the user profile
    const updatedUserSnap = await getDoc(userRef);
    return { uid: user.uid, ...updatedUserSnap.data() } as UserProfile;
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      console.log('Desktop mode: Creating pre-auth user for sign-in');
      const { user: preAuthUser, profile: preAuthProfile } =
        createPreAuthUser();

      setUser(preAuthUser);
      setUserProfile(preAuthProfile);

      return { user: preAuthUser } as any;
    } catch (error) {
      console.error('Sign-in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    displayName?: string
  ) => {
    setLoading(true);
    try {
      console.log('Desktop mode: Creating pre-auth user for sign-up');
      const { user: preAuthUser, profile: preAuthProfile } =
        createPreAuthUser();

      // Update display name if provided
      if (displayName) {
        const updatedUser = { ...preAuthUser, displayName };
        const updatedProfile = { ...preAuthProfile, displayName };

        setUser(updatedUser);
        setUserProfile(updatedProfile);

        return { user: updatedUser } as any;
      }

      setUser(preAuthUser);
      setUserProfile(preAuthProfile);

      return { user: preAuthUser } as any;
    } catch (error) {
      console.error('Sign-up error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      console.log('Desktop mode: Creating pre-auth user for Google sign-in');
      const { user: preAuthUser, profile: preAuthProfile } =
        createPreAuthUser();

      // Update for Google provider
      preAuthProfile.provider = 'google';

      setUser(preAuthUser);
      setUserProfile(preAuthProfile);

      return { user: preAuthUser } as any;
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      setUserProfile(null);
      setUser(null);
      console.log('Desktop mode: User logged out');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    console.log('Desktop mode: Password reset requested for:', email);
    // In desktop mode, just log the request
  };

  useEffect(() => {
    if (initialized) return;

    console.log(
      'AuthProvider: Initializing in desktop mode with pre-auth user'
    );
    setInitialized(true);
    setLoading(true);

    // Create pre-authenticated user with Eric Vo's real UID
    const { user: preAuthUser, profile: preAuthProfile } = createPreAuthUser();

    setUser(preAuthUser);
    setUserProfile(preAuthProfile);
    setLoading(false);

    console.log(
      'Desktop mode: Pre-authenticated user created with real UID:',
      preAuthUser.email,
      'UID:',
      preAuthUser.uid
    );
  }, [initialized]);

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
