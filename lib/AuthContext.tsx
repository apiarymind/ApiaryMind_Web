"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, getIdToken, signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "./firebase";
import { apiPost } from "./apiClient";

// Define user roles and plan types
export type UserRole = "BEEKEEPER" | "ASSOCIATION_ADMIN" | "SUPER_ADMIN";
export type UserPlan = "FREE" | "PLUS" | "PRO" | "BUSINESS";

export interface UserProfile {
  id: number;
  firebaseUid: string;
  email: string;
  displayName: string;
  role: UserRole;
  plan: UserPlan;
  associationId?: number;
}

interface AuthContextType {
  user: User | null; // Firebase User
  profile: UserProfile | null; // Database Profile
  token: string | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (currentUser: User, currentToken: string) => {
    try {
      // Sync with backend to get/create profile
      const res = await apiPost("/auth/sync", {}, {
        headers: {
          "Authorization": `Bearer ${currentToken}`
        }
      });
      setProfile(res);
      // Store basic info in localStorage if needed for non-react usage, strictly optional as we have context
      localStorage.setItem("userRole", res.role);
    } catch (error) {
      console.error("Failed to fetch user profile", error);
      // If sync fails, we might want to logout or show error. 
      // For now, we keep the firebase user but no profile.
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const idToken = await getIdToken(currentUser);
          setToken(idToken);
          localStorage.setItem("authToken", idToken);
          await fetchProfile(currentUser, idToken);
        } catch (e) {
          console.error("Error getting token", e);
        }
      } else {
        setToken(null);
        setProfile(null);
        localStorage.removeItem("authToken");
        localStorage.removeItem("userRole");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setProfile(null);
    setToken(null);
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
  };

  const refreshProfile = async () => {
    if (user && token) {
      await fetchProfile(user, token);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, token, loading, logout, refreshProfile }}>
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
