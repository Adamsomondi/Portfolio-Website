import React, { useState } from 'react';
import { useNavigate, useLoaderData, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';

export const projectsLoader = async () => {
  const projects = await api.getProjects();
  return { projects };
};

const ProjectsPage = () => {
  const { isDark } = useOutletContext();
  const { projects } = useLoaderData();
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  const categories = ['all', ...new Set(projects.flatMap((p) => p.tech))];
  const filtered = filter === 'all' ? projects : projects.filter((p) => p.tech.includes(filter));

  return (
    <div className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className={`text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            My Projects
          </h1>
          <p className={`text-xl ${isDark ? 'text-white' : 'text-gray-600'}`}>
            A collection of my professional work
          </p>
        </div>

        {/* Filter buttons — plain buttons, no Headless UI Tab overhead */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {categories.slice(0, 8).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === cat
                  ? 'bg-blue-600 text-white'
                  : isDark
                  ? 'text-blue-300 hover:bg-white/10 hover:text-white'
                  : 'text-blue-700 hover:bg-blue-200 hover:text-blue-900'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {/* Projects grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filtered.map((project) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <img src={project.image} alt={project.title} className="w-full h-48 object-cover" />
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2 text-black">{project.title}</h3>
                  <p className="text-gray-600 mb-4">{project.description}</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.tech.map((t) => (
                      <span
                        key={`${project.id}-${t}`}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {t}
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
                    {project.demo &&
                      (project.internal ? (
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
                      ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ProjectsPage;