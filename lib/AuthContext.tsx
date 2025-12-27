"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";

// Define user roles and plan types
export type UserRole = "super_admin" | "admin" | "user";
export type UserPlan = "FREE" | "PLUS" | "PRO" | "PRO_PLUS" | "BUSINESS";

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
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
      // Fetch system_role and subscription_plan as per new DB schema facts
      const { data, error } = await supabase
        .from('profiles')
        .select('*, system_role, subscription_plan')
        .eq('id', currentUser.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        console.log("Rola z bazy:", data.system_role);

        // Map system_role to app role
        let appRole: UserRole = 'user';
        if (data.system_role === 'SUPER_ADMIN') appRole = 'super_admin';
        else if (data.system_role === 'ADMIN') appRole = 'admin';
        // Add other role mappings if needed

        const userProfile: UserProfile = {
          id: data.id,
          email: data.email,
          displayName: data.full_name || data.email,
          role: appRole,
          plan: data.subscription_plan || 'FREE',
          avatar_url: data.avatar_url,
        };
        setProfile(userProfile);
        setRole(appRole);
      }
    } catch (error) {
      console.error("Failed to fetch user profile", error);
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
        fetchProfile(session.user);
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
         fetchProfile(session.user);
      } else {
         setProfile(null);
         setRole(null);
      }
      setLoading(false);
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
