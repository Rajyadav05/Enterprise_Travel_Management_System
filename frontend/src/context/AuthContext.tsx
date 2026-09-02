import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { authApi } from "../api/auth.api";
import { getToken, removeToken, setToken } from "../api/client";
import type { Employee, User } from "../types";

interface AuthContextType {
  user: User | null;
  employee: Employee | null;
  role: string | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isEmployee: boolean;
  isLoading: boolean;
  login: (loginInput: string, passwordInput: string) => Promise<User>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [tokenState, setTokenState] = useState<string | null>(getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = useCallback(async () => {
    const existingToken = getToken();
    if (!existingToken) {
      setUser(null);
      setEmployee(null);
      setIsLoading(false);
      return;
    }

    try {
      const profileUser = await authApi.getProfile();
      setUser(profileUser);
      setEmployee(profileUser.employee ?? null);
    } catch {
      removeToken();
      setTokenState(null);
      setUser(null);
      setEmployee(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  const login = async (
    loginInput: string,
    passwordInput: string
  ): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await authApi.login(loginInput, passwordInput);
      const fullUser: User = {
        ...response.user,
        roleId: response.user.roleId || response.role.id,
        role: response.role,
        employee: response.employee ?? null,
      };
      setToken(response.token);
      setTokenState(response.token);
      setUser(fullUser);
      setEmployee(response.employee ?? null);
      return fullUser;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(() => {
    void authApi.logout();
    removeToken();
    setTokenState(null);
    setUser(null);
    setEmployee(null);
  }, []);

  const role = user?.role?.name ?? null;
  const isAdmin = role === "ADMIN";
  const isEmployee = role === "EMPLOYEE" || (!isAdmin && !!user);

  return (
    <AuthContext.Provider
      value={{
        user,
        employee,
        role,
        token: tokenState,
        isAuthenticated: !!user && !!tokenState,
        isAdmin,
        isEmployee,
        isLoading,
        login,
        logout,
        refreshProfile: fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
