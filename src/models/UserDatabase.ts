
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { User } from '@/models/User';

class UserDatabase {
  private static instance: UserDatabase;
  private users: User[] = [];
  private readonly SALT_ROUNDS = 10;
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'w8StoreDB';
  private readonly STORE_NAME = 'users';

  private constructor() {
    this.initDB();
  }

  public static getInstance(): UserDatabase {
    if (!UserDatabase.instance) {
      UserDatabase.instance = new UserDatabase();
    }
    return UserDatabase.instance;
  }

  private initDB(): void {
    // Use IndexedDB for cross-browser storage consistency
    const request = indexedDB.open(this.DB_NAME, 1);

    request.onerror = (event) => {
      console.error('Error opening database:', event);
    };

    request.onsuccess = (event) => {
      this.db = (event.target as IDBOpenDBRequest).result;
      this.loadUsers();
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(this.STORE_NAME)) {
        db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
      }
    };
  }

  private loadUsers(): void {
    if (!this.db) return;

    const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
    const store = transaction.objectStore(this.STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      this.users = request.result || [];
      if (this.users.length === 0) {
        this.createDefaultAdmin();
      }
      
      // Also sync with localStorage for backward compatibility
      this.syncWithLocalStorage();
    };

    request.onerror = (event) => {
      console.error('Error loading users:', event);
      this.createDefaultAdmin();
    };
  }

  // Sync IndexedDB data with localStorage for backward compatibility
  private syncWithLocalStorage(): void {
    const mockUsers = this.users.map(user => ({
      id: user.id,
      email: user.email,
      password: user.password,
      name: user.name,
      role: user.isAdmin ? "ADMIN" : "USER"
    }));
    localStorage.setItem("mock_users", JSON.stringify(mockUsers));
  }

  private createDefaultAdmin(): void {
    const adminUser: User = {
      id: 'admin-1',
      name: 'Ahmed Hany',
      email: 'ahmedhanyseifeldien@gmail.com',
      password: 'Ahmedhany11*',
      role: 'ADMIN',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      ipAddress: '192.168.1.1',
      status: 'ACTIVE',
      isAdmin: true,
      isSuperAdmin: true,
      isBlocked: false
    };
    this.users = [adminUser];
    this.saveUsers();
  }

  private saveUsers(): void {
    if (!this.db) return;

    const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
    const store = transaction.objectStore(this.STORE_NAME);

    // Clear existing users
    store.clear();

    // Add all users
    this.users.forEach(user => {
      store.add(user);
    });

    transaction.oncomplete = () => {
      // Sync with localStorage for backward compatibility
      this.syncWithLocalStorage();
    };

    transaction.onerror = (event) => {
      console.error('Error saving users:', event);
    };
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  private validatePassword(password: string): boolean {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  public async addUser(userData: Partial<User>): Promise<User | null> {
    try {
      if (!userData.email || !this.validateEmail(userData.email)) {
        throw new Error('Invalid email format');
      }

      const existingUser = this.users.find(user => user.email === userData.email);
      if (existingUser) {
        throw new Error('Email already registered');
      }

      const newUser: User = {
        id: userData.id || uuidv4(),
        name: userData.name || '',
        email: userData.email,
        password: userData.password || '',
        role: userData.role || 'USER',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        ipAddress: '0.0.0.0',
        status: 'ACTIVE',
        isAdmin: userData.role === 'ADMIN',
        isSuperAdmin: userData.isSuperAdmin || false,
        isBlocked: false
      };

      this.users.push(newUser);
      this.saveUsers();
      
      // Return without password
      const { password, ...userWithoutPassword } = newUser;
      return userWithoutPassword as User;
    } catch (error) {
      console.error('Error registering user:', error);
      return null;
    }
  }

  public async createAdminUser(name: string, email: string, password: string): Promise<User | null> {
    try {
      if (!email || !this.validateEmail(email)) {
        throw new Error('Invalid email format');
      }

      const existingUser = this.users.find(user => user.email === email);
      if (existingUser) {
        throw new Error('Email already registered');
      }

      // Create new admin user
      const newUser: User = {
        id: uuidv4(),
        name: name,
        email: email,
        password: password, // We'll let addUser handle hashing if needed
        role: 'ADMIN',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        ipAddress: '0.0.0.0',
        status: 'ACTIVE',
        isAdmin: true,
        isSuperAdmin: false,
        isBlocked: false
      };

      this.users.push(newUser);
      this.saveUsers();
      
      // Return without password
      const { password: _, ...userWithoutPassword } = newUser;
      return userWithoutPassword as User;
    } catch (error) {
      console.error('Error creating admin user:', error);
      return null;
    }
  }

  public async loginUser(email: string, password: string): Promise<User | null> {
    try {
      const user = this.users.find(u => u.email === email);
      if (!user) {
        console.log('User not found:', email);
        return null;
      }

      // Check if it's a simple password or hashed
      let isValid = false;
      if (user.password === password) {
        // Direct comparison for non-hashed passwords
        isValid = true;
      } else {
        // Try bcrypt comparison for hashed passwords
        try {
          isValid = await this.verifyPassword(password, user.password);
        } catch (e) {
          // If bcrypt fails, try base64 decode for legacy passwords
          try {
            isValid = atob(user.password) === password;
          } catch (e2) {
            isValid = false;
          }
        }
      }

      if (!isValid) {
        console.log('Invalid password for user:', email);
        return null;
      }

      user.lastLogin = new Date().toISOString();
      this.saveUsers();

      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    } catch (error) {
      console.error('Error during login:', error);
      return null;
    }
  }

  public getAllUsers(): Omit<User, 'password'>[] {
    return this.users.map(({ password, ...user }) => user);
  }

  public getUserById(id: string): Omit<User, 'password'> | null {
    const user = this.users.find(u => u.id === id);
    if (!user) return null;
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  public async updateUser(id: string, updates: Partial<User>): Promise<boolean> {
    try {
      const userIndex = this.users.findIndex(u => u.id === id);
      if (userIndex === -1) return false;

      if (updates.email && !this.validateEmail(updates.email)) {
        throw new Error('Invalid email format');
      }

      if (updates.email && this.users.some(u => u.email === updates.email && u.id !== id)) {
        throw new Error('Email already in use');
      }

      // Handle password change specially
      if (updates.password) {
        // Store password directly - we'll handle hashing later if needed
        this.users[userIndex] = {
          ...this.users[userIndex],
          ...updates
        };
        
        // Also update in localStorage for backward compatibility
        const mockUsers = JSON.parse(localStorage.getItem("mock_users") || "[]");
        const mockUserIndex = mockUsers.findIndex((u: any) => u.id === id);
        if (mockUserIndex >= 0) {
          mockUsers[mockUserIndex].password = updates.password;
          localStorage.setItem("mock_users", JSON.stringify(mockUsers));
        }
      } else {
        this.users[userIndex] = {
          ...this.users[userIndex],
          ...updates
        };
      }

      if (updates.role) {
        this.users[userIndex].isAdmin = updates.role === 'ADMIN';
      }

      if (updates.status) {
        this.users[userIndex].isBlocked = updates.status === 'BLOCKED';
      }

      this.saveUsers();
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      return false;
    }
  }

  public async updateUserRole(id: string, role: 'ADMIN' | 'USER'): Promise<boolean> {
    return this.updateUser(id, { role });
  }

  public async updateUserStatus(id: string, status: 'ACTIVE' | 'BLOCKED' | 'PENDING'): Promise<boolean> {
    return this.updateUser(id, { status });
  }

  public deleteUser(id: string): boolean {
    try {
      // Don't allow deleting super admin
      const userToDelete = this.users.find(u => u.id === id);
      if (userToDelete && userToDelete.isSuperAdmin) {
        console.error('Cannot delete super admin user');
        return false;
      }
      
      const initialLength = this.users.length;
      this.users = this.users.filter(u => u.id !== id);
      
      if (this.users.length !== initialLength) {
        this.saveUsers();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }
}

export default UserDatabase;
