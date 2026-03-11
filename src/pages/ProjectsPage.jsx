// This is the Projects Page with Dark Mode Support using Outlet Context
import React, { useState } from 'react';
import {
  useNavigate,
  useLoaderData,
  useOutletContext
} from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Tab } from '@headlessui/react';
import { api } from '../lib/api';

// ── Loader ────────────────────────────────────────────────────────────────────
export const projectsLoader = async () => {
  const projects = await api.getProjects();
  return { projects };
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
            A collection of my professional work
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
                    {project.github && (
                      <a
                        href={project.github}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        GitHub
                      </a>
                    )}
                    {project.demo && (
                      project.internal ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(project.demo);
                          }}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Launch Demo
                        </button>
                      ) : (
                        <a
                          href={project.demo}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Live Demo
                        </a>
                      )
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