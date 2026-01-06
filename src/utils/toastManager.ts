
import { toast } from 'sonner';

class ToastManager {
  private activeToasts: Map<string, boolean> = new Map();
  private readonly TOAST_COOLDOWN = 2000; // 2 seconds cooldown between same messages

  private createToastKey(message: string, type: string): string {
    return `${type}:${message}`;
  }

  private canShowToast(key: string): boolean {
    return !this.activeToasts.get(key);
  }

  private setToastActive(key: string): void {
    this.activeToasts.set(key, true);
    setTimeout(() => {
      this.activeToasts.delete(key);
    }, this.TOAST_COOLDOWN);
  }

  success(message: string): void {
    const key = this.createToastKey(message, 'success');
    if (this.canShowToast(key)) {
      this.setToastActive(key);
      toast.success(message);
    }
  }

  error(message: string): void {
    const key = this.createToastKey(message, 'error');
    if (this.canShowToast(key)) {
      this.setToastActive(key);
      toast.error(message);
    }
  }

  info(message: string): void {
    const key = this.createToastKey(message, 'info');
    if (this.canShowToast(key)) {
      this.setToastActive(key);
      toast.info(message);
    }
  }

  warning(message: string): void {
    const key = this.createToastKey(message, 'warning');
    if (this.canShowToast(key)) {
      this.setToastActive(key);
      toast.warning(message);
    }
  }
}

export const toastManager = new ToastManager();
