declare module 'react-facebook-pixel' {
  interface PixelOptions {
    autoConfig?: boolean;
    debug?: boolean;
  }

  interface AdvancedMatching {
    em?: string;
    fn?: string;
    ln?: string;
    ph?: string;
    ge?: string;
    db?: string;
    ct?: string;
    st?: string;
    zp?: string;
    country?: string;
  }

  interface Data {
    content_category?: string;
    content_ids?: string[];
    content_name?: string;
    content_type?: string;
    contents?: { id: string; quantity: number }[];
    currency?: string;
    delivery_category?: string;
    num_items?: number;
    predicted_ltv?: number;
    search_string?: string;
    status?: string;
    value?: number;
    [key: string]: any;
  }

  type StandardEvents =
    | 'AddPaymentInfo'
    | 'AddToCart'
    | 'AddToWishlist'
    | 'CompleteRegistration'
    | 'Contact'
    | 'CustomizeProduct'
    | 'Donate'
    | 'FindLocation'
    | 'InitiateCheckout'
    | 'Lead'
    | 'PageView'
    | 'Purchase'
    | 'Schedule'
    | 'Search'
    | 'StartTrial'
    | 'SubmitApplication'
    | 'Subscribe'
    | 'ViewContent';

  export function init(
    pixelId: string,
    advancedMatching?: AdvancedMatching,
    options?: PixelOptions
  ): void;

  export function pageView(): void;

  export function track(event: StandardEvents, data?: Data): void;

  export function trackSingle(pixelId: string, event: StandardEvents, data?: Data): void;

  export function trackCustom(event: string, data?: Data): void;

  export function trackSingleCustom(pixelId: string, event: string, data?: Data): void;

  export function fbq(...args: any[]): void;

  const ReactPixel: {
    init: typeof init;
    pageView: typeof pageView;
    track: typeof track;
    trackSingle: typeof trackSingle;
    trackCustom: typeof trackCustom;
    trackSingleCustom: typeof trackSingleCustom;
    fbq: typeof fbq;
  };

  export default ReactPixel;
}
