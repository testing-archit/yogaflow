import React from 'react';
import { ArrowLeft, FileText, Shield, CreditCard, Users, Lock, AlertTriangle, Scale, Mail, Phone, MapPin } from 'lucide-react';
import { Reveal } from './Reveal';
import { Button } from './Button';

interface TermsConditionsProps {
  onBack: () => void;
}

export const TermsConditions: React.FC<TermsConditionsProps> = ({ onBack }) => {
  return (
    <div className="bg-white min-h-screen pt-32 pb-24 px-6">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-teal-600 font-bold uppercase tracking-widest text-xs mb-12 hover:gap-3 transition-all"
        >
          <ArrowLeft size={16} /> Back to Home
        </button>

        <Reveal>
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-teal-50 rounded-2xl">
              <FileText className="text-teal-600" size={32} />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 mb-2">Terms & Conditions</h1>
              <p className="text-slate-500 text-sm">Last updated: December 2, 2025</p>
            </div>
          </div>
        </Reveal>

        <div className="space-y-12 mt-16">
          {/* Section 1 */}
          <Reveal delay={0.1}>
            <div className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-3">
                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-600 font-bold text-sm">1</div>
                1. Agreement to Terms
              </h2>
              <p className="text-slate-600 leading-relaxed">
                By accessing or using Yoga Flow's website, mobile application, or services, you agree to be bound by these Terms and Conditions. If you disagree with any part of these terms, you may not access our services.
              </p>
            </div>
          </Reveal>

          {/* Section 2 */}
          <Reveal delay={0.2}>
            <div className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-3">
                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-600 font-bold text-sm">2</div>
                2. Description of Services
              </h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Yoga Flow provides online yoga classes, including:
              </p>
              <ul className="space-y-2 ml-6">
                {[
                  'Live streaming yoga sessions from Rishikesh-based instructors',
                  'Access to recorded yoga classes and tutorials',
                  'Personalized yoga practice recommendations',
                  'Community features and interaction with instructors',
                  'Progress tracking and wellness resources'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-2 shrink-0"></div>
                    <span className="text-slate-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* Section 3 */}
          <Reveal delay={0.3}>
            <div className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-3">
                <Users className="text-teal-600" size={24} />
                3. User Accounts
              </h2>
              
              <div className="space-y-4 ml-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">3.1 Account Registration</h3>
                  <p className="text-slate-600 leading-relaxed">
                    To access certain features, you must register for an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">3.2 Account Security</h3>
                  <p className="text-slate-600 leading-relaxed">
                    You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must immediately notify us of any unauthorized use of your account.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">3.3 Eligibility</h3>
                  <p className="text-slate-600 leading-relaxed">
                    You must be at least 18 years old to create an account. By creating an account, you represent that you are of legal age to form a binding contract.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Section 4 */}
          <Reveal delay={0.4}>
            <div className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-3">
                <CreditCard className="text-teal-600" size={24} />
                4. Subscription and Payment
              </h2>
              
              <div className="space-y-4 ml-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">4.1 Subscription Plans</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Yoga Flow offers various subscription plans. For India-based users, the monthly plan is ₹999 per month. Other plans and regional pricing are available. Your subscription automatically renews unless cancelled before the renewal date.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">4.2 Payment Processing</h3>
                  <p className="text-slate-600 leading-relaxed">
                    All payments are processed securely through Razorpay. By providing payment information, you authorize us to charge the applicable fees to your payment method.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">4.3 Free Trial</h3>
                  <p className="text-slate-600 leading-relaxed">
                    We may offer a free trial period. If you do not cancel before the trial ends, you will be automatically charged for the subscription.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">4.4 Cancellation</h3>
                  <p className="text-slate-600 leading-relaxed">
                    You may cancel your subscription at any time. Cancellation will take effect at the end of your current billing period. No refunds will be provided for partial months.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">4.5 Refund Policy</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Refunds are provided on a case-by-case basis within 7 days of payment for valid reasons such as technical issues preventing access to services. Contact our support team to request a refund.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Section 5 */}
          <Reveal delay={0.5}>
            <div className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-3">
                <Shield className="text-teal-600" size={24} />
                5. User Conduct
              </h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                You agree not to:
              </p>
              <ul className="space-y-2 ml-6">
                {[
                  'Use the services for any illegal purpose or in violation of any laws',
                  'Share your account credentials with others',
                  'Record, copy, or redistribute our content without permission',
                  'Attempt to hack, disrupt, or interfere with the platform',
                  'Harass, abuse, or harm other users or instructors',
                  'Upload viruses or malicious code',
                  'Use automated systems or bots to access the services',
                  'Impersonate any person or entity'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-2 shrink-0"></div>
                    <span className="text-slate-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* Section 6 */}
          <Reveal delay={0.6}>
            <div className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-3">
                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-600 font-bold text-sm">6</div>
                6. Intellectual Property
              </h2>
              <p className="text-slate-600 leading-relaxed">
                All content on Yoga Flow, including videos, images, text, graphics, logos, and software, is the property of Yoga Flow or its licensors and is protected by copyright, trademark, and other intellectual property laws.
              </p>
              <p className="text-slate-600 leading-relaxed">
                You may not reproduce, distribute, modify, create derivative works, publicly display, or exploit any of our content without our written permission.
              </p>
            </div>
          </Reveal>

          {/* Section 7 */}
          <Reveal delay={0.7}>
            <div className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-3">
                <AlertTriangle className="text-red-500" size={24} />
                7. Health and Safety Disclaimer
              </h2>
              <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-2xl">
                <p className="text-red-900 font-bold text-lg mb-4">IMPORTANT HEALTH NOTICE:</p>
                <ul className="space-y-3">
                  {[
                    'Yoga involves physical activity. Consult your physician before beginning any exercise program.',
                    'You participate at your own risk. Yoga Flow is not liable for any injuries sustained during practice.',
                    'Listen to your body and never force yourself into uncomfortable positions.',
                    'Our instructors provide guidance, but you are responsible for your own safety.',
                    'If you have any medical conditions, inform your instructor before class.'
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0"></div>
                      <span className="text-red-800">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>

          {/* Section 8 */}
          <Reveal delay={0.8}>
            <div className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-3">
                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-600 font-bold text-sm">8</div>
                8. Limitation of Liability
              </h2>
              <p className="text-slate-600 leading-relaxed">
                To the maximum extent permitted by law, Yoga Flow shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.
              </p>
              <p className="text-slate-600 leading-relaxed">
                Our total liability shall not exceed the amount you paid us in the twelve (12) months prior to the event giving rise to the liability.
              </p>
            </div>
          </Reveal>

          {/* Section 9 */}
          <Reveal delay={0.9}>
            <div className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-3">
                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-600 font-bold text-sm">9</div>
                9. Service Availability
              </h2>
              <p className="text-slate-600 leading-relaxed">
                We strive to provide uninterrupted access to our services, but we do not guarantee that our services will be available at all times. We may suspend or discontinue services for maintenance, updates, or for any other reason without liability.
              </p>
            </div>
          </Reveal>

          {/* Section 10 */}
          <Reveal delay={1.0}>
            <div className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-3">
                <Lock className="text-teal-600" size={24} />
                10. Termination
              </h2>
              <p className="text-slate-600 leading-relaxed">
                We may terminate or suspend your account and access to our services immediately, without prior notice, if you breach these Terms. Upon termination, your right to use the services will immediately cease.
              </p>
              <p className="text-slate-600 leading-relaxed">
                You may terminate your account at any time by visiting our Account Deletion page.
              </p>
            </div>
          </Reveal>

          {/* Section 11 */}
          <Reveal delay={1.1}>
            <div className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-3">
                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-600 font-bold text-sm">11</div>
                11. Privacy
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Your use of our services is also governed by our Privacy Policy, which describes how we collect, use, and protect your personal information.
              </p>
            </div>
          </Reveal>

          {/* Section 12 */}
          <Reveal delay={1.2}>
            <div className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-3">
                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-600 font-bold text-sm">12</div>
                12. Changes to Terms
              </h2>
              <p className="text-slate-600 leading-relaxed">
                We reserve the right to modify these Terms at any time. We will notify you of any changes by posting the new Terms on this page and updating the "Last updated" date. Your continued use of the services after changes constitute acceptance of the new Terms.
              </p>
            </div>
          </Reveal>

          {/* Section 13 */}
          <Reveal delay={1.3}>
            <div className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-3">
                <Scale className="text-teal-600" size={24} />
                13. Governing Law
              </h2>
              <p className="text-slate-600 leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts in Rishikesh, Uttarakhand, India.
              </p>
            </div>
          </Reveal>

          {/* Section 14 */}
          <Reveal delay={1.4}>
            <div className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-3">
                <Mail className="text-teal-600" size={24} />
                14. Contact Information
              </h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                If you have any questions about these Terms, please contact us:
              </p>
              <div className="bg-slate-50 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="text-teal-600" size={18} />
                  <span className="text-slate-700">Email: <a href="mailto:support@yogaflow.com" className="text-teal-600 hover:text-teal-700 font-medium">support@yogaflow.com</a></span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="text-teal-600" size={18} />
                  <span className="text-slate-700">Address: Rishikesh, Uttarakhand, India</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="text-teal-600" size={18} />
                  <span className="text-slate-700">Phone: <a href="tel:+917579471957" className="text-teal-600 hover:text-teal-700 font-medium">+91 7579471957</a></span>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Section 15 */}
          <Reveal delay={1.5}>
            <div className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-3">
                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-600 font-bold text-sm">15</div>
                15. Severability
              </h2>
              <p className="text-slate-600 leading-relaxed">
                If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary so that these Terms will otherwise remain in full force and effect.
              </p>
            </div>
          </Reveal>

          {/* Section 16 */}
          <Reveal delay={1.6}>
            <div className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-3">
                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-600 font-bold text-sm">16</div>
                16. Entire Agreement
              </h2>
              <p className="text-slate-600 leading-relaxed">
                These Terms, together with our Privacy Policy, constitute the entire agreement between you and Yoga Flow regarding the use of our services and supersede all prior agreements and understandings.
              </p>
            </div>
          </Reveal>

          {/* Action Buttons */}
          <Reveal delay={1.7}>
            <div className="pt-12 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={onBack}
                variant="outline"
                className="rounded-full"
              >
                Back to Home
              </Button>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
};
