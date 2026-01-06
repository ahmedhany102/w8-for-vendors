
import type { User, Session } from '@supabase/supabase-js';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'VENDOR' | 'USER';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  displayName?: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<boolean>;
  adminLogin: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
  isAdmin: boolean;
  isVendor: boolean;
  isSuperAdmin: boolean;
  checkAuthStatus: () => Promise<void>;
}
