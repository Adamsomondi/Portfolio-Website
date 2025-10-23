
import { 
  useActionData, 
  useNavigation, 
  Form
} from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaGithub, FaLinkedin, FaXTwitter } from 'react-icons/fa6';


// Simulate API delays
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Action
export const contactAction = async ({ request }) => {
  await delay(1000);
  const formData = await request.formData();
  const contactData = {
    name: formData.get('name'),
    email: formData.get('email'),
    message: formData.get('message')
  };
  
  // Simulate form validation
  if (!contactData.name || !contactData.email || !contactData.message) {
    return { error: 'All fields are required' };
  }
  
  // Simulate successful submission
  console.log('Contact form submitted:', contactData);
  return { success: 'Message sent successfully!' };
};



const ContactPage = () => {
  const navigation = useNavigation();
  const actionData = useActionData();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <div className="py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Get In Touch</h1>
          <p className="text-xl text-gray-600">
            If you want to know more about me or my work,
             or if you would just like to say hello, send me a message.
             I'd love to hear from you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl font-semibold mb-6">Let's Connect</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Email</h3>
                <p className="text-gray-600">Adamsnogo025@gmail.com</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Phone</h3>
                <p className="text-gray-600">+254715485763</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Location</h3>
                <p className="text-gray-600">Nairobi, Kenya</p>
              </div>
            </div>
            
            <div className="mt-8">
              <h3 className="font-medium text-gray-900 mb-4">Follow Me</h3>
              <div className="flex space-x-4">
                <a href="https://github.com/Adamsomondi" target="_blank"
  rel="noopener noreferrer"className="text-blue-600 hover:text-blue-800"> <FaGithub className="w-5 h-5" />
    <span>GitHub</span></a>
                <a href="https://www.linkedin.com/in/adams-omondi-338b94304?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app"target="_blank"
  rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800"> <FaLinkedin className="w-5 h-5" />
    <span>LinkedIn</span></a>
                <a href="https://x.com/deepneuralmess?t=KSiZQak-6eJCGLcEC6O4fA&s=08"target="_blank"
  rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800"><FaXTwitter className="w-5 h-5" />
    <span>Twitter</span></a>
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Form method="post" className="space-y-6">
              {actionData?.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600">{actionData.error}</p>
                </div>
              )}
              
              {actionData?.success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-600">{actionData.success}</p>
                </div>
              )}

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tell me about your project or just say hello..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </span>
                ) : (
                  'Send Message'
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