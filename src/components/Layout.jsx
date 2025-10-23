//This is the structed Layout of the website.
import React, { useState} from 'react';
import { 
  Link, 
  NavLink, 
  useLocation, 
  useNavigation, 
  Outlet
} from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'; //UI for Animations
import { Fragment } from 'react'; //Wrapper in React to avoid extra nodes.
import { Transition } from '@headlessui/react'; //Animations for the Mobile Menu.
import { 
  HomeIcon, 
  UserIcon, 
  BriefcaseIcon, 
  EnvelopeIcon, 
  DocumentTextIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline'; //Icons from Heroicons library.
import { FaGithub, FaLinkedin, FaXTwitter} from 'react-icons/fa6'; //Icons from the Headles UI Library.

//Layout Component illustrates the whole idea to make the app structured.
const Layout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); 
  const navigation = useNavigation();
  const location = useLocation();

  const navigationItems = [
{ name: 'Home', to: '/', icon: HomeIcon, className: 'text-green-900' },
{ name: 'About', to: '/about', icon: UserIcon, className: 'text-green-900' },
{ name: 'Projects', to: '/projects', icon: BriefcaseIcon, className: 'text-green-900' },
{ name: 'Blog', to: '/blog', icon: DocumentTextIcon, className: 'text-green-900' },
{ name: 'Contact', to: '/contact', icon: EnvelopeIcon, className: 'text-green-900' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
          <Link to="/" className="flex items-center  space-x-3 text-2xl font-serif  font-bold text-green-900">
  <span>My Portfolio</span>
</Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden sm:flex sm:space-x-8">
              {navigationItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.to}
                  className={({ isActive }) =>
                    `inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 ${
                      isActive
                        ? 'border-blue-500 text-green-900'
                        : 'border-transparent text-gray-500 hover:text-green-700 hover:border-gray-300'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.name}
                </NavLink>
              ))}
            </div>

            {/* Mobile menu button */}
            <div className="sm:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-green-900 hover:text-gray-500 hover:bg-gray-100"
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="block h-6 w-6" />
                ) : (
                  <Bars3Icon className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <Transition
          show={mobileMenuOpen}
          as={Fragment}
          enter="transition ease-out duration-200"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <div className="sm:hidden">
            <div className="pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `block pl-3 pr-4 py-2 text-base font-medium ${
                      isActive
                        ? 'bg-blue-50 border-r-4 border-blue-500 text-blue-700'
                        : 'text-green-900 hover:text-gray-700 hover:bg-gray-50'
                    }`
                  }
                >
                  <div className="flex items-center">
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </div>
                </NavLink>
              ))}
            </div>
          </div>
        </Transition>
      </nav>

      {/* Loading Bar */}
      {navigation.state === 'loading' && (
        <div className="w-full bg-gray-200 h-1">
          <motion.div 
            className="bg-blue-600 h-1" 
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.5 }}
          />
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-white-900 text-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex flex-col items-start space-y-2">
                <Link to="/" className="text-pink-600 hover:text-pink-400">
            <img 
              src="./src/assets/Bulldog1.png" 
              alt="Logo" 
              className="w-6 h-6 object-contain hover:opacity-80 transition-opacity"
            />
          </Link>
              </div>
              <h3 className="text-lg font-semibold mb-4"></h3>
              <p className="text-gray-900">
               I'm currently focused on expanding my experience designing 
               and developing high performing systems.
              </p>
            </div>
            <div>
              <h3 className="text-lg text-gray-900 font-bold mb-4">Quick Links</h3>
              <div className="space-y-2">
                {navigationItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.to}
                    className="block text-gray-900 hover:text-blue-600 transition-colors"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Connect</h3>
              <div className="flex space-x-4">
                <a href="https://github.com/Adamsomondi"target="_blank"
  rel="noopener noreferrer" className="text-gray-900 hover:text-blue-600"><FaGithub className="w-5 h-5" />
    <span>GitHub</span></a>
                <a href="https://www.linkedin.com/in/adams-omondi-338b94304?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app"target="_blank"
  rel="noopener noreferrer" className="text-gray-900 hover:text-blue-600"> <FaLinkedin className="w-5 h-5" />
    <span>LinkedIn</span></a>
                <a href="https://x.com/deepneuralmess?t=KSiZQak-6eJCGLcEC6O4fA&s=08" target="_blank"
  rel="noopener noreferrer"className="text-gray-900 hover:text-blue-600"><FaXTwitter className="w-5 h-5" />
    <span>Twitter</span></a>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-600 text-center text-gray-900">
            <p>Made with ❤️ by Adams.</p>
              <p>&copy; 2025 Adams. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default Layout;