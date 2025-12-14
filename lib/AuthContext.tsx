"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, getIdToken, signOut as firebaseSignOut, IdTokenResult } from "firebase/auth";
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
  role: UserRole | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (currentUser: User, currentToken: string) => {
    try {
      // Attempt to sync with backend
      // If backend is not available, we won't have a profile, but we still have role logic below
      const res = await apiPost("/auth/sync", {}, {
        headers: {
          "Authorization": `Bearer ${currentToken}`
        }
      });
      setProfile(res);
      if (res.role) {
        setRole(res.role);
        localStorage.setItem("userRole", res.role);
      }
    } catch (error) {
      console.error("Failed to fetch user profile (backend might be offline or user not created)", error);
      // Fallback logic happens in onAuthStateChanged
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const idToken = await getIdToken(currentUser);
          const tokenResult: IdTokenResult = await currentUser.getIdTokenResult();
          
          setToken(idToken);
          localStorage.setItem("authToken", idToken);

          // Determine role
          let detectedRole: UserRole = "BEEKEEPER"; // Default
          
          // 1. Hardcoded Super Admin Stub
          if (currentUser.email === "admin@apiarymind.com") {
            detectedRole = "SUPER_ADMIN";
          } 
          // 2. Check Custom Claims
          else if (tokenResult.claims.role) {
             detectedRole = tokenResult.claims.role as UserRole;
          }

          setRole(detectedRole);
          localStorage.setItem("userRole", detectedRole);

          await fetchProfile(currentUser, idToken);

        } catch (e) {
          console.error("Error getting token", e);
        }
      } else {
        setToken(null);
        setProfile(null);
        setRole(null);
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
    setRole(null);
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
  };

  const refreshProfile = async () => {
    if (user && token) {
      await fetchProfile(user, token);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, token, role, loading, logout, refreshProfile }}>
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
