
import React, { useState, useEffect } from 'react';
import { SectionHeading } from './SectionHeading';
import { PRICING_TIERS_INR, PRICING_TIERS_USD } from '../constants';
import { PricingTier } from '../types';
import { Button } from './Button';
import { Check, ShieldCheck, Zap, Star, Globe } from 'lucide-react';
import { Reveal } from './Reveal';
import { initiateRazorpayPayment, initiateRazorpaySubscription } from '../utils/razorpay';
import { useAuth } from '../contexts/AuthContext';
import { LoginModal, SignupModal } from './LoginModal';
import { useAuth as useClerkAuth } from '@clerk/react';
import { apiClient } from '../utils/apiClient';
import { getSettings } from '../utils/settings';


interface PricingProps {
  onShowLogin?: () => void;
}

export const Pricing: React.FC<PricingProps> = ({ onShowLogin }) => {
  const { isAuthenticated, user } = useAuth();
  const { getToken } = useClerkAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [pendingPurchase, setPendingPurchase] = useState<PricingTier | null>(null);
  const [isIndia, setIsIndia] = useState<boolean>(true);
  const [showCurrencyToggle, setShowCurrencyToggle] = useState<boolean>(false);
  const [pricingTiersINR, setPricingTiersINR] = useState<PricingTier[]>(PRICING_TIERS_INR);
  const [pricingTiersUSD, setPricingTiersUSD] = useState<PricingTier[]>(PRICING_TIERS_USD);
  const [razorpayKeyId, setRazorpayKeyId] = useState<string>('');
  const [userSubscription, setUserSubscription] = useState<any | null>(null);
  const [hasTrialEntitlement, setHasTrialEntitlement] = useState<boolean>(false);
  const [hasFullCourseEntitlement, setHasFullCourseEntitlement] = useState<boolean>(false);

  const readJson = async (resp: Response) => {
    const text = await resp.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      return { __raw: text };
    }
  };

  const ensureRazorpayKeyId = async (): Promise<string> => {
    if (razorpayKeyId) return razorpayKeyId;
    try {
      const r = await fetch('/api/razorpay?action=key-id');
      const j: any = await readJson(r);
      const key = typeof j?.keyId === 'string' ? j.keyId.trim() : '';
      if (r.ok && key) {
        setRazorpayKeyId(key);
        return key;
      }
    } catch {}
    return '';
  };

  useEffect(() => {
    const envKeyId = (import.meta as any)?.env?.VITE_RAZORPAY_KEY_ID || '';
    if (envKeyId) {
      setRazorpayKeyId(envKeyId);
      return;
    }
    fetch('/api/razorpay?action=key-id')
      .then(async (r) => ({ ok: r.ok, j: await readJson(r) }))
      .then(({ ok, j }) => {
        if (!ok) return;
        if (typeof j?.keyId === 'string' && j.keyId.trim()) {
          setRazorpayKeyId(j.keyId.trim());
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setUserSubscription(null);
      setHasTrialEntitlement(false);
      setHasFullCourseEntitlement(false);
      return;
    }

    apiClient.get('subscription', user.id)
      .then((data) => setUserSubscription(data && data.id ? data : null))
      .catch(() => setUserSubscription(null));
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (!isAuthenticated) {
      setHasTrialEntitlement(false);
      setHasFullCourseEntitlement(false);
      return;
    }
    fetch('/api/entitlements/trial')
      .then((r) => (r.ok ? r.json() : null))
      .then((j: any) => setHasTrialEntitlement(!!j?.hasPurchased))
      .catch(() => setHasTrialEntitlement(false));
    fetch('/api/entitlements/full-course')
      .then((r) => (r.ok ? r.json() : null))
      .then((j: any) => setHasFullCourseEntitlement(!!j?.hasPurchased))
      .catch(() => setHasFullCourseEntitlement(false));
  }, [isAuthenticated]);

  const getCurrentPeriodEnd = (tier: PricingTier): Date => {
    const now = new Date();
    const frequency = (tier.frequency || '').toLowerCase();
    const name = (tier.name || '').toLowerCase();
    const end = new Date(now);
    if (frequency.includes('month') || frequency === '/month') {
      end.setMonth(end.getMonth() + 1);
      return end;
    }
    if (name.includes('6 month') || frequency.includes('6')) {
      end.setMonth(end.getMonth() + 6);
      return end;
    }
    end.setMonth(end.getMonth() + 6);
    return end;
  };

  const saveSubscription = async (tier: PricingTier, paymentResponse: any, razorpay?: { subscriptionId?: string; planId?: string; currentEnd?: number; status?: string; startAt?: number; chargeAt?: number; currentStart?: number; }) => {
    if (!user?.id) return;
    const currentPeriodEnd = razorpay?.currentEnd
      ? new Date(Number(razorpay.currentEnd) * 1000)
      : getCurrentPeriodEnd(tier);

    try {
      const token = await getToken();
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          planId: tier.name, // e.g. "Monthly Subscription"
          planName: tier.name,
          status: razorpay?.status || 'ACTIVE',
          razorpaySubId: razorpay?.subscriptionId || paymentResponse?.razorpay_subscription_id || null,
          validUntil: currentPeriodEnd.toISOString(),
          paymentId: paymentResponse?.razorpay_payment_id || null,
          planFrequency: tier.frequency || null
        })
      });

      if (!res.ok) {
        const err = await res.text();
        console.error('Failed to save subscription:', err);
      }
    } catch (error) {
      console.error('Error in saveSubscription:', error);
    }
  };

  const handlePaymentSuccess = (tier: PricingTier, response: any) => {
    console.log('Payment successful:', response);
    saveSubscription(tier, response).catch((error) => {
      console.error('Error saving subscription:', error);
    });
    alert(`Payment successful! Welcome to ${tier.name}. Your payment ID: ${response.razorpay_payment_id}`);
  };

  const MONTHLY_PLAN_ID = 'plan_SK5sCuQ0VyqnGn';
  const isMonthlyTier = (tier: PricingTier) => {
    const frequency = (tier.frequency || '').toLowerCase();
    return frequency.includes('month') || frequency === '/month';
  };
  const isTrialTier = (tier: PricingTier) => normalize(tier.name).includes('seven-day flow') || normalize(tier.name).includes('trial pack');

  const normalize = (value: any) => (value ?? '').toString().toLowerCase();
  const isSubscriptionActive = (() => {
    if (!userSubscription) return false;
    const status = normalize(userSubscription?.status);
    if (!status) return true;
    if (status.includes('cancel')) return false;
    if (status.includes('expire')) return false;
    return true;
  })();
  const currentPlan = normalize(userSubscription?.planType || user?.plan);
  const hasMonthly = isSubscriptionActive && currentPlan.includes('monthly');
  const hasFullCourse = hasFullCourseEntitlement || (isSubscriptionActive && currentPlan.includes('full course'));

  const startAutopaySubscription = async (tier: PricingTier) => {
    if (!user?.id) {
      alert('Please login to continue.');
      return;
    }

    try {
      const token = await getToken();
      const resp = await fetch('/api/razorpay?action=create-subscription', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          planId: MONTHLY_PLAN_ID,
          userId: user.id,
          email: user.email || '',
          name: user.name || '',
          totalCount: 120, // 10 years
          trialDays: 0,    // No trial by default
        }),
      });
      const data: any = await readJson(resp);
      if (!resp.ok) {
        throw new Error(data?.error || `Failed to create subscription (${resp.status})`);
      }
      const subscriptionId = data?.subscription?.id || data?.subscriptionId;
      if (!subscriptionId || typeof subscriptionId !== 'string') {
        throw new Error(`Failed to create subscription: missing subscription id`);
      }
      const checkoutKeyId =
        (typeof data?.keyId === 'string' && data.keyId.trim()) ? data.keyId.trim() : await ensureRazorpayKeyId();
      if (!checkoutKeyId) {
        throw new Error('Missing Razorpay client configuration (set VITE_RAZORPAY_KEY_ID)');
      }

      initiateRazorpaySubscription(
        subscriptionId,
        tier.name,
        tier.frequency,
        async (response) => {
          try {
            const token = await getToken();
            const verifyResp = await fetch('/api/razorpay?action=verify-subscription', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                 'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(response),
            });
            const verified: any = await readJson(verifyResp);
            if (!verifyResp.ok || !verified?.ok) {
              throw new Error(verified?.error || 'Subscription verification failed');
            }

            const sub = verified.subscription as any;
            const nowSeconds = Math.floor(Date.now() / 1000);
            const fallbackTrialEnd = nowSeconds + 30 * 24 * 60 * 60;
            const currentEndSeconds = typeof sub?.current_end === 'number' && sub.current_end > 0
              ? sub.current_end
              : (typeof sub?.start_at === 'number' && sub.start_at > nowSeconds ? sub.start_at : fallbackTrialEnd);
            const chargeAtSeconds = typeof sub?.charge_at === 'number' && sub.charge_at > 0
              ? sub.charge_at
              : (typeof sub?.start_at === 'number' && sub.start_at > 0 ? sub.start_at : null);

            await saveSubscription(
              tier,
              response,
              {
                subscriptionId: sub?.id,
                planId: sub?.plan_id,
                currentEnd: currentEndSeconds,
                status: sub?.status,
                startAt: typeof sub?.start_at === 'number' ? sub.start_at : undefined,
                chargeAt: typeof chargeAtSeconds === 'number' ? chargeAtSeconds : undefined,
                currentStart: typeof sub?.current_start === 'number' ? sub.current_start : undefined,
              }
            );

            alert(`Subscription activated! Payment ID: ${response.razorpay_payment_id}`);
          } catch (err: any) {
            console.error('Subscription verification error:', err);
            alert(err?.message || 'Subscription verification failed. Please contact support.');
          } finally {
            setPendingPurchase(null);
          }
        },
        (error) => {
          console.error('Subscription payment error:', error);
          if (error?.message !== 'Payment cancelled by user') {
            alert(error?.message || 'Subscription setup failed. Please try again or contact support.');
          }
          setPendingPurchase(null);
        },
        checkoutKeyId
      );
    } catch (error: any) {
      console.error('Autopay start failed:', error);
      alert(error?.message || 'Failed to start subscription.');
    }
  };

  // Detect user location on component mount
  useEffect(() => {
    // Check timezone first (quick check)
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const isIndiaTimezone = timezone.includes('Calcutta') || timezone.includes('Kolkata') || timezone.includes('Asia/Kolkata');
    
    // Check browser language
    const language = navigator.language || (navigator as any).userLanguage;
    const isIndiaLanguage = language.includes('en-IN') || language.includes('hi');
    
    // Try to get more accurate location via IP (fallback to timezone/language)
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        if (data.country_code === 'IN') {
          setIsIndia(true);
        } else if (data.country_code) {
          setIsIndia(false);
        } else {
          // Fallback to timezone/language detection
          setIsIndia(isIndiaTimezone || isIndiaLanguage);
        }
        setShowCurrencyToggle(true);
      })
      .catch(() => {
        // Fallback to timezone/language detection if IP API fails
        setIsIndia(isIndiaTimezone || isIndiaLanguage);
        setShowCurrencyToggle(true);
      });
  }, []);

  useEffect(() => {
    getSettings().then((settings) => {
      if (settings.pricingTiersINR && Array.isArray(settings.pricingTiersINR) && settings.pricingTiersINR.length > 0) {
        setPricingTiersINR(settings.pricingTiersINR as PricingTier[]);
      }
      if (settings.pricingTiersUSD && Array.isArray(settings.pricingTiersUSD) && settings.pricingTiersUSD.length > 0) {
        setPricingTiersUSD(settings.pricingTiersUSD as PricingTier[]);
      }
    }).catch((error) => {
      console.error('Error loading pricing settings:', error);
    });
  }, []);

  const currentPricingTiers = isIndia ? pricingTiersINR : pricingTiersUSD;

  // Proceed with purchase after successful login/signup
  useEffect(() => {
    if (isAuthenticated && pendingPurchase) {
      const tier = pendingPurchase;
      const isUSD = tier.price.includes('$');
      
      // Extract numeric value from price string
      const priceMatch = tier.price.replace(/[₹$,]/g, '').match(/\d+/);
      const amount = priceMatch ? parseFloat(priceMatch[0]) : 0;

      if (amount > 0) {
        // Small delay to ensure modal is closed
        setTimeout(() => {
          (async () => {
            if (isUSD) {
              alert('International payments coming soon! For now, please contact support at support@yogaflow.com to complete your purchase.');
              setPendingPurchase(null);
              return;
            }

            if (isMonthlyTier(tier)) {
              await startAutopaySubscription(tier);
              return;
            }

            const keyId = await ensureRazorpayKeyId();
            initiateRazorpayPayment(
              amount,
              tier.name,
              tier.frequency,
              (response) => {
                handlePaymentSuccess(tier, response);
                setPendingPurchase(null);
              },
              (error) => {
                console.error('Payment error:', error);
                setPendingPurchase(null);
                if (error.message !== 'Payment cancelled by user') {
                  alert(error?.message || 'Payment failed. Please try again or contact support.');
                }
              },
              keyId || undefined
            );
          })().catch(() => {});
        }, 300);
      }
    }
  }, [isAuthenticated, pendingPurchase]);

  const handlePurchase = async (tier: PricingTier) => {
    // Check if user is logged in
    if (!isAuthenticated) {
      // Store the purchase intent and show login modal
      setPendingPurchase(tier);
      setIsLoginModalOpen(true);
      return;
    }

    // User is logged in, proceed with payment
    const isUSD = tier.price.includes('$');
    
    // Extract numeric value from price string
    const priceMatch = tier.price.replace(/[₹$,]/g, '').match(/\d+/);
    const amount = priceMatch ? parseFloat(priceMatch[0]) : 0;

    if (amount === 0) {
      alert('Invalid pricing information. Please contact support.');
      return;
    }

    if (isUSD) {
      // For USD payments, show a message (Razorpay is INR only)
      // In production, you'd integrate with Stripe or another international payment gateway
      alert('International payments coming soon! For now, please contact support at support@yogaflow.com to complete your purchase.');
      return;
    }

    // INR payments via Razorpay
    if (isMonthlyTier(tier)) {
      if (hasMonthly || hasFullCourse) return;
      startAutopaySubscription(tier);
      return;
    }

    if (isTrialTier(tier)) {
      if (hasTrialEntitlement) return;
      try {
        const token = await getToken();
        const resp = await fetch('/api/razorpay?action=trial-order', { 
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data: any = await readJson(resp);
        if (!resp.ok) throw new Error(data?.error || `Failed to create trial order (${resp.status})`);
        const keyId = (typeof data?.keyId === 'string' && data.keyId.trim()) ? data.keyId.trim() : await ensureRazorpayKeyId();
        if (!keyId) throw new Error('Missing Razorpay client configuration (set VITE_RAZORPAY_KEY_ID)');
        const orderId = typeof data?.orderId === 'string' ? data.orderId : '';
        if (!orderId) throw new Error('Missing order id');

        initiateRazorpayPayment(
          29,
          tier.name,
          tier.frequency,
          async (response) => {
            try {
              const token = await getToken();
              const verifyResp = await fetch('/api/razorpay?action=trial-order', {
                method: 'PUT',
                headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(response),
              });
              const verified: any = await readJson(verifyResp);
              if (!verifyResp.ok || !verified?.ok) {
                throw new Error(verified?.error || 'Trial verification failed');
              }
              setHasTrialEntitlement(true);
              alert(`Trial pack activated! Payment ID: ${response.razorpay_payment_id}`);
            } catch (err: any) {
              console.error('Trial verification error:', err);
              alert(err?.message || 'Trial verification failed. Please contact support.');
            }
          },
          (error) => {
            console.error('Trial payment error:', error);
            if (error?.message !== 'Payment cancelled by user') {
              alert(error?.message || 'Payment failed. Please try again.');
            }
          },
          keyId || undefined,
          orderId
        );
      } catch (e: any) {
        alert(e?.message || 'Failed to start trial purchase.');
      }
      return;
    }

    const isFullCourseTier = normalize(tier.name).includes('full course');
    if (isFullCourseTier) {
      if (hasFullCourse) return;
      try {
        const token = await getToken();
        const resp = await fetch('/api/razorpay?action=full-course-order', { 
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data: any = await readJson(resp);
        if (!resp.ok) throw new Error(data?.error || `Failed to create order (${resp.status})`);
        const keyId = (typeof data?.keyId === 'string' && data.keyId.trim()) ? data.keyId.trim() : await ensureRazorpayKeyId();
        if (!keyId) throw new Error('Missing Razorpay client configuration (set VITE_RAZORPAY_KEY_ID)');
        const orderId = typeof data?.orderId === 'string' ? data.orderId : '';
        if (!orderId) throw new Error('Missing order id');

        initiateRazorpayPayment(
          4499,
          tier.name,
          tier.frequency,
          async (response) => {
            try {
              const token = await getToken();
              const verifyResp = await fetch('/api/razorpay?action=full-course-order', {
                method: 'PUT',
                headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(response),
              });
              const verified: any = await readJson(verifyResp);
              if (!verifyResp.ok || !verified?.ok) {
                throw new Error(verified?.error || 'Verification failed');
              }
              setHasFullCourseEntitlement(true);
              alert(`Enrolled! Payment ID: ${response.razorpay_payment_id}`);
            } catch (err: any) {
              console.error('Full course verification error:', err);
              alert(err?.message || 'Verification failed. Please contact support.');
            }
          },
          (error) => {
            console.error('Full course payment error:', error);
            if (error?.message !== 'Payment cancelled by user') {
              alert(error?.message || 'Payment failed. Please try again.');
            }
          },
          keyId || undefined,
          orderId
        );
      } catch (e: any) {
        alert(e?.message || 'Failed to start purchase.');
      }
      return;
    }

    const keyId = await ensureRazorpayKeyId();
    initiateRazorpayPayment(
      amount,
      tier.name,
      tier.frequency,
      (response) => {
        handlePaymentSuccess(tier, response);
      },
      (error) => {
        console.error('Payment error:', error);
        if (error.message !== 'Payment cancelled by user') {
          alert(error?.message || 'Payment failed. Please try again or contact support.');
        }
      },
      keyId || undefined
    );
  };

  return (
    <section className="bg-white py-32 md:py-48 px-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none -z-10">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[820px] h-[820px] bg-teal-50 rounded-full blur-[120px] opacity-60"></div>
        <div className="absolute -bottom-40 -left-40 w-[720px] h-[720px] bg-amber-50 rounded-full blur-[140px] opacity-60"></div>
      </div>

      <div className="max-w-7xl mx-auto">
        <Reveal>
          <SectionHeading 
            title="Invest In Your Well-being" 
            subtitle="Transparent pricing. No hidden fees. Rooted in real transformation."
          />
        </Reveal>

        {/* Currency Toggle */}
        {showCurrencyToggle && (
          <Reveal delay={0.2}>
            <div className="flex items-center justify-center gap-4 mt-8 mb-4">
              <button
                onClick={() => setIsIndia(true)}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                  isIndia
                    ? 'bg-teal-600 text-white shadow-lg'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                ₹ INDIAN
              </button>
              <button
                onClick={() => setIsIndia(false)}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                  !isIndia
                    ? 'bg-teal-600 text-white shadow-lg'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                $ GLOBAL
              </button>
              <Globe className="text-slate-400" size={18} />
            </div>
          </Reveal>
        )}

        <div
          className={`grid gap-10 md:gap-12 items-start mt-16 mx-auto ${
            currentPricingTiers.length >= 3
              ? 'max-w-7xl grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
              : 'max-w-5xl lg:grid-cols-2'
          }`}
        >
          {currentPricingTiers.map((tier, idx) => (
            <Reveal key={idx} delay={idx * 0.1}>
              {(() => {
                const isMonthly = isMonthlyTier(tier);
                const isFull = normalize(tier.name).includes('full course');
                const isTrial = isTrialTier(tier);
                const disabled = (isMonthly && (hasMonthly || hasFullCourse)) || (isFull && hasFullCourse) || (isTrial && hasTrialEntitlement);
                const buttonText = isFull
                  ? (hasFullCourse ? 'Enrolled' : hasMonthly ? 'Upgrade Now' : tier.buttonText)
                  : isTrial
                  ? (hasTrialEntitlement ? 'Already Purchased' : tier.buttonText)
                  : (hasMonthly ? 'Current Plan' : hasFullCourse ? 'Included' : tier.buttonText);

                return (
              <div 
                className={`group relative rounded-[2.5rem] p-10 md:p-12 transition-all duration-500 h-full flex flex-col ${
                  tier.isRecommended
                  ? 'bg-slate-950 text-white shadow-[0_30px_80px_-30px_rgba(2,6,23,0.65)] ring-1 ring-white/10'
                  : 'bg-white/80 backdrop-blur border border-slate-100 shadow-sm hover:shadow-[0_24px_60px_-30px_rgba(2,6,23,0.25)] hover:-translate-y-1'
                }`}
              >
                {/* Subtle gradient border for recommended */}
                {tier.isRecommended && (
                  <div className="pointer-events-none absolute inset-0 rounded-[2.5rem] ring-1 ring-teal-400/20"></div>
                )}
                {tier.isRecommended && (
                  <div className="absolute top-8 right-8">
                    <span className="bg-teal-500 text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-lg">
                      Recommended
                    </span>
                  </div>
                )}

                <div className="mb-10">
                  {tier.isRecommended ? (
                    <Zap className="text-teal-400 mb-6" size={32} />
                  ) : (
                    <ShieldCheck className="text-teal-700 mb-6" size={32} />
                  )}
                  <h3 className={`text-2xl md:text-3xl font-serif font-bold mb-3 ${tier.isRecommended ? 'text-white' : 'text-slate-900'}`}>
                    {tier.name}
                  </h3>
                  <button
                    type="button"
                    onClick={() => alert('We will revert back in 2–3 days.')}
                    className="flex items-baseline gap-2 text-left"
                  >
                    <span className="text-5xl md:text-6xl font-serif font-bold">{tier.price}</span>
                    <span className={`${tier.isRecommended ? 'text-teal-200/60' : 'text-slate-400'} text-sm font-medium tracking-widest uppercase`}>
                      {tier.frequency}
                    </span>
                  </button>
                </div>

                <div className={`h-px w-full mb-10 ${tier.isRecommended ? 'bg-white/10' : 'bg-slate-100'}`}></div>

                <ul className="space-y-6 mb-12 flex-grow">
                  {tier.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-4">
                      <div className={`p-1 rounded-full shrink-0 mt-0.5 ${tier.isRecommended ? 'bg-teal-500/20 text-teal-400' : 'bg-teal-50 text-teal-600'}`}>
                        <Check className="w-4 h-4" />
                      </div>
                      <span className={`text-base font-light leading-relaxed ${tier.isRecommended ? 'text-teal-50' : 'text-slate-600'}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button 
                  variant={tier.isRecommended ? 'primary' : 'outline'} 
                  className={`w-full py-6 rounded-full text-sm tracking-widest uppercase font-bold transition-all duration-500 ${
                    tier.isRecommended 
                    ? 'bg-teal-500 hover:bg-teal-400 border-none shadow-[0_18px_40px_-14px_rgba(20,184,166,0.55)] hover:scale-[1.01]' 
                    : 'border-slate-200 text-slate-800 hover:bg-slate-900 hover:text-white hover:border-slate-900'
                  } disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-transparent`}
                  disabled={disabled}
                  onClick={() => {
                    if (disabled) return;
                    handlePurchase(tier);
                  }}
                >
                  {buttonText}
                </Button>

                {tier.isRecommended && (
                  <div className="mt-8 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.2em] text-teal-300 font-bold opacity-80">
                    <Star size={14} /> Best Value • Save 25%
                  </div>
                )}
              </div>
                );
              })()}
            </Reveal>
          ))}
        </div>
        
        <Reveal delay={0.4}>
          <div className="mt-24 text-center">
              <div className="inline-block px-8 py-6 bg-teal-50/50 rounded-3xl border border-teal-100 max-w-2xl">
                <p className="text-slate-600 text-sm leading-relaxed">
                  Enquire for 1-on-1 personal sessions
                  {/* <button
                    type="button"
                    onClick={() => alert('We will revert back in 2–3 days.')}
                    className="font-bold text-slate-900 border-b-2 border-teal-200 pb-0.5"
                  >
                    $19/hr
                  </button> */}
                  .
                </p>
                <div className="mt-4 flex items-center justify-center gap-6">
                   <div className="text-[10px] font-bold text-teal-600 uppercase tracking-widest flex items-center gap-2">
                      <ShieldCheck size={14} /> Secure Payment
                   </div>
                   <button
                     type="button"
                     onClick={() => alert('We will revert back in 2–3 days.')}
                     className="text-[10px] font-bold text-teal-600 uppercase tracking-widest flex items-center gap-2 hover:text-teal-700 transition-colors"
                   >
                      <Zap size={14} /> Instant Access
                   </button>
                </div>
              </div>
          </div>
        </Reveal>
      </div>

      {/* Login/Signup Modals */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => {
          setIsLoginModalOpen(false);
          // Clear pending purchase if user closes modal without logging in
          if (!isAuthenticated) {
            setPendingPurchase(null);
          }
        }}
        onSwitchToSignup={() => {
          setIsLoginModalOpen(false);
          setIsSignupModalOpen(true);
        }}
      />
      <SignupModal
        isOpen={isSignupModalOpen}
        onClose={() => {
          setIsSignupModalOpen(false);
          // Clear pending purchase if user closes modal without signing up
          if (!isAuthenticated) {
            setPendingPurchase(null);
          }
        }}
        onSwitchToLogin={() => {
          setIsSignupModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />
    </section>
  );
};
