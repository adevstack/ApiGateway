import { createContext, ReactNode, useContext, useEffect, useState, useRef, useCallback } from "react";
import {
  useQuery,
  useMutation,
} from "@tanstack/react-query";
import { User, LoginCredentials, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Session timeout duration in milliseconds (default 24 hours - matching server-side)
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000;
// Warning before timeout (15 minutes before expiry)
const WARNING_BEFORE_TIMEOUT = 15 * 60 * 1000;

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: any;
  logoutMutation: any;
  registerMutation: any;
  sessionExpiresAt: Date | null;
  refreshSession: () => void;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [sessionExpiresAt, setSessionExpiresAt] = useState<Date | null>(null);
  const sessionWarningShown = useRef(false);
  const sessionTimeoutId = useRef<NodeJS.Timeout | null>(null);
  
  // Query for current user
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Function to refresh session expiry calculation
  const refreshSession = useCallback(() => {
    if (user) {
      const newExpiryTime = new Date(Date.now() + SESSION_TIMEOUT);
      setSessionExpiresAt(newExpiryTime);
      sessionWarningShown.current = false;
      
      // Clear any existing timeout
      if (sessionTimeoutId.current) {
        clearTimeout(sessionTimeoutId.current);
      }
      
      // Set new timeout for warning
      sessionTimeoutId.current = setTimeout(() => {
        if (!sessionWarningShown.current) {
          toast({
            title: "Session Expiring Soon",
            description: "Your session will expire in 15 minutes. Please save your work.",
            variant: "destructive",
            duration: 10000, // Show for 10 seconds
          });
          sessionWarningShown.current = true;
        }
      }, SESSION_TIMEOUT - WARNING_BEFORE_TIMEOUT);
    } else {
      setSessionExpiresAt(null);
      if (sessionTimeoutId.current) {
        clearTimeout(sessionTimeoutId.current);
        sessionTimeoutId.current = null;
      }
    }
  }, [user, toast]);

  // Setup session tracking when user changes
  useEffect(() => {
    refreshSession();
    
    // Cleanup on unmount
    return () => {
      if (sessionTimeoutId.current) {
        clearTimeout(sessionTimeoutId.current);
      }
    };
  }, [user, refreshSession]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Login successful",
        description: "You are now logged in",
      });
      refreshSession();
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", userData);
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Registration successful",
        description: "Your account has been created and you are now logged in",
      });
      refreshSession();
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logout successful",
        description: "You have been logged out",
      });
      setSessionExpiresAt(null);
      if (sessionTimeoutId.current) {
        clearTimeout(sessionTimeoutId.current);
        sessionTimeoutId.current = null;
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        sessionExpiresAt,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}