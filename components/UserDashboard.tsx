import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './Button';

import {
    User,
    Calendar,
    CreditCard,
    Heart,
    ChevronRight,
    Clock,
    CheckCircle2,
    PlayCircle,
    Video,
    LogOut,
    MapPin,
    Shield
} from 'lucide-react';

interface UserDashboardProps {
    onBack: () => void;
    initialTab?: 'profile' | 'asanas' | 'classes' | 'subscription';
    onNavAdmin?: () => void;
}

type TabType = 'profile' | 'asanas' | 'classes' | 'subscription';

export const UserDashboard: React.FC<UserDashboardProps> = ({ onBack, initialTab = 'profile', onNavAdmin }) => {
    const { user, logout, isAdmin, isAdminChecking, getToken } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>(initialTab);
    const [subscription, setSubscription] = useState<any | null>(null);
    const [subscriptionLoading, setSubscriptionLoading] = useState(false);
    const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
    const [isCancellingSubscription, setIsCancellingSubscription] = useState(false);
    
    // Live Dashboard / Gamification stats
    const [dashboardStats, setDashboardStats] = useState({ classesAttended: 0, hoursPracticed: 0, streak: 0, joinDate: '' });
    const [pastClasses, setPastClasses] = useState<any[]>([]);
    const [upcomingClasses, setUpcomingClasses] = useState<any[]>([]);
    const [savedAsanas, setSavedAsanas] = useState<any[]>([]);
    
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    };

    const formatTimestampDate = (value: any) => {
        if (!value) return 'N/A';
        const date = value?.toDate?.();
        if (date instanceof Date && !Number.isNaN(date.getTime())) {
            return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        }
        if (typeof value === 'string') {
            return formatDate(value);
        }
        return 'N/A';
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!user?.id) return;
            try {
                const token = await getToken();
                const [resDash, resSaved] = await Promise.all([
                   fetch('/api/user/dashboard', { headers: { 'Authorization': `Bearer ${token}` } }),
                   fetch('/api/user/saved-asanas', { headers: { 'Authorization': `Bearer ${token}` } })
                ]);
                
                if (resDash.ok) {
                    const data = await resDash.json();
                    setDashboardStats(data.stats || { classesAttended: 0, hoursPracticed: 0, streak: 0, joinDate: '' });
                    setPastClasses(data.pastClasses || []);
                    setUpcomingClasses(data.upcomingClasses || []);
                }
                if (resSaved.ok) {
                    const data = await resSaved.json();
                    const mapped = (data.savedAsanas || []).map((saved: any) => ({
                        id: saved.id,
                        asanaId: saved.asanaId,
                        name: saved.Asana?.sanskritName || 'Unknown Asana',
                        englishName: saved.Asana?.englishName || 'Unknown',
                        level: saved.Asana?.difficulty || 'All Levels',
                        duration: '1-3 mins',
                        image: saved.Asana?.imageUrl || 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800'
                    }));
                    setSavedAsanas(mapped);
                }
            } catch (err) {
                console.error('Failed to grab dashboard stats:', err);
            }
        };
        fetchDashboardData();
    }, [user?.id, getToken]);

    useEffect(() => {
        if (activeTab !== 'subscription') return;
        if (!user?.id) {
            setSubscription(null);
            setSubscriptionError(null);
            setSubscriptionLoading(false);
            return;
        }

        const fetchSubscription = async () => {
            setSubscriptionLoading(true);
            setSubscriptionError(null);
            try {
                const token = await getToken();
                const res = await fetch('/api/subscriptions', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Failed to load subscription');
                const data = await res.json();
                setSubscription(data);
            } catch (error: any) {
                console.error('Error loading subscription:', error);
                setSubscriptionError(error?.message || 'Failed to load subscription.');
            } finally {
                setSubscriptionLoading(false);
            }
        };

        fetchSubscription();
    }, [activeTab, user?.id, getToken]);

    const handleLogout = () => {
        logout();
        onBack();
    };

    const readJson = async (resp: Response) => {
        const text = await resp.text();
        if (!text) return {};
        try {
            return JSON.parse(text);
        } catch {
            return { __raw: text };
        }
    };

    const cancelSubscription = async () => {
        const subId = subscription?.razorpaySubId || subscription?.razorpaySubscriptionId;
        if (!user?.id || !subId || typeof subId !== 'string') return;
        if (isCancellingSubscription) return;
        const ok = window.confirm('Cancel your subscription at the end of the current billing period?');
        if (!ok) return;

        setIsCancellingSubscription(true);
        try {
            const token = await getToken();
            const resp = await fetch('/api/razorpay?action=cancel-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscriptionId: subId, cancelAtCycleEnd: true }),
            });
            const data: any = await readJson(resp);
            if (!resp.ok || !data?.ok) {
                throw new Error(data?.error || 'Failed to cancel subscription');
            }

            // Persistence: Tell backend to update status to CANCELLED locally too
            await fetch('/api/subscriptions', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: 'CANCELLED' })
            });

            // Update local state
            setSubscription((prev: any) => ({ ...prev, status: 'CANCELLED' }));
            alert('Your subscription will be cancelled at the end of the current billing cycle.');
        } catch (e: any) {
            alert(e?.message || 'Failed to cancel subscription.');
        } finally {
            setIsCancellingSubscription(false);
        }
    };

    const tabs: { id: TabType; label: string; icon: React.FC<any> }[] = [
        { id: 'profile', label: 'My Profile', icon: User },
        { id: 'asanas', label: 'Saved Asanas', icon: Heart },
        { id: 'classes', label: 'My Classes', icon: Calendar },
        { id: 'subscription', label: 'Subscription', icon: CreditCard },
    ];



    return (
        <div className="min-h-screen bg-slate-50 pt-32 pb-24">
            <div className="max-w-7xl mx-auto px-6 md:px-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 mb-4 tracking-tight">
                            Welcome back, {user?.name?.split(' ')[0] || 'Yogi'}
                        </h1>
                        <p className="text-lg text-slate-600">
                            Continue your journey to mindfulness and strength.
                        </p>
                    </div>
                    <Button variant="outline" onClick={onBack} className="rounded-full shrink-0">
                        Back to Home
                    </Button>
                </div>

                <div className="flex flex-col lg:flex-row gap-10">
                    {/* Sidebar Navigation */}
                    <div className="lg:w-1/4">
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 sticky top-32">
                            <nav className="space-y-2">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    const isActive = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 font-medium ${isActive
                                                    ? 'bg-teal-600 text-white shadow-md transform scale-[1.02]'
                                                    : 'text-slate-600 hover:bg-slate-50 hover:text-teal-600'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Icon size={20} className={isActive ? 'text-teal-100' : 'text-slate-400'} />
                                                {tab.label}
                                            </div>
                                            {isActive && <ChevronRight size={18} />}
                                        </button>
                                    );
                                })}
                            </nav>

                            <div className="mt-8 pt-6 border-t border-slate-100 space-y-2">
                                {isAdmin && !isAdminChecking && onNavAdmin && (
                                    <button
                                        onClick={onNavAdmin}
                                        className="w-full flex items-center gap-3 p-4 text-slate-600 hover:bg-slate-50 hover:text-teal-600 rounded-2xl transition-colors font-medium"
                                    >
                                        <Shield size={20} />
                                        Admin Dashboard
                                    </button>
                                )}
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 p-4 text-red-600 hover:bg-red-50 rounded-2xl transition-colors font-medium"
                                >
                                    <LogOut size={20} />
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:w-3/4">
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 min-h-[600px] animate-fade-in-up">

                            {/* Profile Tab */}
                            {activeTab === 'profile' && (
                                <div className="space-y-8">
                                    <div>
                                        <h2 className="text-2xl font-serif font-bold text-slate-900 mb-2">My Profile</h2>
                                        <p className="text-slate-500">Manage your personal information and preferences.</p>
                                    </div>

                                    <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="w-24 h-24 bg-teal-600 rounded-full flex items-center justify-center text-white font-bold text-4xl shadow-lg">
                                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900">{user?.name || 'Yoga Student'}</h3>
                                            <p className="text-slate-500 mb-2">{user?.email || 'N/A'}</p>
                                            <span className="inline-flex py-1 px-3 bg-teal-100 text-teal-800 rounded-full text-xs font-bold tracking-wide uppercase">
                                                {user?.plan || 'Free Plan'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="p-6 border border-slate-100 rounded-2xl">
                                            <h4 className="font-bold text-slate-900 mb-4">Account Details</h4>
                                            <div className="space-y-4">
                                                <div>
                                                    <p className="text-sm text-slate-500 mb-1">Full Name</p>
                                                    <p className="font-medium text-slate-900">{user?.name || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-slate-500 mb-1">Email Address</p>
                                                    <p className="font-medium text-slate-900">{user?.email || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-slate-500 mb-1">Member Since</p>
                                                    <p className="font-medium text-slate-900">{formatDate(dashboardStats?.joinDate || user?.joinDate)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-6 border border-slate-100 rounded-2xl">
                                            <h4 className="font-bold text-slate-900 mb-4">Practice Stats</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-teal-50 p-4 rounded-xl text-center">
                                                    <p className="text-3xl font-serif font-bold text-teal-600 mb-1">{dashboardStats.classesAttended}</p>
                                                    <p className="text-xs text-slate-600 font-medium uppercase tracking-wider">Classes Attended</p>
                                                </div>
                                                <div className="bg-indigo-50 p-4 rounded-xl text-center">
                                                    <p className="text-3xl font-serif font-bold text-indigo-600 mb-1">{dashboardStats.hoursPracticed}</p>
                                                    <p className="text-xs text-slate-600 font-medium uppercase tracking-wider">Hours Practiced</p>
                                                </div>
                                                <div className="bg-rose-50 p-4 rounded-xl text-center col-span-2">
                                                    <p className="text-3xl font-serif font-bold text-rose-600 mb-1">{dashboardStats.streak}</p>
                                                    <p className="text-xs text-slate-600 font-medium uppercase tracking-wider">Current Streak (Days)</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Asanas Tab */}
                            {activeTab === 'asanas' && (
                                <div className="space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-2xl font-serif font-bold text-slate-900 mb-2">Saved Asanas</h2>
                                            <p className="text-slate-500">Your personalized library of favored poses.</p>
                                        </div>
                                        <Button variant="outline" size="sm" className="rounded-full">
                                            Browse More
                                        </Button>
                                    </div>

                                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {savedAsanas.map((asana) => (
                                            <div key={asana.id} className="group rounded-2xl overflow-hidden border border-slate-100 hover:shadow-xl transition-all duration-300">
                                                <div className="relative h-48 overflow-hidden">
                                                    <img
                                                        src={asana.image}
                                                        alt={asana.name}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                    />
                                                    <div className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-rose-500 cursor-pointer shadow-sm">
                                                        <Heart size={16} fill="currentColor" />
                                                    </div>
                                                    <div className="absolute bottom-3 left-3 flex gap-2">
                                                        <span className="px-2 py-1 bg-white/90 backdrop-blur-sm text-slate-900 text-[10px] font-bold uppercase tracking-wider rounded-md">
                                                            {asana.level}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="p-5">
                                                    <h3 className="font-serif font-bold text-lg text-slate-900 mb-1">{asana.name}</h3>
                                                    <p className="text-sm text-slate-500 mb-4">{asana.englishName}</p>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-1 text-slate-400 text-sm">
                                                            <Clock size={14} />
                                                            <span>{asana.duration}</span>
                                                        </div>
                                                        <button className="text-teal-600 hover:text-teal-700 font-medium text-sm flex items-center gap-1">
                                                            View Details <ChevronRight size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Classes Tab */}
                            {activeTab === 'classes' && (
                                <div className="space-y-10">
                                    <div>
                                        <h2 className="text-2xl font-serif font-bold text-slate-900 mb-2">My Classes</h2>
                                        <p className="text-slate-500">Manage your schedule and view past sessions.</p>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                            <Calendar size={20} className="text-teal-600" /> Upcoming Classes
                                        </h3>
                                        <div className="space-y-4">
                                            {upcomingClasses.length > 0 ? upcomingClasses.map((cls) => (
                                                <div key={cls.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border border-slate-100 bg-white hover:border-teal-200 hover:shadow-md transition-all gap-4">
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 shrink-0 mt-1">
                                                            {cls.type === 'Live Virtual' ? <Video size={24} /> : <MapPin size={24} />}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-slate-900 text-lg">{cls.title}</h4>
                                                            <p className="text-slate-500 text-sm mb-2">with {cls.instructor}</p>
                                                            <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-600">
                                                                <span className="bg-slate-100 px-2 py-1 rounded-md">{cls.date}</span>
                                                                <span className="flex items-center gap-1"><Clock size={14} /> {cls.duration}</span>
                                                                <span className="text-teal-600">{cls.type}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-3 sm:flex-col lg:flex-row w-full sm:w-auto mt-2 sm:mt-0">
                                                        <Button variant="outline" size="sm" className="w-full sm:w-auto rounded-full">Reschedule</Button>
                                                        <Button variant="primary" size="sm" className="w-full sm:w-auto rounded-full">Join Room</Button>
                                                    </div>
                                                </div>
                                            )) : (
                                                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 text-slate-500">
                                                    <p>No upcoming classes scheduled.</p>
                                                    <Button variant="outline" size="sm" className="mt-4 rounded-full" onClick={() => {
                                                        onBack();
                                                        setTimeout(() => {
                                                            document.getElementById('classes')?.scrollIntoView({ behavior: 'smooth' });
                                                        }, 100);
                                                    }}>
                                                        Browse Schedule
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                            <CheckCircle2 size={20} className="text-slate-400" /> Past Classes
                                        </h3>
                                        <div className="space-y-3">
                                            {pastClasses.length > 0 ? pastClasses.map((cls) => (
                                                <div key={cls.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 shrink-0">
                                                            <PlayCircle size={20} />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-slate-800">{cls.title}</h4>
                                                            <p className="text-slate-500 text-xs">{cls.date} • {cls.instructor}</p>
                                                        </div>
                                                    </div>
                                                    <button className="text-teal-600 text-sm font-medium hover:underline">Watch Recording</button>
                                                </div>
                                            )) : (
                                                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 text-slate-500">
                                                    <p>No past classes yet. Start your journey today!</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Subscription Tab */}
                            {activeTab === 'subscription' && (
                                <div className="space-y-8">
                                    <div>
                                        <h2 className="text-2xl font-serif font-bold text-slate-900 mb-2">Subscription & Billing</h2>
                                        <p className="text-slate-500">Your current plan and billing status.</p>
                                    </div>

                                    {subscriptionLoading ? (
                                        <div className="p-10 bg-slate-50 rounded-3xl border border-slate-100 text-slate-600">
                                            Loading subscription...
                                        </div>
                                    ) : subscriptionError ? (
                                        <div className="p-10 bg-red-50 rounded-3xl border border-red-100 text-red-700">
                                            {subscriptionError}
                                        </div>
                                    ) : subscription ? (
                                        <div className="space-y-6">
                                            <div className="bg-gradient-to-br from-teal-600 to-teal-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                                                <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-400/20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4"></div>

                                                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                                                    <div>
                                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold tracking-wider uppercase mb-4">
                                                            {(subscription.status || 'unknown').toString()}
                                                        </div>
                                                        <h3 className="font-serif text-3xl font-bold mb-1">
                                                            {(subscription.planType || user?.plan || 'Subscription').toString()}
                                                        </h3>
                                                        {subscription.planFrequency && (
                                                            <p className="text-teal-100">
                                                                {(subscription.planFrequency || '').toString()}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="text-left md:text-right">
                                                        <p className="text-teal-100 text-sm mb-1">Current period ends</p>
                                                        <p className="text-xl font-bold">{formatTimestampDate(subscription.currentPeriodEnd)}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid md:grid-cols-2 gap-6">
                                                <div className="p-6 border border-slate-100 rounded-2xl">
                                                    <h4 className="font-bold text-slate-900 mb-4">Billing</h4>
                                                    <div className="space-y-3 text-sm">
                                                        <div className="flex items-center justify-between gap-4">
                                                            <span className="text-slate-500">Status</span>
                                                            <span className="font-medium text-slate-900">{(subscription.status || 'unknown').toString()}</span>
                                                        </div>
                                                        {(() => {
                                                            const chargeAt = typeof subscription.razorpayChargeAt === 'number' ? subscription.razorpayChargeAt : null;
                                                            const startAt = typeof subscription.razorpayStartAt === 'number' ? subscription.razorpayStartAt : null;
                                                            const nextCharge = chargeAt || startAt;
                                                            if (!nextCharge) return null;
                                                            return (
                                                                <div className="flex items-center justify-between gap-4">
                                                                    <span className="text-slate-500">Next autopay charge</span>
                                                                    <span className="font-medium text-slate-900">
                                                                        {new Date(nextCharge * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })()}
                                                        <div className="flex items-center justify-between gap-4">
                                                            <span className="text-slate-500">Last payment ID</span>
                                                            <span className="font-medium text-slate-900 truncate max-w-[220px]">{(subscription.paymentId || 'N/A').toString()}</span>
                                                        </div>
                                                    </div>
                                                    {(() => {
                                                        const status = (subscription.status || '').toString().toLowerCase();
                                                        const showCancel = Boolean(subscription.razorpaySubscriptionId) && !status.includes('cancel') && !status.includes('expire') && !status.includes('complete');
                                                        if (!showCancel) return null;
                                                        return (
                                                            <div className="mt-6">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="rounded-full w-full"
                                                                    disabled={isCancellingSubscription}
                                                                    onClick={cancelSubscription}
                                                                >
                                                                    {isCancellingSubscription ? 'Cancelling...' : 'Cancel Subscription'}
                                                                </Button>
                                                                <p className="text-xs text-slate-500 mt-2">
                                                                    Cancellation takes effect at the end of your current billing period.
                                                                </p>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>

                                                <div className="p-6 border border-slate-100 rounded-2xl">
                                                    <h4 className="font-bold text-slate-900 mb-4">Invoices</h4>
                                                    <p className="text-sm text-slate-500">
                                                        Billing history and payment method are available via the payment provider.
                                                    </p>
                                                </div>
                                            </div>

                                            {(() => {
                                                const plan = (subscription.planType || user?.plan || '').toString().toLowerCase();
                                                if (!plan.includes('monthly') || plan.includes('full course')) return null;
                                                return (
                                                    <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                                        <div>
                                                            <p className="font-bold text-slate-900">Upgrade to Full Course</p>
                                                            <p className="text-sm text-slate-500">Get the complete 6-month program with a one-time payment.</p>
                                                        </div>
                                                        <Button
                                                            variant="primary"
                                                            className="rounded-full"
                                                            onClick={() => {
                                                                onBack();
                                                                setTimeout(() => {
                                                                    const el = document.getElementById('pricing');
                                                                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                                                                }, 150);
                                                            }}
                                                        >
                                                            Upgrade Now
                                                        </Button>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    ) : (
                                        <div className="p-10 bg-slate-50 rounded-3xl border border-slate-100 text-slate-700">
                                            <p className="font-bold mb-2">No active subscription found.</p>
                                            <p className="text-sm text-slate-500 mb-6">
                                                Subscribe from the Pricing section to unlock full access.
                                            </p>
                                            <Button
                                                variant="primary"
                                                className="rounded-full"
                                                onClick={() => {
                                                    onBack();
                                                    setTimeout(() => {
                                                        const el = document.getElementById('pricing');
                                                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                                                    }, 150);
                                                }}
                                            >
                                                View Pricing
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
