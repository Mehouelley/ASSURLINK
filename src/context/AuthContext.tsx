import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api as backendApi } from '../lib/api';
import { Profile, Company } from '../types';

interface AuthUser {
  id: string;
  email: string;
  role: string;
  companyId?: string | null;
}

interface AuthSession {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: Profile | null;
  company: Company | null;
  session: AuthSession | null;
  loading: boolean;
  isSubscriptionActive: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (data: SignUpData) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  activateTrial: () => Promise<void>;
}

interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName: string;
  phone?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const isSubscriptionActive = Boolean(company?.is_active);

  async function loadProfile(userId: string) {
    const { data, error } = await backendApi.auth.me();
    console.debug('loadProfile: /auth/me ->', { data, error });
    if (!error && data) {
      // backend /auth/me returns { user, company }
      setProfile(data.user as Profile);
      setCompany(data.company ?? null);
      // expose company to window for Router access (simple bridge)
      try {
        (window as any).__authCompany = data.company ?? null;
      } catch (e) { /* ignore */ }
    }
  }

  async function refreshProfile() {
    if (user) await loadProfile(user.id);
  }

  async function activateTrial() {
    const { error } = await backendApi.auth.activateTrial();
    if (error) throw error;
    await refreshProfile();
  }

  useEffect(() => {
    backendApi.auth.getSession().then(({ data: { session } }) => {
      setSession(session as AuthSession | null);
      setUser((session as AuthSession | null)?.user ?? null);
      if ((session as AuthSession | null)?.user) {
        loadProfile((session as AuthSession).user.id).finally(() => {
          console.debug('AuthProvider: session', session);
          console.debug('AuthProvider: user', (session as AuthSession).user);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = backendApi.auth.onAuthStateChange((event, session) => {
      const nextSession = session as AuthSession | null;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (nextSession?.user) {
        (async () => {
          await loadProfile(nextSession.user.id);
        })();
      } else {
        setProfile(null);
        setCompany(null);
        try { (window as any).__authCompany = null; } catch (e) { /* ignore */ }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await backendApi.auth.signInWithPassword({ email, password });
    if (!error) {
      const { data: sessionData } = await backendApi.auth.getSession();
      const nextSession = sessionData.session as AuthSession | null;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (nextSession?.user) await loadProfile(nextSession.user.id);
    }
    return { error: error as Error | null };
  }

  async function signUp(data: SignUpData) {
    const { error } = await backendApi.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          company_name: data.companyName,
          phone: data.phone,
        },
      },
    });

    if (!error) {
      const { data: sessionData } = await backendApi.auth.getSession();
      const nextSession = sessionData.session as AuthSession | null;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (nextSession?.user) await loadProfile(nextSession.user.id);
    }

    return { error: error as Error | null };
  }

  async function signOut() {
    await backendApi.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setCompany(null);
    try { (window as any).__authCompany = null; } catch (e) { /* ignore */ }
  }

  return (
    <AuthContext.Provider value={{ user, profile, company, session, loading, isSubscriptionActive, signIn, signUp, signOut, refreshProfile, activateTrial }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
