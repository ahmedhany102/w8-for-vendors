
import { toast } from 'sonner';

export class LoadingFallback {
  private static timeouts: Map<string, NodeJS.Timeout> = new Map();
  
  static startTimeout(key: string, timeoutMs: number = 3000, fallbackAction?: () => void) {
    // Clear existing timeout if any
    this.clearTimeout(key);
    
    const timeout = setTimeout(() => {
      console.warn(`⚠️ Loading timeout for ${key} after ${timeoutMs}ms`);
      toast.error('Loading is taking too long. Redirecting...');
      
      // Default fallback action
      if (fallbackAction) {
        fallbackAction();
      } else {
        // Clear auth and redirect to login
        import('@/utils/secureAuth').then(({ secureLogout }) => {
          secureLogout();
          window.location.href = '/login';
        });
      }
    }, timeoutMs);
    
    this.timeouts.set(key, timeout);
  }
  
  static clearTimeout(key: string) {
    const timeout = this.timeouts.get(key);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(key);
    }
  }
  
  static clearAllTimeouts() {
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.timeouts.clear();
  }
}
