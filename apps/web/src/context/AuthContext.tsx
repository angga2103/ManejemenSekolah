import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  AuthSessionUser,
  AuthTokens,
  LoginRequestDto,
  RegisterTenantRequestDto,
  TenantPublicInfoResponseData,
} from '@edusaas/api-contracts';
import { ApiClient } from '../services/api-client';

interface AuthContextType {
  user: AuthSessionUser | null;
  tokens: AuthTokens | null;
  tenant: TenantPublicInfoResponseData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (dto: LoginRequestDto) => Promise<void>;
  registerTenant: (dto: RegisterTenantRequestDto) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (roleId: string) => Promise<void>;
  resolveTenant: (slugOrSubdomain: string) => Promise<TenantPublicInfoResponseData | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthSessionUser | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [tenant, setTenant] = useState<TenantPublicInfoResponseData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session on mount
  useEffect(() => {
    const initSession = async () => {
      const storedToken = localStorage.getItem('access_token');
      const storedUser = localStorage.getItem('auth_user');
      const storedTenant = localStorage.getItem('active_tenant');

      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          setTokens({
            accessToken: storedToken,
            refreshToken: localStorage.getItem('refresh_token') || '',
            expiresIn: 900,
          });

          if (storedTenant) {
            setTenant(JSON.parse(storedTenant));
          }

          // Verify with live backend
          const res = await ApiClient.get<AuthSessionUser>('/auth/me');
          if (res.data) {
            setUser(res.data);
            localStorage.setItem('auth_user', JSON.stringify(res.data));
          }
        } catch {
          // Token expired or invalid
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('auth_user');
          setUser(null);
          setTokens(null);
        }
      }
      setIsLoading(false);
    };

    initSession();
  }, []);

  const resolveTenant = async (slugOrSubdomain: string): Promise<TenantPublicInfoResponseData | null> => {
    try {
      const res = await ApiClient.get<TenantPublicInfoResponseData>(`/tenants/resolve/${slugOrSubdomain}`);
      if (res.data) {
        setTenant(res.data);
        localStorage.setItem('active_tenant', JSON.stringify(res.data));
        localStorage.setItem('tenant_id', res.data.id);
        return res.data;
      }
    } catch {
      // not found
    }
    return null;
  };

  const login = async (dto: LoginRequestDto) => {
    setIsLoading(true);
    try {
      const res = await ApiClient.post<{ user: AuthSessionUser; tokens: AuthTokens }>('/auth/login', dto);
      const data = res.data;

      setUser(data.user);
      setTokens(data.tokens);

      localStorage.setItem('access_token', data.tokens.accessToken);
      localStorage.setItem('refresh_token', data.tokens.refreshToken);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      localStorage.setItem('tenant_id', data.user.tenantId);

      // Attempt to fetch tenant branding
      if (dto.tenantSlug) {
        await resolveTenant(dto.tenantSlug);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const registerTenant = async (dto: RegisterTenantRequestDto) => {
    setIsLoading(true);
    try {
      const res = await ApiClient.post<any>('/tenants/register', dto);
      const data = res.data;

      localStorage.setItem('access_token', data.tokens.accessToken);
      localStorage.setItem('refresh_token', data.tokens.refreshToken);
      localStorage.setItem('tenant_id', data.tenant.id);

      await resolveTenant(data.tenant.slug);

      // Fetch newly created user profile
      const meRes = await ApiClient.get<AuthSessionUser>('/auth/me');
      if (meRes.data) {
        setUser(meRes.data);
        localStorage.setItem('auth_user', JSON.stringify(meRes.data));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = async (roleId: string) => {
    const res = await ApiClient.post<{ user: AuthSessionUser; tokens: AuthTokens }>('/auth/switch-role', {
      roleId,
    });
    if (res.data) {
      setUser(res.data.user);
      setTokens(res.data.tokens);
      localStorage.setItem('access_token', res.data.tokens.accessToken);
      localStorage.setItem('auth_user', JSON.stringify(res.data.user));
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refresh_token') || undefined;
    try {
      await ApiClient.post('/auth/logout', { refreshToken });
    } catch {
      // ignore
    }

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('auth_user');
    setUser(null);
    setTokens(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tokens,
        tenant,
        isAuthenticated: !!user,
        isLoading,
        login,
        registerTenant,
        logout,
        switchRole,
        resolveTenant,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
