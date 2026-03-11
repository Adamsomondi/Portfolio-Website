// This is the Project Detail Page with Dark Mode Support using Outlet Context
import {
  useNavigate,
  useLoaderData,
  useOutletContext
} from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../lib/api';

// ── Loader ────────────────────────────────────────────────────────────────────
export const projectDetailLoader = async ({ params }) => {
  const project = await api.getProject(params.id);
  return { project };
};

// ── Component ─────────────────────────────────────────────────────────────────
const ProjectDetailPage = () => {
  const { isDark } = useOutletContext();
  const { project } = useLoaderData();
  const navigate = useNavigate();

  return (
    <div className="py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <button
            onClick={() => navigate('/projects')}
            className={`flex items-center mb-8 font-medium ${
              isDark
                ? 'text-blue-400 hover:text-blue-300'
                : 'text-blue-600 hover:text-blue-800'
            }`}
          >
            ← Back to Projects
          </button>

          <div className="mb-8">
            <img
              src={project.image}
              alt={project.title}
              className="w-full h-64 object-cover rounded-lg shadow-lg"
            />
          </div>

          <div className="mb-8">
            <h1 className={`text-4xl font-bold mb-4 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              {project.title}
            </h1>

            <p className={`text-xl mb-6 ${
              isDark ? 'text-white' : 'text-gray-600'
            }`}>
              {project.description}
            </p>

            <div className="flex flex-wrap gap-2 mb-6">
              {project.tech.map((tech) => (
                <span
                  key={tech}
                  className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full"
                >
                  {tech}
                </span>
              ))}
            </div>

            <div className="flex space-x-4">
              {/* Only render GitHub button when repo is public */}
              {project.github && (
                <a
                  href={project.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`px-6 py-3 rounded-lg transition-colors font-medium ${
                    isDark
                      ? 'bg-white text-black hover:bg-gray-200'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  View Code
                </a>
              )}

              {project.demo && (
                project.internal ? (
                  <button
                    onClick={() => navigate(project.demo)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Launch Demo
                  </button>
                ) : (
                  <a
                    href={project.demo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Live Demo
                  </a>
                )
              )}
            </div>
          </div>

          <div className="prose max-w-none">
            <h2 className={`text-2xl font-bold mb-4 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Project Overview
            </h2>
            <p className={`mb-6 ${
              isDark ? 'text-white' : 'text-gray-600'
            }`}>
              {project.longDescription}
            </p>

            <h2 className={`text-2xl font-bold mb-4 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Key Features
            </h2>
            <ul className={`list-disc list-inside mb-6 space-y-2 ${
              isDark ? 'text-white' : 'text-gray-600'
            }`}>
              {project.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <h2 className={`text-2xl font-bold mb-4 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Technical Details
            </h2>
            <p className={isDark ? 'text-white' : 'text-gray-600'}>
              Built with {project.tech.join(', ')}, this project follows
              industry best practices for scalability and maintainability.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProjectDetailPage;