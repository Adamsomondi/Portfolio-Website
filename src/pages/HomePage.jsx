//This is the Home Page with Dark Mode Support using Outlet Context
import React, { useState, useEffect } from 'react';
import { 
  Link, 
  useNavigate,  
  useLoaderData,
  useOutletContext
} from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import Rick from '../assets/tumblr_ea2ff7fad956387edb2c0a923c083692_ec1981e2_540.gif';
import Bank from '../assets/tumblr_067e8938c05051db6164caca9e552952_6afccc6b_540.gif';

// Mock Data Store - To simulate API data.
const mockData = {
  projects: [
    {
      id: '1',
      title: 'Rick and Morty Website',
      description: 'Full-stack rick and morty website solution with React and Node.js',
      tech: ['React', 'Node.js', 'MongoDB', 'API Integration'],
      image: Rick,
      github: 'https://github.com/Adamsomondi/Rick-and-Morty.git',
      demo: 'https://mortymultiverse.netlify.app/',
      featured: true
    },
    {
      id: '3',
      title: 'Bank-Churn-Prediction',
      description: 'Predicting customer churn for a bank using machine learning techniques',
      tech: ['Python', 'Scikit-Learn', 'Pandas', 'Data Analysis'],
      image: Bank,
      github: 'https://github.com/Adamsomondi/Bank-Churn-Prediction',
      demo: '',
      featured: true
    }
  ],
  blogPosts: [
    {
      id: '1',
      title: 'The Why Behind Relational Database Design: Normalization Explained',
      excerpt: 'Understanding data anomalies, redundancy, and the normalization process that ensures reliable and efficient relational databases',
      author: 'Adams',
      date: '2024-12-15',
      readTime: '8 min read',
      tags: ['Databases', 'SQL', 'RDBMS', 'Normalization', 'Data Architecture']
    },
    {
      id: '2',
      title: 'MongoDB Architecture: Embracing Denormalization for Performance',
      excerpt: 'Exploring MongoDB\'s approach to data modeling, where duplication and denormalization become strategic advantages',
      author: 'Adams',
      date: '2024-12-10',
      readTime: '10 min read',
      tags: ['MongoDB', 'NoSQL', 'Databases', 'Sharding', 'Replication', 'Scalability']
    }
  ],
  profile: {
    name: 'Adams Omondi ',
    title: 'Data Engineer & Data Analyst',
    bio: 'Passionate developer with 5+ years of experience building modern web applications',
    skills: ['React', 'Node.js', 'TypeScript', 'Python', 'AWS', 'MongoDB'],
    experience: '3+ years',
    location: 'Nairobi, Kenya'
  }
};

// Simulate API delays
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const homeLoader = async () => {
  await delay(800);
  return {
    featuredProjects: mockData.projects.filter(p => p.featured),
    recentPosts: mockData.blogPosts.slice(0, 2)
  };
};

