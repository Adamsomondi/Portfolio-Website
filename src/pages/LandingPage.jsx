import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [fadeToWhite, setFadeToWhite] = useState(false);
  const navigate = useNavigate();

  // All available quotes
  const allQuotes = [
    "We live at the intersection of what we build and what we touch — the threshold where imagination meets the digital world.",
    "Design is not just what it looks like and feels like. Design is how it works.",
    "Simplicity is the ultimate sophistication.",
    "The best way to understand something is to try to change it.",
    "Make it work, make it right, make it fast.",
    "Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away.",
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
    }, 1500);

    // Navigate immediately after 3 seconds (no fade out delay)
    const hideTimer = setTimeout(() => {
      navigate('/home');
    }, 3000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [navigate]);

  return (
    <div 
      className={`min-h-screen flex items-center justify-center p-4 md:p-8 transition-all duration-1500 ${
        fadeToWhite ? 'bg-white' : 'bg-black'
      } ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    >
      {/* Main content - Mobile: centered column, Desktop: side by side */}
      <div className="relative z-10 w-full max-w-6xl flex flex-col md:flex-row items-center justify-center md:gap-12 lg:gap-16">
        
        {/* Image container - Left on desktop, centered on mobile */}
        <div className="relative mb-8 md:mb-0 w-full max-w-sm md:max-w-md md:flex-shrink-0">
          <div className={`relative rounded-2xl overflow-hidden shadow-2xl transition-all duration-1500 ${
            fadeToWhite ? 'bg-white/70 backdrop-blur-xl border border-gray-200' : ''
          }`}>
            <img 
              src="/src/assets/22725e60-cecb-4a2f-95a2-591ff0c03517.jpg" 
              alt="Welcome" 
              className="w-full aspect-square object-cover md:aspect-auto md:h-80 lg:h-96" 
            />
          </div>
        </div>

        {/* Quote section - Right on desktop, below image on mobile */}
        <div className="px-4 w-full md:flex-1 flex items-center justify-center">
          <p className={`text-xl md:text-2xl lg:text-3xl text-center md:text-left font-light italic transition-colors duration-1500 ${
            fadeToWhite ? 'text-black' : 'text-white'
          }`}>
            "{selectedQuote}"
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;