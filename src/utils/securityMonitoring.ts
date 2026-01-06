
import { supabase } from '@/integrations/supabase/client';

interface SecurityEvent {
  event_type: 'login_attempt' | 'admin_access' | 'failed_auth' | 'suspicious_activity';
  user_id?: string;
  email?: string;
  ip_address?: string;
  user_agent?: string;
  details: Record<string, any>;
}

export const logSecurityEvent = async (event: SecurityEvent) => {
  try {
    // Get client IP and user agent for logging
    const details = {
      ...event.details,
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };

    console.log('🔒 Security Event:', {
      type: event.event_type,
      user: event.email || event.user_id,
      details
    });

    // In a production environment, you would send this to a logging service
    // For now, we'll log to console and optionally store in a security_logs table
    
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
};

export const detectSuspiciousActivity = (user_id: string, action: string) => {
  // Simple suspicious activity detection
  const activityKey = `activity_${user_id}_${action}`;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxActions = 10;

  const stored = localStorage.getItem(activityKey);
  let activities: number[] = stored ? JSON.parse(stored) : [];

  // Remove old activities outside the window
  activities = activities.filter(timestamp => now - timestamp < windowMs);

  // Add current activity
  activities.push(now);

  // Store updated activities
  localStorage.setItem(activityKey, JSON.stringify(activities));

  // Check if suspicious
  if (activities.length > maxActions) {
    logSecurityEvent({
      event_type: 'suspicious_activity',
      user_id,
      details: { action, activity_count: activities.length, window_ms: windowMs }
    });
    return true;
  }

  return false;
};

export const clearSecurityData = () => {
  // Clear security-related localStorage data on logout
  Object.keys(localStorage)
    .filter(key => key.startsWith('activity_'))
    .forEach(key => localStorage.removeItem(key));
};
