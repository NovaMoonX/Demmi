import { ReactNode, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth as firebaseAuth } from '@lib/firebase/firebase.config';
import {
  signIn as authSignIn,
  signUp as authSignUp,
  signInWithGoogle as authSignInWithGoogle,
  logOut as authLogOut,
  resendVerificationEmail as authResendVerificationEmail,
  convertFirebaseUser,
  AuthUser,
} from '@lib/firebase/auth.service';
import { AuthContext } from '@hooks/useAuth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
      const authUser = convertFirebaseUser(firebaseUser);
      setUser(authUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (
    email: string,
    password: string,
  ): Promise<{ error?: { message: string } }> => {
    const result = await authSignIn(email, password);
    
    if (result.user) {
      setUser(result.user);
    }
    
    return result.error ? { error: result.error } : {};
  };

  const signUp = async (
    email: string,
    password: string,
  ): Promise<{ error?: { message: string } }> => {
    const result = await authSignUp(email, password);
    
    if (result.user) {
      setUser(result.user);
    }
    
    return result.error ? { error: result.error } : {};
  };

  const signInWithGoogle = async (): Promise<{ error?: { message: string } }> => {
    const result = await authSignInWithGoogle();

    if (result.user) {
      setUser(result.user);
    }

    return result.error ? { error: result.error } : {};
  };

  const logOut = async (): Promise<void> => {
    await authLogOut();
    setUser(null);
  };

  const resendVerificationEmail = async (): Promise<{
    error?: { message: string };
  }> => {
    if (!firebaseAuth.currentUser) {
      return { error: { message: 'No user logged in' } };
    }
    
    return await authResendVerificationEmail(firebaseAuth.currentUser);
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    logOut,
    resendVerificationEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
