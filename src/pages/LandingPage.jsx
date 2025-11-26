import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'
import Rick from '../assets/0af43d12-f141-41bd-a2b5-1fa69b7d53a9.jpg'

const LandingPage = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [fadeToWhite, setFadeToWhite] = useState(false);
  const navigate = useNavigate();

  // All available quotes
  const allQuotes = [
    "Good design is obvious. Great design is transparent."
  ];

  // Select a random quote on component mount
  const [selectedQuote] = useState(() => {
    const randomIndex = Math.floor(Math.random() * allQuotes.length);
    return allQuotes[randomIndex];
  });

  useEffect(() => {
    // Start fading to white after 1.5 seconds
    const fadeTimer = setTimeout(() => {
      setFadeToWhite(true);
    }, 1000);

    // Navigate immediately after 3 seconds (no fade out delay)
    const hideTimer = setTimeout(() => {
      navigate('/home');
    }, 2000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [navigate]);

  return (
    <div 
      className={`min-h-screen flex items-center justify-center p-4 md:p-8 transition-all duration-1500 ${
        fadeToWhite ? 'bg-black' : 'bg-black'
      } ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    >
      {/* Main content - Mobile: centered column, Desktop: side by side */}
      <div className="relative z-10 w-full max-w-6xl flex flex-col md:flex-row items-center justify-center md:gap-12 lg:gap-16">
        
        {/* Image container - Left on desktop, centered on mobile */}
        <div className="relative mb-8 md:mb-0 w-full max-w-sm md:max-w-md md:flex-shrink-0">
          <div className={`relative rounded-2xl overflow-hidden shadow-2xl transition-all duration-1500 ${
            fadeToWhite ? 'bg-black backdrop-blur-xl' : ''
          }`}>
            <img 
              src={Rick}
              alt="Welcome" 
              className="w-full aspect-square object-cover md:aspect-auto md:h-80 lg:h-96" 
            />
          </div>
        </div>

        {/* Quote section - Right on desktop, below image on mobile */}
        <div className="px-4 w-full md:flex-1 flex items-center justify-center">
          <p className={`text-xl md:text-2xl lg:text-3xl text-center md:text-left font-bold italic transition-colors duration-1500 ${
            fadeToWhite ? 'text-white' : 'text-white'
          }`}>
            "{selectedQuote}"
            <br />
            <span className="text-sm md:text-base font-normal italic mt-4 block text-gray-400">
              – Myself
            </span>
          </p>

        </div>
      </div>
    </div>
  );
};

export default LandingPage;