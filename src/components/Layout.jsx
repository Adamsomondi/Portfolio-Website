import React, { useState} from 'react';
import { 
  Link, 
  NavLink, 
  useLocation, 
  useNavigation, 
  Outlet
} from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Fragment } from 'react';
import { Transition } from '@headlessui/react';
import { 
  HomeIcon, 
  UserIcon, 
  BriefcaseIcon, 
  EnvelopeIcon, 
  DocumentTextIcon,
  Bars3Icon,
  XMarkIcon,
  SunIcon,
  MoonIcon,
} from '@heroicons/react/24/outline';
import { FaGithub, FaLinkedin, FaXTwitter} from 'react-icons/fa6';

const Layout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); 
  const [isDark, setIsDark] = useState(false);
  const navigation = useNavigation();
  const location = useLocation();

  const navigationItems = [
    { name: 'Home', to: '/', icon: HomeIcon },
    { name: 'About', to: '/about', icon: UserIcon },
    { name: 'Projects', to: '/projects', icon: BriefcaseIcon },
    { name: 'Blog', to: '/blog', icon: DocumentTextIcon },
    { name: 'Contact', to: '/contact', icon: EnvelopeIcon }
  ];

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${
      isDark 
        ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' 
        : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'
    }`}>
      {/* Navigation */}
      <nav className={`shadow-sm border-b transition-colors duration-500 ${
        isDark 
          ? 'bg-slate-900/80 backdrop-blur-xl border-slate-700' 
          : 'bg-white/80 backdrop-blur-xl border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className={`group flex items-center space-x-3 px-8 py-3 rounded-full border-2 border-transparent bg-clip-padding hover:shadow-2xl hover:scale-110 hover:-translate-y-1 transition-all duration-500 relative before:absolute before:inset-0 before:rounded-full before:p-[2px] before:-z-10 ${
                isDark
                  ? 'bg-gradient-to-r from-purple-900/80 to-blue-900/80 before:bg-gradient-to-r before:from-purple-500 before:via-blue-500 before:to-purple-600'
                  : 'bg-gradient-to-r from-green-50/80 to-emerald-50/80 before:bg-gradient-to-r before:from-green-400 before:via-emerald-500 before:to-green-600'
              }`}>
                <span className={`text-2xl font-serif font-bold group-hover:-translate-y-0.5 transition-transform duration-300 ${
                  isDark ? 'text-purple-300' : 'text-green-900'
                }`}>My Portfolio</span>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden sm:flex sm:items-center sm:space-x-6">
              {navigationItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.to}
                  className={({ isActive }) =>
                    `inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 transition-all duration-300 ${
                      isActive
                        ? isDark 
                          ? 'border-purple-400 text-purple-300'
                          : 'border-blue-500 text-green-900'
                        : isDark
                          ? 'border-transparent text-slate-300 hover:text-purple-300 hover:border-slate-600'
                          : 'border-transparent text-gray-500 hover:text-green-700 hover:border-gray-300'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.name}
                </NavLink>
              ))}
              
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className={`relative inline-flex items-center justify-center w-14 h-8 rounded-full transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-lg hover:shadow-xl hover:scale-105 ${
                  isDark
                    ? 'bg-gradient-to-r from-slate-700 to-slate-800 focus:ring-purple-500'
                    : 'bg-gradient-to-r from-amber-400 to-orange-400 focus:ring-blue-500'
                }`}
                aria-label="Toggle theme"
              >
                <motion.div
                  className={`absolute w-6 h-6 rounded-full shadow-md flex items-center justify-center ${
                    isDark ? 'bg-slate-900' : 'bg-white'
                  }`}
                  animate={{
                    x: isDark ? 22 : -22,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30
                  }}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={isDark ? 'moon' : 'sun'}
                      initial={{ rotate: -180, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 180, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {isDark ? (
                        <MoonIcon className="w-4 h-4 text-purple-400" />
                      ) : (
                        <SunIcon className="w-4 h-4 text-amber-500" />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="sm:hidden flex items-center space-x-2">
              {/* Mobile Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`relative inline-flex items-center justify-center w-12 h-7 rounded-full transition-all duration-500 focus:outline-none shadow-lg ${
                  isDark
                    ? 'bg-gradient-to-r from-slate-700 to-slate-800'
                    : 'bg-gradient-to-r from-amber-400 to-orange-400'
                }`}
                aria-label="Toggle theme"
              >
                <motion.div
                  className={`absolute w-5 h-5 rounded-full shadow-md flex items-center justify-center ${
                    isDark ? 'bg-slate-900' : 'bg-white'
                  }`}
                  animate={{
                    x: isDark ? 18 : -18,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30
                  }}
                >
                  {isDark ? (
                    <MoonIcon className="w-3 h-3 text-purple-400" />
                  ) : (
                    <SunIcon className="w-3 h-3 text-amber-500" />
                  )}
                </motion.div>
              </button>
              
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`inline-flex items-center justify-center p-2 rounded-md transition-colors duration-300 ${
                  isDark 
                    ? 'text-slate-300 hover:text-purple-300 hover:bg-slate-800'
                    : 'text-green-900 hover:text-gray-500 hover:bg-gray-100'
                }`}
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
                    `block pl-3 pr-4 py-2 text-base font-medium transition-colors duration-300 ${
                      isActive
                        ? isDark
                          ? 'bg-purple-900/50 border-r-4 border-purple-400 text-purple-300'
                          : 'bg-blue-50 border-r-4 border-blue-500 text-blue-700'
                        : isDark
                          ? 'text-slate-300 hover:text-purple-300 hover:bg-slate-800'
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
        <div className={`w-full h-1 ${isDark ? 'bg-slate-800' : 'bg-gray-200'}`}>
          <motion.div 
            className={`h-1 ${isDark ? 'bg-purple-500' : 'bg-blue-600'}`}
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.5 }}
          />
        </div>
      )}

      {/* Main Content with Glassmorphic Design */}
      <main className="flex-1 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-30">
          <div className={`absolute top-10 left-10 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl animate-pulse ${
            isDark ? 'bg-purple-600' : 'bg-green-900'
          }`}></div>
          <div className={`absolute top-20 right-10 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl animate-pulse ${
            isDark ? 'bg-pink-600' : 'bg-purple-900'
          }`} style={{ animationDelay: '0.1s' }}></div>
          <div className={`absolute bottom-20 left-1/2 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl animate-pulse ${
            isDark ? 'bg-pink-600' : 'bg-purple-600'
          }`} style={{ animationDelay: '0.1s' }}></div>
        </div>

        {/* Glassmorphic Content Container */}
        <div className="relative max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className={`backdrop-blur-md rounded-3xl shadow-2xl border p-6 md:p-8 lg:p-12 min-h-[calc(100vh-20rem)] transition-all duration-500 ${
            isDark
              ? 'bg-slate-900/40 border-slate-700/50'
              : 'bg-white/40 border-white/50'
          }`}>
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
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`relative overflow-hidden transition-colors duration-500 ${
        isDark
          ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900'
          : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'
      }`}>
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-30">
          <div className={`absolute top-10 left-10 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl animate-pulse ${
            isDark ? 'bg-purple-600' : 'bg-blue-400'
          }`}></div>
          <div className={`absolute top-20 right-10 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl animate-pulse ${
            isDark ? 'bg-blue-600' : 'bg-purple-400'
          }`} style={{ animationDelay: '1s' }}></div>
          <div className={`absolute -bottom-8 left-1/2 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl animate-pulse ${
            isDark ? 'bg-pink-600' : 'bg-pink-400'
          }`} style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className={`backdrop-blur-md rounded-3xl shadow-2xl border p-8 md:p-12 transition-all duration-500 ${
            isDark
              ? 'bg-slate-900/40 border-slate-700/50'
              : 'bg-white/40 border-white/50'
          }`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              {/* Brand Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                
                </div>
                <p className={`leading-relaxed text-sm transition-colors duration-500 ${
                  isDark ? 'text-slate-300' : 'text-gray-700'
                }`}>
                  I'm currently focused on expanding my experience designing 
                  and developing high performing systems.
                </p>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className={`text-lg font-bold mb-6 transition-colors duration-500 ${
                  isDark ? 'text-slate-100' : 'text-gray-900'
                }`}>Quick Links</h3>
                <div className="space-y-3">
                  {navigationItems.map((item) => (
                    <a
                      key={item.name}
                      href={item.to}
                      className={`block transition-all duration-300 hover:translate-x-2 font-medium ${
                        isDark 
                          ? 'text-slate-300 hover:text-purple-300'
                          : 'text-gray-700 hover:text-purple-600'
                      }`}
                    >
                      {item.name}
                    </a>
                  ))}
                </div>
              </div>

              {/* Connect Section */}
              <div>
                <h3 className={`text-lg font-bold mb-6 transition-colors duration-500 ${
                  isDark ? 'text-slate-100' : 'text-gray-900'
                }`}>Connect</h3>
                <div className="space-y-4">
                  <a 
                    href="https://github.com/Adamsomondi" 
                    target="_blank"
                    rel="noopener noreferrer" 
                    className={`flex items-center space-x-3 transition-all duration-300 group ${
                      isDark 
                        ? 'text-slate-300 hover:text-slate-100'
                        : 'text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-md ${
                      isDark
                        ? 'bg-slate-800/60 group-hover:bg-purple-900/60'
                        : 'bg-white/60 group-hover:bg-purple-100'
                    }`}>
                      <FaGithub className="w-5 h-5" />
                    </div>
                    <span className="font-medium">GitHub</span>
                  </a>
                  <a 
                    href="https://www.linkedin.com/in/adams-omondi-338b94304" 
                    target="_blank"
                    rel="noopener noreferrer" 
                    className={`flex items-center space-x-3 transition-all duration-300 group ${
                      isDark 
                        ? 'text-slate-300 hover:text-blue-400'
                        : 'text-gray-700 hover:text-blue-600'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-md ${
                      isDark
                        ? 'bg-slate-800/60 group-hover:bg-blue-900/60'
                        : 'bg-white/60 group-hover:bg-blue-100'
                    }`}>
                      <FaLinkedin className="w-5 h-5" />
                    </div>
                    <span className="font-medium">LinkedIn</span>
                  </a>
                  <a 
                    href="https://x.com/deepneuralmess" 
                    target="_blank"
                    rel="noopener noreferrer" 
                    className={`flex items-center space-x-3 transition-all duration-300 group ${
                      isDark 
                        ? 'text-slate-300 hover:text-slate-100'
                        : 'text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-md ${
                      isDark
                        ? 'bg-slate-800/60 group-hover:bg-slate-700/60'
                        : 'bg-white/60 group-hover:bg-gray-100'
                    }`}>
                      <FaXTwitter className="w-5 h-5" />
                    </div>
                    <span className="font-medium">Twitter</span>
                  </a>
                </div>
              </div>
            </div>

            <div className={`mt-12 pt-8 border-t transition-colors duration-500 text-center ${
              isDark ? 'border-slate-700/40' : 'border-white/40'
            }`}>
              <p className={`font-medium mb-2 transition-colors duration-500 ${
                isDark ? 'text-slate-300' : 'text-gray-700'
              }`}>Made with ❤️ by Adams.</p>
              <p className={`text-sm transition-colors duration-500 ${
                isDark ? 'text-slate-400' : 'text-gray-600'
              }`}>&copy; 2025 Adams. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;