/**
 * Facebook Pixel Service
 * 
 * Centralized utility for tracking Facebook Pixel events.
 * Uses dynamic import to avoid SSR issues.
 * 
 * Pixel ID: 1639927200753706
 */

const FB_PIXEL_ID = '1639927200753706';

// Flag to track initialization
let isInitialized = false;

/**
 * Initialize Facebook Pixel (called automatically on first event)
 */
const initPixel = async () => {
  if (typeof window === 'undefined') return null;
  
  try {
    const ReactPixel = (await import('react-facebook-pixel')).default;
    
    if (!isInitialized) {
      ReactPixel.init(FB_PIXEL_ID, undefined, {
        autoConfig: true,
        debug: process.env.NODE_ENV === 'development',
      });
      isInitialized = true;
      console.log('📊 Facebook Pixel initialized');
    }
    
    return ReactPixel;
  } catch (error) {
    console.error('Facebook Pixel initialization error:', error);
    return null;
  }
};

/**
 * Track a page view
 */
export const trackPageView = async () => {
  const ReactPixel = await initPixel();
  if (ReactPixel) {
    ReactPixel.pageView();
    console.log('📊 Facebook Pixel: PageView');
  }
};

/**
 * Track CompleteRegistration event
 * Use this when a vendor successfully creates their store
 */
export const trackCompleteRegistration = async (data?: {
  value?: number;
  currency?: string;
  content_name?: string;
}) => {
  const ReactPixel = await initPixel();
  if (ReactPixel) {
    ReactPixel.track('CompleteRegistration', {
      value: data?.value || 0,
      currency: data?.currency || 'EGP',
      content_name: data?.content_name || 'Vendor Store Registration',
    });
    console.log('📊 Facebook Pixel: CompleteRegistration', data);
  }
};

/**
 * Track Lead event
 * Use this when a user submits a vendor application
 */
export const trackLead = async (data?: {
  content_name?: string;
  content_category?: string;
}) => {
  const ReactPixel = await initPixel();
  if (ReactPixel) {
    ReactPixel.track('Lead', {
      content_name: data?.content_name || 'Vendor Application',
      content_category: data?.content_category || 'Vendor',
    });
    console.log('📊 Facebook Pixel: Lead', data);
  }
};

/**
 * Track ViewContent event
 * Use this when viewing a product
 */
export const trackViewContent = async (data: {
  content_name: string;
  content_ids?: string[];
  content_type?: string;
  value?: number;
  currency?: string;
}) => {
  const ReactPixel = await initPixel();
  if (ReactPixel) {
    ReactPixel.track('ViewContent', {
      content_name: data.content_name,
      content_ids: data.content_ids || [],
      content_type: data.content_type || 'product',
      value: data.value || 0,
      currency: data.currency || 'EGP',
    });
    console.log('📊 Facebook Pixel: ViewContent', data);
  }
};

/**
 * Track AddToCart event
 */
export const trackAddToCart = async (data: {
  content_name: string;
  content_ids?: string[];
  content_type?: string;
  value?: number;
  currency?: string;
  num_items?: number;
}) => {
  const ReactPixel = await initPixel();
  if (ReactPixel) {
    ReactPixel.track('AddToCart', {
      content_name: data.content_name,
      content_ids: data.content_ids || [],
      content_type: data.content_type || 'product',
      value: data.value || 0,
      currency: data.currency || 'EGP',
      num_items: data.num_items || 1,
    });
    console.log('📊 Facebook Pixel: AddToCart', data);
  }
};

/**
 * Track InitiateCheckout event
 */
export const trackInitiateCheckout = async (data: {
  content_ids?: string[];
  value?: number;
  currency?: string;
  num_items?: number;
}) => {
  const ReactPixel = await initPixel();
  if (ReactPixel) {
    ReactPixel.track('InitiateCheckout', {
      content_ids: data.content_ids || [],
      value: data.value || 0,
      currency: data.currency || 'EGP',
      num_items: data.num_items || 1,
    });
    console.log('📊 Facebook Pixel: InitiateCheckout', data);
  }
};

/**
 * Track Purchase event
 */
export const trackPurchase = async (data: {
  content_ids?: string[];
  content_name?: string;
  value: number;
  currency?: string;
  num_items?: number;
  order_id?: string;
}) => {
  const ReactPixel = await initPixel();
  if (ReactPixel) {
    ReactPixel.track('Purchase', {
      content_ids: data.content_ids || [],
      content_name: data.content_name || 'Order',
      value: data.value,
      currency: data.currency || 'EGP',
      num_items: data.num_items || 1,
    });
    console.log('📊 Facebook Pixel: Purchase', data);
  }
};

/**
 * Track Search event
 */
export const trackSearch = async (searchString: string) => {
  const ReactPixel = await initPixel();
  if (ReactPixel) {
    ReactPixel.track('Search', {
      search_string: searchString,
    });
    console.log('📊 Facebook Pixel: Search', searchString);
  }
};

/**
 * Track custom event
 */
export const trackCustomEvent = async (eventName: string, data?: Record<string, any>) => {
  const ReactPixel = await initPixel();
  if (ReactPixel) {
    ReactPixel.trackCustom(eventName, data);
    console.log(`📊 Facebook Pixel: Custom Event "${eventName}"`, data);
  }
};

export default {
  trackPageView,
  trackCompleteRegistration,
  trackLead,
  trackViewContent,
  trackAddToCart,
  trackInitiateCheckout,
  trackPurchase,
  trackSearch,
  trackCustomEvent,
};
