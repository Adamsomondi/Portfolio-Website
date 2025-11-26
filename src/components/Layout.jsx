import React, { useState } from 'react';
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
import { FaGithub, FaLinkedin, FaXTwitter } from 'react-icons/fa6';
import SpatialMouseEffect from './SpatialMouseEffect.jsx';

const Layout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); 
  const [isDark, setIsDark] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigation = useNavigation();
  const location = useLocation();

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigationItems = [
    { name: 'Home', to: '/home', icon: HomeIcon },
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
        ? 'bg-black dark' 
        : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'
    }`}>
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 shadow-sm transition-all duration-700 ease-out ${
        isDark 
          ? 'bg-black/80 backdrop-blur-xl' 
          : 'bg-white/80 backdrop-blur-xl'
      } ${isScrolled ? 'py-2' : 'py-0'} ${
        isDark ? 'border-gray-800' : 'border-gray-500'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <motion.div 
              className="flex items-center overflow-hidden"
              animate={{
                width: isScrolled ? 0 : 'auto',
                opacity: isScrolled ? 0 : 1,
              }}
              transition={{
                duration: 0.1,
                ease: [0.4, 0, 0.2, 1]
              }}
            >
              <Link to="/home" className={`group flex items-center space-x-3 px-8 py-3 rounded-full border transition-all duration-700 ${
                isDark
                  ? 'bg-black text-black border-gray-800 hover:border-gray-700 hover:shadow-lg'
                  : 'bg-gradient-to-r from-green-50/80 to-emerald-50/80 border-transparent hover:shadow-2xl before:bg-gradient-to-r before:from-green-400 before:via-emerald-500 before:to-green-600'
              } hover:scale-105`}>
                <span className={`text-2xl font-serif font-bold transition-all duration-300 whitespace-nowrap ${
                  isDark ? 'text-white' : 'text-green-900'
                }`}>a.space</span>
              </Link>
            </motion.div>
            
            {/* Desktop Navigation - Fluid Icons */}
            <div className="hidden sm:flex sm:items-center sm:space-x-6">
              <motion.div 
                className={`flex items-center rounded-full px-4 py-2 transition-all duration-700 ${
                  isScrolled 
                    ? isDark 
                      ? 'bg-gray-900/50 backdrop-blur-sm space-x-2'
                      : 'bg-white/50 backdrop-blur-sm space-x-2'
                    : 'space-x-6'
                }`}
                animate={{
                  gap: isScrolled ? '0.5rem' : '1.5rem',
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30
                }}
              >
                {navigationItems.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.to}
                    className={({ isActive }) =>
                      `relative inline-flex items-center transition-all duration-700 ease-out group ${
                        isScrolled ? 'px-2 py-2' : 'px-1 pt-1'
                      } ${
                        isActive
                          ? isDark 
                            ? 'text-white'
                            : 'text-green-900'
                          : isDark
                            ? 'text-white hover:text-gray-300'
                            : 'text-gray-500 hover:text-green-700'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <motion.div
                          className={`flex items-center justify-center transition-all duration-700 ${
                            isScrolled 
                              ? 'w-9 h-9 rounded-xl' 
                              : 'w-4 h-4'
                          } ${
                            isActive && isScrolled
                              ? isDark
                                ? 'bg-white/10'
                                : 'bg-green-100'
                              : ''
                          }`}
                          animate={{
                            scale: isScrolled ? 1.2 : 1,
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 25
                          }}
                        >
                          <item.icon className={`transition-all duration-700 ${
                            isScrolled ? 'w-5 h-5' : 'w-4 h-4 mr-2'
                          }`} />
                        </motion.div>
                        
                        <motion.span
                          className="text-sm font-medium overflow-hidden whitespace-nowrap"
                          animate={{
                            width: isScrolled ? 0 : 'auto',
                            opacity: isScrolled ? 0 : 1,
                            marginLeft: isScrolled ? 0 : '0.5rem',
                          }}
                          transition={{
                            duration: 0.1,
                            ease: [0.4, 0, 0.2, 1]
                          }}
                        >
                          {item.name}
                        </motion.span>
                        
                        {!isScrolled && (
                          <motion.div
                            className={`absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-300 ${
                              isActive
                                ? isDark 
                                  ? 'bg-white'
                                  : 'bg-blue-500'
                                : 'bg-transparent'
                            }`}
                            layoutId={isActive ? 'activeTab' : undefined}
                          />
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </motion.div>
              
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className={`relative inline-flex items-center justify-center w-14 h-8 rounded-full transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-lg hover:shadow-xl hover:scale-105 ${
                  isDark
                    ? 'bg-gray-800 focus:ring-gray-600 hover:bg-gray-700'
                    : 'bg-gradient-to-r from-amber-400 to-orange-400 focus:ring-blue-500'
                }`}
                aria-label="Toggle theme"
              >
                <motion.div
                  className={`absolute w-6 h-6 rounded-full shadow-md flex items-center justify-center ${
                    isDark ? 'bg-white' : 'bg-white'
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
                        <MoonIcon className="w-4 h-4 text-gray-800" />
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
                    ? 'bg-gray-800 hover:bg-gray-700'
                    : 'bg-gradient-to-r from-amber-400 to-orange-400'
                }`}
                aria-label="Toggle theme"
              >
                <motion.div
                  className={`absolute w-5 h-5 rounded-full shadow-md flex items-center justify-center bg-white`}
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
                    <MoonIcon className="w-3 h-3 text-gray-800" />
                  ) : (
                    <SunIcon className="w-3 h-3 text-amber-500" />
                  )}
                </motion.div>
              </button>
              
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`inline-flex items-center justify-center p-2 rounded-md transition-colors duration-300 ${
                  isDark 
                    ? 'text-white hover:text-gray-300 hover:bg-gray-900'
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
                          ? 'bg-gray-900 border-r-4 border-white text-white'
                          : 'bg-blue-50 border-r-4 border-blue-500 text-blue-700'
                        : isDark
                          ? 'text-white hover:text-gray-300 hover:bg-gray-900'
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
        <div className={`fixed top-16 left-0 right-0 w-full h-1 z-40 ${isDark ? 'bg-gray-900' : 'bg-gray-200'}`}>
          <motion.div 
            className={`h-1 ${isDark ? 'bg-white' : 'bg-blue-600'}`}
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.5 }}
          />
        </div>
      )}

      {/* Main Content with Glassmorphic Design */}
      <main className="flex-1 relative overflow-hidden pt-16">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-30">
          <div className={`absolute top-10 left-10 w-72 h-72 rounded-full filter blur-xl animate-pulse ${
            isDark ? 'bg-white mix-blend-lighten' : 'bg-green-900 mix-blend-multiply'
          }`}></div>
          <div className={`absolute top-20 right-10 w-72 h-72 rounded-full filter blur-xl animate-pulse ${
            isDark ? 'bg-blue-800 mix-blend-lighten' : 'bg-purple-900 mix-blend-multiply'
          }`} style={{ animationDelay: '1s' }}></div>
          <div className={`absolute bottom-20 left-1/2 w-72 h-72 rounded-full filter blur-xl animate-pulse ${
            isDark ? 'bg-pink-600 mix-blend-lighten' : 'bg-purple-600 mix-blend-multiply'
          }`} style={{ animationDelay: '2s' }}></div>
        </div>

        {/* Glassmorphic Content Container */}
        <div className="relative max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className={`backdrop-blur-md rounded-3xl shadow-2xl border p-6 md:p-8 lg:p-12 min-h-[calc(100vh-20rem)] transition-all duration-500 ${
            isDark
              ? 'bg-white/95 border-gray-800 text-black'
              : 'bg-white/40 border-white/50 text-gray-900'
          }`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Outlet context={{ isDark }} />
               <SpatialMouseEffect isDark={isDark} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`relative overflow-hidden transition-colors duration-500 ${
        isDark
          ? 'bg-black'
          : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'
      }`}>
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-30">
          <div className={`absolute top-10 left-10 w-72 h-72 rounded-full filter blur-xl animate-pulse ${
            isDark ? 'bg-purple-600 mix-blend-lighten' : 'bg-blue-400 mix-blend-multiply'
          }`}></div>
          <div className={`absolute top-20 right-10 w-72 h-72 rounded-full filter blur-xl animate-pulse ${
            isDark ? 'bg-blue-600 mix-blend-lighten' : 'bg-purple-400 mix-blend-multiply'
          }`} style={{ animationDelay: '1s' }}></div>
          <div className={`absolute -bottom-8 left-1/2 w-72 h-72 rounded-full filter blur-xl animate-pulse ${
            isDark ? 'bg-pink-600 mix-blend-lighten' : 'bg-pink-400 mix-blend-multiply'
          }`} style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className={`backdrop-blur-md rounded-3xl shadow-2xl border p-8 md:p-12 transition-all duration-500 ${
            isDark
              ? 'bg-white/95 border-gray-800 text-black'
              : 'bg-white/40 border-white/50 text-gray-900'
          }`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              {/* Brand Section */}
              <div className="space-y-4">
                <p className={`leading-relaxed text-lg transition-colors duration-500 ${
                  isDark ? 'text-white' : 'text-gray-700'
                }`}>
                  I'm currently focused on expanding my experience designing 
                  and developing high performing systems.
                </p>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className={`text-lg font-bold mb-6 transition-colors duration-500 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>Quick Links</h3>
                <div className="space-y-3">
                  {navigationItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.to}
                      className={`block transition-all duration-300 hover:translate-x-2 font-medium ${
                        isDark 
                          ? 'text-white hover:text-blue-600'
                          : 'text-gray-700 hover:text-blue-600'
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Connect Section */}
              <div>
                <h3 className={`text-lg font-bold mb-6 transition-colors duration-500 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>Connect</h3>
                <div className="space-y-4">
                  <a 
                    href="https://github.com/Adamsomondi" 
                    target="_blank"
                    rel="noopener noreferrer" 
                    className={`flex items-center space-x-3 transition-all duration-300 group ${
                      isDark 
                        ? 'text-gray-700 hover:text-blue-600'
                        : 'text-gray-700 hover:text-blue-600'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 border ${
                      isDark
                        ? 'bg-gray-50 border-gray-200 group-hover:bg-gray-100 group-hover:border-gray-300'
                        : 'bg-white/60 border-gray-200 group-hover:bg-purple-100'
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
                        ? 'text-gray-700 hover:text-blue-600'
                        : 'text-gray-700 hover:text-blue-600'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 border ${
                      isDark
                        ? 'bg-gray-50 border-gray-200 group-hover:bg-blue-50 group-hover:border-blue-200'
                        : 'bg-white/60 border-gray-200 group-hover:bg-blue-100'
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
                        ? 'text-gray-700 hover:text-blue-600'
                        : 'text-gray-700 hover:text-blue-600'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 border ${
                      isDark
                        ? 'bg-gray-50 border-gray-200 group-hover:bg-gray-100 group-hover:border-gray-300'
                        : 'bg-white/60 border-gray-200 group-hover:bg-gray-100'
                    }`}>
                      <FaXTwitter className="w-5 h-5" />
                    </div>
                    <span className="font-medium">Twitter</span>
                  </a>
                </div>
              </div>
            </div>

            <div className={`mt-12 pt-8 border-t transition-colors duration-500 text-center ${
              isDark ? 'border-gray-200' : 'border-white/40'
            }`}>
              <p className={`font-medium mb-2 transition-colors duration-500 ${
                isDark ? 'text-white' : 'text-gray-700'
              }`}>Made with ❤️ by Adams.</p>
              <p className={`text-sm transition-colors duration-500 ${
                isDark ? 'text-white' : 'text-gray-600'
              }`}>&copy; 2025 Adams. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;