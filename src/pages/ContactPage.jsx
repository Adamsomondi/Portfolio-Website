import {
  useActionData,
  useNavigation,
  Form,
  useOutletContext
} from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaGithub, FaLinkedin, FaXTwitter } from 'react-icons/fa6';
import { api } from '../lib/api';

// ── Action ────────────────────────────────────────────────────────────────────
export const contactAction = async ({ request }) => {
  const formData = await request.formData();
  const data = {
    name:    formData.get('name'),
    email:   formData.get('email'),
    message: formData.get('message')
  };

  if (!data.name || !data.email || !data.message) {
    return { error: 'All fields are required' };
  }

  const result = await api.sendContact(data);

  if (result.success) {
    return { success: "Message sent! I'll get back to you within 24–48 hours." };
  }

  return { error: result.error || 'Something went wrong. Please try again.' };
};

// ── Component ─────────────────────────────────────────────────────────────────
const ContactPage = () => {
  const { isDark }    = useOutletContext();
  const navigation    = useNavigation();
  const actionData    = useActionData();
  const isSubmitting  = navigation.state === 'submitting';

  const inputClass = `w-full px-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
    isDark
      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
  }`;

  return (
    <div className="py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className={`text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Get In Touch
          </h1>
          <p className={`text-xl max-w-2xl mx-auto ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Have a project in mind, a role to fill, or just want to talk tech?
            Send me a message — I read every one.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* Left — Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className={`text-2xl font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Contact Details
            </h2>

            <div className="space-y-5">
              {[
                { label: 'Email',    value: 'Adamsnogo025@gmail.com', href: 'mailto:Adamsnogo025@gmail.com' },
                { label: 'Phone',    value: '+254 715 485 763',       href: 'tel:+254715485763' },
                { label: 'Location', value: 'Nairobi, Kenya',         href: null }
              ].map(({ label, value, href }) => (
                <div key={label}>
                  <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    {label}
                  </p>
                  {href ? (
                    <a
                      href={href}
                      className={`font-medium transition-colors ${
                        isDark
                          ? 'text-white hover:text-blue-400'
                          : 'text-gray-900 hover:text-blue-600'
                      }`}
                    >
                      {value}
                    </a>
                  ) : (
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {value}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className={`mt-8 pt-8 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <p className={`text-xs font-semibold uppercase tracking-wider mb-4 ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`}>
                Find Me Online
              </p>
              <div className="flex flex-col space-y-3">
                {[
                  { icon: FaGithub,   label: 'GitHub',   href: 'https://github.com/Adamsomondi' },
                  { icon: FaLinkedin, label: 'LinkedIn',  href: 'https://www.linkedin.com/in/adams-omondi-338b94304' },
                  { icon: FaXTwitter, label: 'Twitter',   href: 'https://x.com/deepneuralmess' }
                ].map(({ icon: Icon, label, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-3 font-medium transition-colors w-fit ${
                      isDark
                        ? 'text-gray-300 hover:text-white'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{label}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Response time note */}
            <div className={`mt-8 p-4 rounded-xl border ${
              isDark
                ? 'bg-blue-900/20 border-blue-800/40 text-blue-300'
                : 'bg-blue-50 border-blue-100 text-blue-700'
            }`}>
              <p className="text-sm font-medium">
                ⚡ Typical response time: 24–48 hours
              </p>
            </div>
          </motion.div>

          {/* Right — Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Form method="post" className="space-y-5">

              {/* Error */}
              {actionData?.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600 text-sm font-medium">{actionData.error}</p>
                </div>
              )}

              {/* Success */}
              {actionData?.success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-700 text-sm font-medium">{actionData.success}</p>
                </div>
              )}

              <div>
                <label htmlFor="name" className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className={inputClass}
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label htmlFor="email" className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className={inputClass}
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label htmlFor="message" className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  required
                  className={inputClass}
                  placeholder="Tell me about the project, the role, or just say hello..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || actionData?.success}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                  isDark
                    ? 'bg-white text-black hover:bg-gray-100'
                    : 'bg-gray-900 text-white hover:bg-gray-700'
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </span>
                ) : actionData?.success ? (
                  '✓ Message Sent'
                ) : (
                  'Send Message →'
                )}
              </button>
            </Form>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default ContactPage;