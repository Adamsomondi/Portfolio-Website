//This is the projects page.
import React, { useState} from 'react';
import {  
  useNavigate, 
  useLoaderData, 
} from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {Tab} from '@headlessui/react';

// Mock Data Store
const mockData = {
  projects: [
    {
      id: '1',
      title: 'E-Commerce Platform',
      description: 'Full-stack e-commerce solution with React and Node.js',
      tech: ['React', 'Node.js', 'MongoDB', 'Stripe'],
      image: 'https://via.placeholder.com/400x300/3B82F6/white?text=E-Commerce',
      github: 'https://github.com/example/ecommerce',
      demo: 'https://demo.example.com',
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

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const projectsLoader = async () => {
  await delay(600);
  return { projects: mockData.projects };
};

const ProjectsPage = () => {
  const { projects } = useLoaderData();
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  const categories = ['all', ...new Set(projects.flatMap(p => p.tech))];
  const filteredProjects = filter === 'all' 
    ? projects 
    : projects.filter(p => p.tech.includes(filter));

  return (
    <div className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">My Projects</h1>
          <p className="text-xl text-gray-600">
            A collection of my work and side projects
          </p>
        </div>

        {/* Filter Tabs */}
        <Tab.Group>
          <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1 mb-8">
            {categories.slice(0, 6).map((category) => (
              <Tab
                key={category}
                onClick={() => setFilter(category)}
                className={({ selected }) =>
                  `w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-blue-700 ${
                    selected
                      ? 'bg-white shadow'
                      : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                  }`
                }
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Tab>
            ))}
          </Tab.List>
        </Tab.Group>

        {/* Projects Grid */}
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          <AnimatePresence>
            {filteredProjects.map((project) => (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ scale: 1.05 }}
                className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer"
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
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.tech.map((tech) => (
                      <span
                        key={tech}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                  <div className="flex space-x-4">
                    <a
                      href={project.github}
                      className="text-blue-600 hover:text-blue-800"
                      onClick={(e) => e.stopPropagation()}
                    >
                      GitHub
                    </a>
                    <a
                      href={project.demo}
                      className="text-blue-600 hover:text-blue-800"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Live Demo
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default ProjectsPage;