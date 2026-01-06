
export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // hashed
  isAdmin: boolean;
  isBlocked: boolean;
  createdAt: string;
  role: 'ADMIN' | 'USER';
  lastLogin: string;
  ipAddress: string;
  status: 'ACTIVE' | 'BLOCKED' | 'PENDING';
  // Make isSuperAdmin required but with a default value
  isSuperAdmin: boolean;
}
