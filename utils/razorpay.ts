// Razorpay Payment Integration
const RAZORPAY_KEY_ID = (import.meta as any)?.env?.VITE_RAZORPAY_KEY_ID || '';

// Declare Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayOptions {
  key: string;
  amount?: number; // Amount in paise (smallest currency unit)
  currency?: string;
  subscription_id?: string;
  name: string;
  description: string;
  handler: (response: any) => void;
  prefill?: {
    email?: string;
    contact?: string;
    name?: string;
  };
  theme?: {
    color: string;
  };
  modal?: {
    ondismiss: () => void;
  };
}

export const initiateRazorpayPayment = (
  amount: number | string,
  planName: string,
  planFrequency: string,
  onSuccess?: (response: any) => void,
  onError?: (error: any) => void,
  keyIdOverride?: string
) => {
  const keyId = keyIdOverride || RAZORPAY_KEY_ID;
  if (!keyId) {
    if (onError) onError(new Error('Missing Razorpay client configuration (set VITE_RAZORPAY_KEY_ID)'));
    return;
  }
  // Load Razorpay script if not already loaded
  if (!window.Razorpay) {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      openRazorpayCheckout(amount, planName, planFrequency, keyId, onSuccess, onError);
    };
    script.onerror = () => {
      if (onError) {
        onError(new Error('Failed to load Razorpay checkout script'));
      }
    };
    document.body.appendChild(script);
  } else {
    openRazorpayCheckout(amount, planName, planFrequency, keyId, onSuccess, onError);
  }
};

export const initiateRazorpaySubscription = (
  subscriptionId: string,
  planName: string,
  planFrequency: string,
  onSuccess?: (response: any) => void,
  onError?: (error: any) => void,
  keyIdOverride?: string
) => {
  const keyId = keyIdOverride || RAZORPAY_KEY_ID;
  if (!keyId) {
    if (onError) onError(new Error('Missing Razorpay client configuration (set VITE_RAZORPAY_KEY_ID)'));
    return;
  }
  if (!subscriptionId) {
    if (onError) onError(new Error('Missing subscription id'));
    return;
  }

  if (!window.Razorpay) {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      openRazorpaySubscriptionCheckout(subscriptionId, planName, planFrequency, keyId, onSuccess, onError);
    };
    script.onerror = () => {
      if (onError) onError(new Error('Failed to load Razorpay checkout script'));
    };
    document.body.appendChild(script);
  } else {
    openRazorpaySubscriptionCheckout(subscriptionId, planName, planFrequency, keyId, onSuccess, onError);
  }
};

const openRazorpayCheckout = (
  amount: number | string,
  planName: string,
  planFrequency: string,
  keyId: string,
  onSuccess?: (response: any) => void,
  onError?: (error: any) => void
) => {
  // Amount is already in INR, convert to paise (INR smallest unit)
  // Remove any commas from the amount string if present
  const cleanAmount = typeof amount === 'string' ? parseFloat(amount.replace(/,/g, '')) : amount;
  const amountInPaise = Math.round(cleanAmount * 100);

  const options: RazorpayOptions = {
    key: keyId,
    amount: amountInPaise,
    currency: 'INR',
    name: 'Yoga Flow',
    description: `${planName} - ${planFrequency}`,
    handler: function (response: any) {
      // Payment successful
      console.log('Payment successful:', response);
      if (onSuccess) {
        onSuccess(response);
      }
      // Here you would typically send the payment details to your backend
      // to verify the payment signature
    },
    prefill: {
      // You can prefill user details if available
    },
    theme: {
      color: '#0d9488', // Teal color matching your brand
    },
    modal: {
      ondismiss: function () {
        // User closed the payment modal
        if (onError) {
          onError(new Error('Payment cancelled by user'));
        }
      },
    },
  };

  try {
    const razorpay = new window.Razorpay(options);
    razorpay.open();
  } catch (error) {
    console.error('Error opening Razorpay checkout:', error);
    if (onError) {
      onError(error);
    }
  }
};

const openRazorpaySubscriptionCheckout = (
  subscriptionId: string,
  planName: string,
  planFrequency: string,
  keyId: string,
  onSuccess?: (response: any) => void,
  onError?: (error: any) => void
) => {
  const options: RazorpayOptions = {
    key: keyId,
    subscription_id: subscriptionId,
    name: 'Yoga Flow',
    description: `${planName} - ${planFrequency}`,
    handler: function (response: any) {
      if (onSuccess) onSuccess(response);
    },
    theme: {
      color: '#0d9488',
    },
    modal: {
      ondismiss: function () {
        if (onError) onError(new Error('Payment cancelled by user'));
      },
    },
  };

  try {
    const razorpay = new window.Razorpay(options);
    razorpay.open();
  } catch (error) {
    console.error('Error opening Razorpay checkout:', error);
    if (onError) onError(error);
  }
};
