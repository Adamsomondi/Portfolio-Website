//This is the Project Detail Page with Dark Mode Support using Outlet Context
import { 
  useNavigate, 
  useLoaderData,
  useOutletContext
} from 'react-router-dom';
import { motion } from 'framer-motion';
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
      tech: ['React', 'Node.js', 'MongoDB', 'API Integration'],
      image: Rick,
      github: 'https://github.com/Adamsomondi/Rick-and-Morty',
      demo: 'https://mortymultiverse.netlify.app/',
      featured: true
    },
    {
      id: '2', 
      title: 'Whisper AI',
      description: 'Implementation of OpenAI\'s Whisper model for speech-to-text transcription',
      tech: ['Python', 'Machine Learning', 'OpenAI', 'Flask'],
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

export const projectDetailLoader = async ({ params }) => {
  await delay(400);
  const project = mockData.projects.find(p => p.id === params.id);
  if (!project) {
    throw new Response('Project not found', { status: 404 });
  }
  return { project };
};

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
              {project.demo && (
                <a
                  href={project.demo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Live Demo
                </a>
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
              This project demonstrates modern web development practices using 
              React and related technologies. It showcases responsive design, 
              state management, and user-friendly interfaces.
            </p>
            
            <h2 className={`text-2xl font-bold mb-4 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Key Features
            </h2>
            <ul className={`list-disc list-inside mb-6 space-y-2 ${
              isDark ? 'text-white' : 'text-gray-600'
            }`}>
              <li>Responsive design that works on all devices</li>
              <li>Modern UI with smooth animations</li>
              <li>Optimized performance and accessibility</li>
              <li>Clean, maintainable code structure</li>
            </ul>

            <h2 className={`text-2xl font-bold mb-4 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Technical Details
            </h2>
            <p className={`${
              isDark ? 'text-white' : 'text-gray-600'
            }`}>
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