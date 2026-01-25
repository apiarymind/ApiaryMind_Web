"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";

// Define User type locally to avoid ESM import issues
type User = {
  id: string;
  email?: string;
  [key: string]: any;
};

// Define user roles and plan types
export type UserRole = "super_admin" | "admin" | "user";
export type UserPlan = "FREE" | "PLUS" | "PRO" | "PRO_PLUS" | "BUSINESS";

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole; // For backward compatibility (małe litery)
  system_role?: 'SUPER_ADMIN' | 'ADMIN' | 'USER'; // Z bazy danych (wielkie litery)
  plan: UserPlan;
  associationId?: number;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  role: UserRole | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchProfile = useCallback(async (currentUser: User) => {
    try {
      // Check if user is anonymous
      const isAnonymous = currentUser.is_anonymous === true || (!currentUser.email && currentUser.app_metadata?.provider === 'anonymous');
      
      console.log('[AuthContext] Fetching profile for user:', currentUser.id, 'isAnonymous:', isAnonymous);
      
      // Fetch system_role and subscription_plan as per new DB schema facts
      const { data, error } = await supabase
        .from('profiles')
        .select('*, system_role, subscription_plan')
        .eq('id', currentUser.id)
        .single();

      // If profile doesn't exist, create it (especially for anonymous users)
      if (error && error.code === 'PGRST116') {
        console.log('[AuthContext] Profile not found (PGRST116), creating new profile for user:', currentUser.id);
        
        const newProfile = {
          id: currentUser.id,
          email: currentUser.email || null,
          system_role: 'USER' as const,
          subscription_plan: isAnonymous ? 'PRO' : 'FREE' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select('*, system_role, subscription_plan')
          .single();

        if (createError) {
          console.error('[AuthContext] Error creating profile:', createError);
          // Don't throw - allow UI to continue even if profile creation fails
          // Profile might be created by trigger
          return;
        }

        if (createdProfile) {
          console.log('[AuthContext] Profile created successfully');
          
          // Map system_role to app role
          let appRole: UserRole = 'user';
          if (createdProfile.system_role === 'SUPER_ADMIN') appRole = 'super_admin';
          else if (createdProfile.system_role === 'ADMIN') appRole = 'admin';

          const userProfile: UserProfile = {
            id: createdProfile.id,
            email: createdProfile.email || '',
            displayName: createdProfile.full_name || createdProfile.email || 'Anonymous User',
            role: appRole,
            system_role: createdProfile.system_role as 'SUPER_ADMIN' | 'ADMIN' | 'USER' | undefined,
            plan: (createdProfile.subscription_plan || 'FREE') as UserPlan,
            avatar_url: createdProfile.avatar_url,
          };
          setProfile(userProfile);
          setRole(appRole);
        }
        return;
      }

      if (error) {
        console.error('[AuthContext] Error fetching profile:', error);
        // Don't throw - allow UI to continue even if profile fetch fails
        // Profile might be created by trigger
        return;
      }

      if (data) {
        console.log("[AuthContext] Profile loaded successfully, role:", data.system_role);
        
        // Map system_role to app role
        let appRole: UserRole = 'user';
        if (data.system_role === 'SUPER_ADMIN') appRole = 'super_admin';
        else if (data.system_role === 'ADMIN') appRole = 'admin';
        // Add other role mappings if needed

        const userProfile: UserProfile = {
          id: data.id,
          email: data.email || '',
          displayName: data.full_name || data.email || 'Anonymous User',
          role: appRole, // For backward compatibility
          system_role: data.system_role as 'SUPER_ADMIN' | 'ADMIN' | 'USER' | undefined, // Z bazy (wielkie litery)
          plan: (data.subscription_plan || 'FREE') as UserPlan,
          avatar_url: data.avatar_url,
        };
        setProfile(userProfile);
        setRole(appRole);
      }
    } catch (error) {
      console.error("[AuthContext] Failed to fetch user profile", error);
      // Don't throw - allow UI to continue even if there's an error
    }
  }, [supabase]);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.access_token) {
        localStorage.setItem("authToken", session.access_token);
      } else {
        localStorage.removeItem("authToken");
      }

      if (session?.user) {
        fetchProfile(session.user).finally(() => {
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.access_token) {
        localStorage.setItem("authToken", session.access_token);
      } else {
        localStorage.removeItem("authToken");
      }

      if (session?.user) {
        // Don't block UI if profile takes time to load
        fetchProfile(session.user).finally(() => {
          setLoading(false);
        });
      } else {
        setProfile(null);
        setRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile]);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setRole(null);
    localStorage.removeItem("authToken");
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, role, loading, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within a AuthProvider");
  }
  return context;
}
