import React from 'react';
import { ArrowLeft, Shield, Lock, Eye, Trash2, Mail, Phone, MapPin } from 'lucide-react';
import { Reveal } from './Reveal';
import { Button } from './Button';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
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
              <Shield className="text-teal-600" size={32} />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 mb-2">Privacy Policy</h1>
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
                1. Introduction
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Welcome to Yoga Flow. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our website or use our mobile application and tell you about your privacy rights and how the law protects you.
              </p>
            </div>
          </Reveal>

          {/* Section 2 */}
          <Reveal delay={0.2}>
            <div className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-3">
                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-600 font-bold text-sm">2</div>
                2. Information We Collect
              </h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                We may collect, use, store and transfer different kinds of personal data about you:
              </p>
              <ul className="space-y-3 ml-6">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-2 shrink-0"></div>
                  <div>
                    <span className="font-semibold text-slate-900">Identity Data:</span> First name, last name, username or similar identifier
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-2 shrink-0"></div>
                  <div>
                    <span className="font-semibold text-slate-900">Contact Data:</span> Email address, phone number, and billing address
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-2 shrink-0"></div>
                  <div>
                    <span className="font-semibold text-slate-900">Financial Data:</span> Payment card details (processed securely through Razorpay)
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-2 shrink-0"></div>
                  <div>
                    <span className="font-semibold text-slate-900">Transaction Data:</span> Details about payments and subscriptions
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-2 shrink-0"></div>
                  <div>
                    <span className="font-semibold text-slate-900">Technical Data:</span> IP address, browser type, device information, and usage data
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-2 shrink-0"></div>
                  <div>
                    <span className="font-semibold text-slate-900">Profile Data:</span> Your preferences, yoga practice level, and class bookings
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-2 shrink-0"></div>
                  <div>
                    <span className="font-semibold text-slate-900">Usage Data:</span> Information about how you use our website and services
                  </div>
                </li>
              </ul>
            </div>
          </Reveal>

          {/* Section 3 */}
          <Reveal delay={0.3}>
            <div className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-3">
                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-600 font-bold text-sm">3</div>
                3. How We Use Your Information
              </h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                We use your personal data for the following purposes:
              </p>
              <ul className="space-y-2 ml-6">
                {[
                  'To register you as a new user and manage your account',
                  'To process and deliver your subscription services',
                  'To manage payments, fees, and charges',
                  'To provide you with access to live and recorded yoga classes',
                  'To communicate with you about your account and services',
                  'To send you marketing communications (with your consent)',
                  'To improve our website and services',
                  'To ensure the security of our platform'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-2 shrink-0"></div>
                    <span className="text-slate-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* Section 4 */}
          <Reveal delay={0.4}>
            <div className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-3">
                <Lock className="text-teal-600" size={24} />
                4. Data Security
              </h2>
              <p className="text-slate-600 leading-relaxed">
                We have implemented appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way. We limit access to your personal data to those employees, agents, contractors, and other third parties who have a business need to know.
              </p>
              <p className="text-slate-600 leading-relaxed">
                Payment information is processed securely through Razorpay, a PCI DSS compliant payment gateway. We do not store your complete credit card information on our servers.
              </p>
            </div>
          </Reveal>

          {/* Section 5 */}
          <Reveal delay={0.5}>
            <div className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-3">
                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-600 font-bold text-sm">5</div>
                5. Data Retention
              </h2>
              <p className="text-slate-600 leading-relaxed">
                We will only retain your personal data for as long as necessary to fulfill the purposes we collected it for, including for the purposes of satisfying any legal, accounting, or reporting requirements.
              </p>
              <p className="text-slate-600 leading-relaxed">
                When you request account deletion, we will delete or anonymize your personal data within 30 days, except where we are required to retain certain information for legal or regulatory purposes.
              </p>
            </div>
          </Reveal>

          {/* Section 6 */}
          <Reveal delay={0.6}>
            <div className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-3">
                <Eye className="text-teal-600" size={24} />
                6. Your Legal Rights
              </h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Under certain circumstances, you have rights under data protection laws in relation to your personal data:
              </p>
              <ul className="space-y-2 ml-6">
                {[
                  'Right to access: Request access to your personal data',
                  'Right to correction: Request correction of inaccurate data',
                  'Right to erasure: Request deletion of your personal data',
                  'Right to object: Object to processing of your personal data',
                  'Right to data portability: Request transfer of your data',
                  'Right to withdraw consent: Withdraw consent at any time'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-2 shrink-0"></div>
                    <span className="text-slate-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* Section 7 */}
          <Reveal delay={0.7}>
            <div className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-3">
                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-600 font-bold text-sm">7</div>
                7. Third-Party Services
              </h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                We use third-party services to help us operate our business:
              </p>
              <ul className="space-y-2 ml-6">
                {[
                  'Razorpay: Payment processing',
                  'Analytics Services: To understand how users interact with our platform',
                  'Email Services: To send you communications',
                  'Cloud Hosting: To store and process data'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-2 shrink-0"></div>
                    <span className="text-slate-600">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-slate-600 leading-relaxed mt-4">
                These third parties have access to your personal data only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose.
              </p>
            </div>
          </Reveal>

          {/* Section 8 */}
          <Reveal delay={0.8}>
            <div className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-3">
                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-600 font-bold text-sm">8</div>
                8. Cookies
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Our website uses cookies to distinguish you from other users. This helps us provide you with a good experience when you browse our website and allows us to improve our site. You can set your browser to refuse all or some cookies, or to alert you when websites set or access cookies.
              </p>
            </div>
          </Reveal>

          {/* Section 9 */}
          <Reveal delay={0.9}>
            <div className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-3">
                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-600 font-bold text-sm">9</div>
                9. International Transfers
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Your information may be transferred to and maintained on computers located outside of your state, province, country, or other governmental jurisdiction where data protection laws may differ. We ensure appropriate safeguards are in place for such transfers.
              </p>
            </div>
          </Reveal>

          {/* Section 10 */}
          <Reveal delay={1.0}>
            <div className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-3">
                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-600 font-bold text-sm">10</div>
                10. Children's Privacy
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Our services are not intended for children under 18 years of age. We do not knowingly collect personal information from children under 18. If you are a parent or guardian and believe your child has provided us with personal data, please contact us.
              </p>
            </div>
          </Reveal>

          {/* Section 11 */}
          <Reveal delay={1.1}>
            <div className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-3">
                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-600 font-bold text-sm">11</div>
                11. Changes to This Policy
              </h2>
              <p className="text-slate-600 leading-relaxed">
                We may update this privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page and updating the "Last updated" date. You are advised to review this privacy policy periodically for any changes.
              </p>
            </div>
          </Reveal>

          {/* Section 12 */}
          <Reveal delay={1.2}>
            <div className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-3">
                <Mail className="text-teal-600" size={24} />
                12. Contact Us
              </h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                If you have any questions about this privacy policy or our data practices, please contact us:
              </p>
              <div className="bg-slate-50 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="text-teal-600" size={18} />
                  <span className="text-slate-700">Email: <a href="mailto:privacy@yogaflow.com" className="text-teal-600 hover:text-teal-700 font-medium">privacy@yogaflow.com</a></span>
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

          {/* Section 13 */}
          <Reveal delay={1.3}>
            <div className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-3">
                <Trash2 className="text-teal-600" size={24} />
                13. Account Deletion
              </h2>
              <p className="text-slate-600 leading-relaxed">
                If you wish to delete your account and all associated data, please visit our Account Deletion page.
              </p>
            </div>
          </Reveal>

          {/* Action Buttons */}
          <Reveal delay={1.4}>
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
