//This is the Home Page.
import React, { useState, useEffect } from 'react';
import { 
  Link, 
  useNavigate,  
  useLoaderData
} from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import backgroundImage from '../assets/Bulldog1.png';

// Mock Data Store - To simulate API data.
const mockData = {
  projects: [
    {
      id: '1',
      title: 'Rick And Morty API',
      description: 'Full-stack rick and morty website solution with React and Node.js',
      tech: ['React', 'Node.js', 'MongoDB', 'Stripe'],
      image: '../assets/BestPanda.png',
      github: 'https://github.com/Adamsomondi/Rick-and-Morty.git',
      demo: 'https://mortymultiverse.netlify.app/',
      featured: true
    },
    {
      id: '2', 
      title: 'Task Management App',
      description: 'Collaborative task management with real-time updates',
      tech: ['React', 'Firebase', 'Material-UI', 'Socket.io'],
      image: 'https://via.placeholder.com/400x300/10B981/white?text=Task+Manager',
      github: 'https://github.com/example/taskmanager',
      demo: 'https://taskmanager.example.com',
      featured: false
    },
    {
      id: '3',
      title: 'Weather Dashboard',
      description: 'Beautiful weather dashboard with location-based forecasts',
      tech: ['React', 'OpenWeather API', 'Chart.js', 'Tailwind'],
      image: 'https://via.placeholder.com/400x300/F59E0B/white?text=Weather+App',
      github: 'https://github.com/example/weather',
      demo: 'https://weather.example.com',
      featured: true
    }
  ],
  blogPosts: [
    {
      id: '1',
      title: 'Getting Started with React Router v6',
      excerpt: 'Learn the fundamentals of React Router v6 and modern routing patterns',
      content: 'React Router v6 introduces many powerful features that make routing in React applications more intuitive and powerful...',
      author: 'John Doe',
      date: '2024-01-15',
      readTime: '5 min read',
      tags: ['React', 'Routing', 'JavaScript']
    },
    {
      id: '2',
      title: 'Building Modern UIs with Headless Components',
      excerpt: 'Explore the power of headless UI components for flexible design systems',
      content: 'Headless UI components provide the logic and accessibility features while giving you complete control over styling...',
      author: 'John Doe', 
      date: '2024-01-10',
      readTime: '7 min read',
      tags: ['UI/UX', 'Components', 'Design Systems']
    }
  ],
  profile: {
    name: 'John Doe',
    title: 'Full Stack Developer',
    bio: 'Passionate developer with 5+ years of experience building modern web applications',
    skills: ['React', 'Node.js', 'TypeScript', 'Python', 'AWS', 'MongoDB'],
    experience: '5+ years',
    location: 'San Francisco, CA'
  }
};
//End of Mock Data Store.

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
  const { featuredProjects, recentPosts } = useLoaderData();
  const navigate = useNavigate();