const HomePage = () => {
  const { isDark } = useOutletContext();
  const { featuredProjects, recentPosts } = useLoaderData();
  const navigate = useNavigate();

  //Typed Text
  const [typedText, setTypedText] = useState('');
  const fullText = "Software Engineering • Automation • Data Science & Visualization";
  
  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index < fullText.length) {
        setTypedText(fullText.slice(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 100);
    
    return () => clearInterval(timer);
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative -mt-8 -mx-6 md:-mx-8 lg:-mx-12 mb-8">
        
        {/* Desktop Layout */}
        <div className="hidden lg:flex min-h-screen flex-col">
          {/* Main Hero Content */}
          <div className="flex-1 flex">
            {/* Text Content - Left side */}
            <div className="flex-1 flex items-center justify-start">
              <div className="max-w-2xl px-8 xl:px-16">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-left"
                >
                  <p className={`text-6xl font-bold mb-8 py-3 ${
                    isDark ? 'text-white' : 'text-gray-800'
                  }`}>
                    {typedText}
                    <span className="animate-pulse">|</span>
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-5 justify-start py-3">
                    <button
                      onClick={() => navigate('/projects')}
                      className={`px-8 py-3 rounded-lg font-bold transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                        isDark
                          ? 'bg-white text-black border-2 border-gray-700 hover:bg-gray-500'
                          : 'backdrop-blur-sm bg-white/30 border-2 border-white/50 text-gray-800 hover:bg-white/50'
                      }`}
                    >
                      View My Work
                    </button>
                    <button
                      onClick={() => navigate('/contact')}
                      className={`px-8 py-3 rounded-lg font-bold transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                        isDark
                          ? 'bg-white text-black border-2 border-gray-700 hover:bg-gray-500'
                          : 'backdrop-blur-sm bg-white/30 border-2 border-white/50 text-gray-800 hover:bg-white/50'
                      }`}
                    >
                      Get In Touch
                    </button>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
          
          {/* Philosophy Content */}
          <div className={`py-6 border-t ${
            isDark
              ? 'bg-gray-900/60 border-gray-800'
              : 'backdrop-blur-md bg-white/20 border-white/30'
          }`}>
            <div className="px-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-center space-y-3"
              >
                <blockquote className={`text-base font-bold italic ${
                  isDark ? 'text-white' : 'text-gray-800'
                }`}>
                  "The future belongs to those who can think in systems, not just products."
                </blockquote>
                <cite className={`text-sm font-medium block ${
                  isDark ? 'text-white' : 'text-gray-700'
                }`}>— Iddris Sandu</cite>
                
                <div className="flex justify-center gap-8 pt-2">
                  <div className="text-center">
                    <div className={`text-xl font-bold ${
                      isDark ? 'text-white' : 'text-gray-800'
                    }`}>3+</div>
                    <div className={`text-xs ${
                      isDark ? 'text-white' : 'text-gray-700'
                    }`}>Years Of Experience</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-xl font-bold ${
                      isDark ? 'text-white' : 'text-gray-800'
                    }`}>10+</div>
                    <div className={`text-xs ${
                      isDark ? 'text-white' : 'text-gray-700'
                    }`}>Projects</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-xl font-bold ${
                      isDark ? 'text-white' : 'text-gray-800'
                    }`}>8+</div>
                    <div className={`text-xs ${
                      isDark ? 'text-white' : 'text-gray-700'
                    }`}>Technologies</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden relative min-h-screen flex flex-col pt-1">
          {/* Main Content */}
          <div className="relative z-10 flex-grow flex items-center justify-center pt-1">
            <div className="w-full px-6">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center space-y-6"
              >
                <h2 className={`text-4xl font-bold drop-shadow-lg pt-1 ${
                  isDark ? 'text-white' : 'text-gray-800'
                }`}>
                  {typedText}
                  <span className="animate-pulse">|</span>
                </h2>
                
                <div className="flex flex-col gap-4 pt-16">
                  <button
                    onClick={() => navigate('/projects')}
                    className={`px-8 py-3 rounded-lg font-bold transition-all duration-300 hover:shadow-xl ${
                      isDark
                        ? 'bg-white text-black hover:bg-gray-100'
                        : 'backdrop-blur-sm bg-white/30 border-2 border-white/50 text-gray-800 hover:bg-white/50'
                    }`}
                  >
                    View My Work
                  </button>
                  <button
                    onClick={() => navigate('/contact')}
                    className={`px-8 py-3 rounded-lg font-bold transition-all duration-300 hover:shadow-xl ${
                      isDark
                        ? 'bg-white text-black border-2 border-gray-700 hover:bg-gray-700'
                        : 'backdrop-blur-sm bg-white/30 border-2 border-white/50 text-gray-800 hover:bg-white/50'
                    }`}
                  >
                    Get In Touch
                  </button>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Philosophy Content */}
          <div className={`pt-5 py-6 border-t ${
            isDark
              ? 'bg-gray-900/60 border-gray-800'
              : 'backdrop-blur-md bg-white/20 border-white/30'
          }`}>
            <div className="px-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-center space-y-3"
              >
                <blockquote className={`text-base font-bold italic ${
                  isDark ? 'text-white' : 'text-gray-800'
                }`}>
                  "The future belongs to those who can think in systems, not just products."
                </blockquote>
                <cite className={`text-sm font-medium block ${
                  isDark ? 'text-white' : 'text-gray-700'
                }`}>— Iddris Sandu</cite>
                
                <div className="flex justify-center gap-8 pt-2">
                  <div className="text-center">
                    <div className={`text-xl font-bold ${
                      isDark ? 'text-white' : 'text-gray-800'
                    }`}>3+</div>
                    <div className={`text-xs ${
                      isDark ? 'text-white' : 'text-gray-700'
                    }`}>Years Of Experience</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-xl font-bold ${
                      isDark ? 'text-white' : 'text-gray-800'
                    }`}>10+</div>
                    <div className={`text-xs ${
                      isDark ? 'text-white' : 'text-gray-700'
                    }`}>Projects</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-xl font-bold ${
                      isDark ? 'text-white' : 'text-gray-800'
                    }`}>8+</div>
                    <div className={`text-xs ${
                      isDark ? 'text-white' : 'text-gray-700'
                    }`}>Technologies</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="py-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-4xl font-bold mb-4 ${
              isDark ? 'text-white' : 'text-green-900'
            }`}>
              Featured Projects
            </h2>
            <p className={`text-lg ${
              isDark ? 'text-white' : 'text-green-900'
            }`}>
              Some of my best work.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className={`rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer ${
                  isDark ? 'bg-white' : 'bg-white'
                }`}
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2 text-black">{project.title}</h3>
                  <p className="text-gray-600 mb-4">{project.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {project.tech.map((tech) => (
                      <span
                        key={tech}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link
              to="/projects"
              className={`inline-flex items-center font-semibold ${
                isDark ? 'text-white hover:text-gray-300' : 'text-blue-600 hover:text-blue-800'
              }`}
            >
              View All Projects
              <ArrowRightIcon className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Recent Blog Posts */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-4xl font-bold mb-4 ${
              isDark ? 'text-white' : 'text-green-900'
            }`}>
              Latest From Blogs
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {recentPosts.map((post, index) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className={`rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer ${
                  isDark ? 'bg-white' : 'bg-white'
                }`}
                onClick={() => navigate(`/blog/${post.id}`)}
              >
                <h3 className="text-xl font-semibold mb-2 text-black">{post.title}</h3>
                <p className="text-gray-600 mb-4">{post.excerpt}</p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{post.date}</span>
                  <span>{post.readTime}</span>
                </div>
              </motion.article>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link
              to="/blog"
              className={`inline-flex items-center font-semibold ${
                isDark ? 'text-white hover:text-gray-300' : 'text-blue-600 hover:text-blue-800'
              }`}
            >
              Read More Posts
              <ArrowRightIcon className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;