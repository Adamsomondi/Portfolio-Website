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
      title: 'Rick and Morty Website',
      description: 'Full-stack rick and morty website solution with React and Node.js',
      tech: ['React', 'Node.js', 'MongoDB', 'API Integration'],
      image: 'https://images.unsplash.com/photo-1579547945413-497e1b99dac0?w=800',
      github: 'https://github.com/Adamsomondi/Rick-and-Morty.git',
      demo: 'https://mortymultiverse.netlify.app/',
      featured: true
    },
    {
      id: '2', 
      title: 'Whisper AI',
      description: 'Implementation of OpenAI\'s Whisper model for speech-to-text transcription',
      tech:  ['Python', 'Machine Learning', 'OpenAI', 'Flask'],
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
      github: 'https://github.com/Adamsomondi/Whisper-Model',
      demo: '',
      featured: false
    },
    {
      id: '3',
      title: 'Bank-Churn-Prediction',
      description: 'Predicting customer churn for a bank using machine learning techniques',
      tech: ['Python', 'Scikit-Learn', 'Pandas', 'Data Analysis'],
      image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800',
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
    content: `In the world of structured relational databases, two fundamental principles guide our design decisions: ensuring data reliability and maintaining operational efficiency. These principles are achieved through careful attention to avoiding data anomalies and reducing data redundancy.

## Understanding the Core Problems

In a relational database management system (RDBMS), a data anomaly represents an inconsistency in your dataset that results from write operations—whether inserting, deleting, or updating records. Meanwhile, data redundancy refers to the unnecessary duplication of data across different tables. This duplication creates a dangerous scenario where data can become inconsistent, making data integrity increasingly difficult to maintain as your system grows.

## The Normalization Solution

Normalization provides a systematic approach to organizing data that addresses these challenges through progressive refinement:

**First Normal Form (1NF)** eliminates duplicate data and simplifies query operations by ensuring each table cell contains only atomic values.

**Second Normal Form (2NF)** takes the next step by eliminating redundant data, requiring that all non-key attributes are fully dependent on the primary key—not just part of it.

**Third Normal Form (3NF)** ensures that all attributes are functionally dependent only on the primary key, removing transitive dependencies that could lead to update anomalies.

**Boyce-Codd Normal Form (BCNF)** represents a stricter interpretation of 3NF, where every non-trivial dependency must be a super key, closing potential loopholes in the normalization process.

**Fourth Normal Form (4NF)** ensures that tables don't contain multi-valued dependencies, further refining the data structure.

**Fifth Normal Form (5NF)** represents the highest level of normalization, involving the decomposition of tables into smaller structures to eliminate any remaining redundancy while preserving all information.

Understanding these normalization forms provides the foundation for designing robust, maintainable relational database systems that scale effectively with your application's needs.`,
    author: 'Adams',
    date: '2024-12-15',
    readTime: '8 min read',
    tags: ['Databases', 'SQL', 'RDBMS', 'Normalization', 'Data Architecture']
  },
  {
    id: '2',
    title: 'MongoDB Architecture: Embracing Denormalization for Performance',
    excerpt: 'Exploring MongoDB\'s approach to data modeling, where duplication and denormalization become strategic advantages',
    content: `Unlike traditional relational databases that prioritize normalization, MongoDB takes a fundamentally different approach—one that frequently employs both data duplication and denormalization for valid performance and flexibility reasons.

## Understanding MongoDB's Design Philosophy

The pivotal step in MongoDB's design process involves clearly defining your data retrieval needs, which effectively determines the structure of your system entities. This document-oriented approach allows for more natural data modeling that aligns with how applications actually consume data.

## The Technical Foundation

MongoDB operates as a database server that communicates using a binary protocol called the MongoDB Wire Protocol. Internally, data is stored as BSON (Binary JSON), which provides efficient encoding and decoding of documents. Since programming languages speak their own dialects, MongoDB drivers act as the bridge, translating between your application code and the database.

A critical architectural constraint: a MongoDB replica set can only have one primary node at any given time. This design choice enables MongoDB to offer the flexibility needed for building transactional, operational, and analytical applications.

## Replication: Ensuring Data Availability

Replication forms a crucial component of MongoDB's distributed architecture, ensuring data accessibility and resilience to faults. By spreading identical datasets across various database servers, replication safeguards against single points of failure. When one server goes down, your application continues running seamlessly.

## Sharding: Horizontal Scaling Strategy

As applications gain popularity and data volumes increase, sharding becomes essential—a horizontal scaling strategy for distributing data across multiple machines. This approach divides a larger database into smaller, more manageable parts called shards, with each shard storing a portion of the total dataset on a separate database server instance.

It's important to note that each shard must also implement replication to maintain data integrity and availability, creating a multi-layered approach to fault tolerance.

## Scaling Strategies Compared

**Vertical scaling** enhances a single server's capacity by upgrading hardware—more powerful CPUs, increased RAM, or expanded storage. However, technological limitations impose strict upper bounds on what a single machine can handle, creating practical constraints on growth.

**Horizontal scaling**, on the other hand, divides your system's data and workload across multiple servers. Each machine handles only a fraction of the total workload, which can be significantly more cost-effective than investing in increasingly expensive high-end hardware. The tradeoff? Increased infrastructure complexity and more sophisticated system maintenance requirements.

MongoDB's architecture embraces horizontal scaling as a first-class citizen, providing built-in tools and patterns to manage this complexity effectively.`,
    author: 'Adams',
    date: '2024-12-10',
    readTime: '10 min read',
    tags: ['MongoDB', 'NoSQL', 'Databases', 'Sharding', 'Replication', 'Scalability']
  },
  {
    id: '3',
    title: 'Getting Started with React Router v6',
    excerpt: 'Learn the fundamentals of React Router v6 and modern routing patterns',
    content: 'React Router v6 introduces many powerful features that make routing in React applications more intuitive and powerful...',
    author: 'John Doe',
    date: '2024-01-15',
    readTime: '5 min read',
    tags: ['React', 'Routing', 'JavaScript']
  },
  {
    id: '4',
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
    name: 'Adams Omondi ',
    title: 'Data Engineer & Data Analyst',
    bio: 'Passionate developer with 5+ years of experience building modern web applications',
    skills: ['React', 'Node.js', 'TypeScript', 'Python', 'AWS', 'MongoDB'],
    experience: '3+ years',
    location: 'Nairobi, Kenya'
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
//End of Simuated API delays

const HomePage = () => {
  const { featuredProjects, recentPosts } = useLoaderData();
  const navigate = useNavigate();

//Typed Text
  const [typedText, setTypedText] = useState('');
  const fullText = "Building scalable systems & data pipelines";
  
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
              Adams Here👋
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
            Adams Here👋
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
              Latest from My Blog
            </h2>
            <p className="text-lg text-green-900">
              
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