//Typed Text
  const [typedText, setTypedText] = useState('');
  const fullText = "A Sofware Engineer & Data Analyst";
  
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
     <section className="relative min-h-screen">
  {/* Mobile Background - Full screen background for mobile */}
  <div className="lg:hidden absolute inset-0 overflow-hidden bg-white">
    <img 
      src={backgroundImage}
      alt="Background"
      className="w-full h-60 object-contain"
      style={{ minHeight: '35vh' }}
    />
  </div>
  
  {/* Desktop Layout - Split screen with philosophy content at bottom */}
  <div className="hidden lg:flex h-screen flex-col">
    {/* Main Hero Content - Takes most of the screen */}
    <div className="flex-1 flex">
      {/* Text Content - Left side on desktop */}
      <div className="flex-1 flex items-center justify-start bg-white">
        <div className="max-w-2xl px-8  xl:px-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-left"
          >
            <p className="text-5xl md:text-6xl  font-serif font-bold mb-13 text-green-900">
              Hi, I'm Adams
            </p>
            
            <p className="text-4xl font-bold text-green-900 mb-8 py-3">
              {typedText}
             
              <span className="animate-pulse">|</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-5 justify-start py-3">
              <button
                onClick={() => navigate('/projects')}
                className="bg-black bg-opacity-90 border border-green-200 text-green-500 px-8 py-3 rounded-lg font-bold transition-colors duration-300 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
              >
                View My Work
              </button>
              <button
                onClick={() => navigate('/contact')}
                className="bg-black bg-opacity-90 border border-green-200 text-green-500 px-8 py-3 rounded-lg font-bold transition-colors duration-300 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
              >
                Get In Touch
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Image Container - Right side on desktop */}
      <div className="flex-1 relative">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center center'
          }}
        />
      </div>
    </div>

   {/* Philosophy Content - Closer to buttons with comfortable spacing */}
    <div className="bg-gradient-to-r from-slate-50 to-gray-100 py-4 mt-8">
      <div className="px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-center space-y-3"
        >
          {/* Quote */}
          <blockquote className="text-base font-bold text-gray-800 italic">
            "Talk is cheap. Show me the code."
          </blockquote>
          <cite className="text-sm text-gray-600 font-medium block">— Linus Torvalds</cite>
          
          {/* Stats */}
          <div className="flex justify-center gap-8 pt-2">
            <div className="text-center">
              <div className="text-xl font-bold text-green-900">8+</div>
              <div className="text-xs text-gray-600">Years Of Experience</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-green-900">15+</div>
              <div className="text-xs text-gray-600">Projects</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-green-900">13+</div>
              <div className="text-xs text-gray-600">Technologies</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  </div>

  {/* MOBILE LAYOUT - SIMPLIFIED AND CLEAN */}
  <div className="lg:hidden relative z-10 h-screen flex flex-col justify-between">
    
    {/* Main Hero Content - Top 70% */}
    <div className="flex-grow flex items-center justify-center pt-8">
      <div className="w-full px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-6"
        >
          {/* Main Heading */}
          <h1 className="text-4xl font-bold text-green-900 drop-shadow-lg">
            Hi, I'm Adams👋
          </h1>
          
          {/* Typed Text */}
          <h2 className="text-2xl text-green-900 font-bold drop-shadow-lg">
            {typedText}
            <span className="animate-pulse">|</span>
          </h2>
          
          {/* Buttons */}
          <div className="flex flex-col gap-4 pt-4">
            <button
              onClick={() => navigate('/projects')}
              className="bg-black bg-opacity-90 border border-green-200 text-green-500 px-8 py-3 rounded-lg font-bold transition-colors duration-300 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
            >
              View My Work
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="bg-black bg-opacity-90 border mb-0 border-green-200 text-green-500 px-8 py-3 rounded-lg font-bold transition-colors duration-300 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
            >
              Get In Touch
            </button>
          </div>
        </motion.div>
      </div>
    </div>

    {/* Philosophy Content - Bottom 30% */}
    <div className="bg-gradient-to-r from-slate-50 to-gray-100 py-0">
      <div className="px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-center space-y-3"
        >
          {/* Quote */}
          <blockquote className="text-base font-bold text-gray-800 italic">
            "Talk is cheap. Show me the code."
          </blockquote>
          <cite className="text-sm text-gray-600 font-medium block">— Linus Torvalds</cite>
          
          {/* Stats */}
          <div className="flex justify-center gap-8 pt-2">
            <div className="text-center">
              <div className="text-xl font-bold text-green-900">8+</div>
              <div className="text-xs text-gray-600">Years Of Experience</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-green-900">15+</div>
              <div className="text-xs text-gray-600">Projects</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-green-900">13+</div>
              <div className="text-xs text-gray-600">Technologies</div>
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
            <h2 className="text-4xl font-bold text-green-900 mb-4">
              Featured Projects
            </h2>
            <p className="text-lg text-green-900">
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
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{project.title}</h3>
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
              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold"
            >
            View All Projects
              <ArrowRightIcon className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Recent Blog Posts */}
      <section className="py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-green-900 mb-4">
              Latest from the Blog
            </h2>
            <p className="text-lg text-green-900">
              Thoughts on development and design
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {recentPosts.map((post, index) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/blog/${post.id}`)}
              >
                <h3 className="text-xl font-semibold mb-2">{post.title}</h3>
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
              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold"
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