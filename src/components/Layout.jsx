
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

    <Link to="/" className="group flex items-center space-x-3 px-8 py-3 bg-gradient-to-r from-green-50/80 to-emerald-50/80 backdrop-blur-sm rounded-full border-2 border-transparent bg-clip-padding hover:shadow-2xl hover:scale-110 hover:-translate-y-1 transition-all duration-500 relative before:absolute before:inset-0 before:rounded-full before:p-[2px] before:bg-gradient-to-r before:from-green-400 before:via-emerald-500 before:to-green-600 before:-z-10">
  <span className="text-2xl font-serif font-bold text-green-900 group-hover:-translate-y-0.5 transition-transform duration-300">My Portfolio</span>
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
      <footer className="relative bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-20 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-75"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-150"></div>
      </div>

      <div className="relative max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="backdrop-blur-md bg-white/40 rounded-3xl shadow-2xl border border-white/50 p-8 md:p-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {/* Brand Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
              
              </div>
              <p className="text-gray-700 leading-relaxed text-sm">
                I'm currently focused on expanding my experience designing 
                and developing high performing systems.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-bold mb-6 text-gray-900">Quick Links</h3>
              <div className="space-y-3">
                {navigationItems.map((item) => (
                  <a
                    key={item.name}
                    href={item.to}
                    className="block text-gray-700 hover:text-purple-600 transition-all duration-300 hover:translate-x-2 font-medium"
                  >
                    {item.name}
                  </a>
                ))}
              </div>
            </div>

            {/* Connect Section */}
            <div>
              <h3 className="text-lg font-bold mb-6 text-gray-900">Connect</h3>
              <div className="space-y-4">
                <a 
                  href="https://github.com/Adamsomondi" 
                  target="_blank"
                  rel="noopener noreferrer" 
                  className="flex items-center space-x-3 text-gray-700 hover:text-gray-900 transition-all duration-300 group"
                >
                  <div className="w-10 h-10 bg-white/60 rounded-xl flex items-center justify-center group-hover:bg-purple-100 transition-all duration-300 shadow-md">
                    <FaGithub className="w-5 h-5" />
                  </div>
                  <span className="font-medium">GitHub</span>
                </a>
                <a 
                  href="https://www.linkedin.com/in/adams-omondi-338b94304" 
                  target="_blank"
                  rel="noopener noreferrer" 
                  className="flex items-center space-x-3 text-gray-700 hover:text-blue-600 transition-all duration-300 group"
                >
                  <div className="w-10 h-10 bg-white/60 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-all duration-300 shadow-md">
                    <FaLinkedin className="w-5 h-5" />
                  </div>
                  <span className="font-medium">LinkedIn</span>
                </a>
                <a 
                  href="https://x.com/deepneuralmess" 
                  target="_blank"
                  rel="noopener noreferrer" 
                  className="flex items-center space-x-3 text-gray-700 hover:text-gray-900 transition-all duration-300 group"
                >
                  <div className="w-10 h-10 bg-white/60 rounded-xl flex items-center justify-center group-hover:bg-gray-100 transition-all duration-300 shadow-md">
                    <FaXTwitter className="w-5 h-5" />
                  </div>
                  <span className="font-medium">Twitter</span>
                </a>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/40 text-center">
            <p className="text-gray-700 font-medium mb-2">Made with ❤️ by Adams.</p>
            <p className="text-gray-600 text-sm">&copy; 2025 Adams. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
    </div>
  );
};
export default Layout;