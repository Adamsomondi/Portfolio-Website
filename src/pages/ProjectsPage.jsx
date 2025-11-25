//This is the Projects Page with Dark Mode Support using Outlet Context
import React, { useState } from 'react';
import {  
  useNavigate, 
  useLoaderData,
  useOutletContext
} from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Tab } from '@headlessui/react';
import Rick from '../assets/86a7e2c8-d1b6-49ab-a52d-75ca3fe21a18.jpg';
import Whisper from '../assets/77ac9663ba-8aa4-44bf-867d-6b87c92ce12b.jpg';
import Bank from '../assets/cd726ca8-0c61-45d2-a204-a40675fea986.jpg';

// Mock Data Store
const mockData = {
  projects: [
    {
      id: '1',
      title: 'Rick and Morty Website',
      description: 'Full-stack website that displays data from the Rick and Morty API',
      tech: ['React', 'Node.js', 'MongoDB'],
      image: Rick,
      github: 'https://github.com/Adamsomondi/Rick-and-Morty',
      demo: 'https://mortymultiverse.netlify.app/',
      featured: true
    },
    {
      id: '2', 
      title: 'Whisper AI',
      description: 'Implementation of OpenAI\'s Whisper model for speech-to-text transcription',
      tech: ['Python', 'OpenAI'],
      image: Whisper,
      github: 'https://github.com/Adamsomondi/Whisper-Model',
      demo: '',
      featured: false
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
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const projectsLoader = async () => {
  await delay(600);
  return { projects: mockData.projects };
};

const ProjectsPage = () => {
  const { isDark } = useOutletContext();
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
          <h1 className={`text-4xl font-bold mb-4 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            My Projects
          </h1>
          <p className={`text-xl ${
            isDark ? 'text-white' : 'text-gray-600'
          }`}>
            A collection of my work and hobby side projects
          </p>
        </div>

        {/* Filter Tabs */}
        <Tab.Group>
          <Tab.List className={`flex space-x-1 rounded-xl p-1 mb-8 
          }`}>
            {categories.slice(0, 6).map((category) => (
              <Tab
                key={category}
                onClick={() => setFilter(category)}
                className={({ selected }) =>
                  `w-full rounded-lg py-2.5 text-sm font-medium leading-5 ${
                    selected
                      ? isDark 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-blue-600 text-white'
                      : isDark
                        ? 'text-blue-300 hover:bg-white/[0.12] hover:text-white'
                        : 'text-blue-700 hover:bg-blue-200 hover:text-blue-900'
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
                  <h3 className="text-xl font-semibold mb-2 text-black">
                    {project.title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {project.description}
                  </p>
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
                      className="text-blue-600 hover:text-blue-800 font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      GitHub
                    </a>
                    {project.demo && (
                      <a
                        href={project.demo}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Live Demo
                      </a>
                    )}
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