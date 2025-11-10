
import { 
  useNavigate, 
  useLoaderData
} from 'react-router-dom';
import { motion} from 'framer-motion';

// Mock Data Store
const mockData = {
  projects: [
    {
      id: '1',
      title: 'Rick and Morty Website',
      description: 'Full-stack website that displays data from the Rick and Morty API',
      tech: ['React', 'Node.js', 'MongoDB', 'API Integration'],
      image: 'https://images.unsplash.com/photo-1579547945413-497e1b99dac0?w=800',
      github: 'https://github.com/Adamsomondi/Rick-and-Morty',
      demo: 'https://mortymultiverse.netlify.app/',
      featured: true
    },
    {
      id: '2', 
      title: 'Whisper AI',
      description: 'Implementation of OpenAI\'s Whisper model for speech-to-text transcription',
      tech: ['Python', 'Machine Learning', 'OpenAI', 'Flask'],
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

export const projectDetailLoader = async ({ params }) => {
  await delay(400);
  const project = mockData.projects.find(p => p.id === params.id);
  if (!project) {
    throw new Response('Project not found', { status: 404 });
  }
  return { project };
};

const ProjectDetailPage = () => {
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
            className="flex items-center text-blue-600 hover:text-blue-800 mb-8"
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {project.title}
            </h1>
            <p className="text-xl text-gray-600 mb-6">{project.description}</p>
            
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
                className="bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
              >
                View Code
              </a>
              <a
                href={project.demo}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Live Demo
              </a>
            </div>
          </div>

          <div className="prose max-w-none">
            <h2>Project Overview</h2>
            <p>
              This project demonstrates modern web development practices using 
              React and related technologies. It showcases responsive design, 
              state management, and user-friendly interfaces.
            </p>
            
            <h2>Key Features</h2>
            <ul>
              <li>Responsive design that works on all devices</li>
              <li>Modern UI with smooth animations</li>
              <li>Optimized performance and accessibility</li>
              <li>Clean, maintainable code structure</li>
            </ul>

            <h2>Technical Details</h2>
            <p>
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