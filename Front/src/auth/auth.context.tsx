import { createContext, useState, ReactNode, useContext } from "react";

interface AuthContextType {
  auth: { access_token: string } | undefined;
  saveAuth: (token: string) => void;
  currentUser: any; 
  setCurrentUser: (user: any) => void;
  logout: () => void;
  verify: () => Promise<void>; 
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Use 'auth_token' to match what you wrote in the SignInPage
  const [token, setToken] = useState<string | null>(localStorage.getItem("auth_token"));
  
  const auth = token ? { access_token: token } : undefined;

  const saveAuth = (t: string) => {
    localStorage.setItem("auth_token", t);
    setToken(t);
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    setToken(null);
  };

  const verify = async () => {
    // If token exists in localStorage, ensure state is updated
    const localToken = localStorage.getItem("auth_token");
    if (localToken && !token) {
      setToken(localToken);
    }
    return Promise.resolve();
  };

  return (
    <AuthContext.Provider value={{ 
      auth, 
      saveAuth, // This is what we will call in SignInPage
      currentUser: {}, 
      setCurrentUser: () => {}, 
      logout, 
      verify, 
      loading: false 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};