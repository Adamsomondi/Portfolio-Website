import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLoaderData, useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { api } from '../lib/api';

export const homeLoader = async () => {
  const [featuredProjects, allPosts] = await Promise.all([
    api.getFeaturedProjects(),
    api.getBlogPosts(),
  ]);
  return { featuredProjects, recentPosts: allPosts.slice(0, 2) };
};

const FULL_TEXT = 'Software Engineering • Automation • Data Science & Visualization';

const STATS = [
  { label: 'Years Of Experience', value: '3+' },
  { label: 'Projects',            value: '10+' },
  { label: 'Technologies',        value: '8+' },
];

const HomePage = () => {
  const { isDark } = useOutletContext();
  const { featuredProjects, recentPosts } = useLoaderData();
  const navigate = useNavigate();

  const [typedText, setTypedText] = useState('');

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      if (i < FULL_TEXT.length) {
        setTypedText(FULL_TEXT.slice(0, i + 1));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 100);
    return () => clearInterval(timer);
  }, []);

  const StatBar = () => (
    <div
      className={`py-6 border-t ${
        isDark ? 'bg-gray-900/60 border-gray-800' : 'backdrop-blur-md bg-white/20 border-white/30'
      }`}
    >
      <div className="px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-center"
        >
          <div className="flex justify-center gap-8 pt-2">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {s.value}
                </div>
                <div className={`text-xs ${isDark ? 'text-white' : 'text-gray-700'}`}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );

  const heroButtons = (vertical = false) => (
    <div className={`flex gap-4 ${vertical ? 'flex-col pt-16' : 'flex-col sm:flex-row py-3'}`}>
      {[
        { label: 'View My Work', to: '/projects' },
        { label: 'Get In Touch', to: '/contact' },
      ].map((btn) => (
        <button
          key={btn.label}
          onClick={() => navigate(btn.to)}
          className={`px-8 py-3 rounded-lg font-bold transition-all duration-300 hover:shadow-xl hover:scale-105 ${
            isDark
              ? 'bg-white text-black border-2 border-gray-700 hover:bg-gray-500'
              : 'backdrop-blur-sm bg-white/30 border-2 border-white/50 text-gray-800 hover:bg-white/50'
          }`}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );

  return (
    <div>
      {/* ─── Hero ─── */}
      <section className="relative -mt-8 -mx-6 md:-mx-8 lg:-mx-12 mb-8">
        {/* Desktop */}
        <div className="hidden lg:flex min-h-screen flex-col">
          <div className="flex-1 flex items-center justify-start">
            <div className="max-w-2xl px-8 xl:px-16">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-left"
              >
                <p className={`text-6xl font-bold mb-8 py-3 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {typedText}
                  <span className="animate-pulse">|</span>
                </p>
                {heroButtons()}
              </motion.div>
            </div>
          </div>
          <StatBar />
        </div>

        {/* Mobile */}
        <div className="lg:hidden relative min-h-screen flex flex-col pt-1">
          <div className="relative z-10 flex-grow flex items-center justify-center pt-1">
            <div className="w-full px-6">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center space-y-6"
              >
                <h2 className={`text-4xl font-bold drop-shadow-lg pt-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {typedText}
                  <span className="animate-pulse">|</span>
                </h2>
                {heroButtons(true)}
              </motion.div>
            </div>
          </div>
          <StatBar />
        </div>
      </section>

      {/* ─── Featured Projects ─── */}
      <section className="py-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-green-900'}`}>
              Featured Projects
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer bg-white"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <img src={project.image} alt={project.title} className="w-full h-48 object-cover" />
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2 text-black">{project.title}</h3>
                  <p className="text-gray-600 mb-4">{project.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {project.tech.map((t) => (
                      <span
                        key={`${project.id}-${t}`}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {t}
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

      {/* ─── Recent Posts ─── */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-green-900'}`}>
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
                className="rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer bg-white"
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