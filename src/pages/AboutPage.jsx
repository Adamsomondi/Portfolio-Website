//This is the About Page.
import { 
  useLoaderData
} from 'react-router-dom';
import { motion} from 'framer-motion';
import { 
  CheckIcon
} from '@heroicons/react/24/outline';

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
    name: 'Adams Omondi',
    title: 'Data Engineer & Data Analyst',
    bio: 'I build reliable data infrastructure and optimize robust pipelines that transform raw data into trusted, actionable insights — empowering smarter decisions, measurable growth, and solutions tailored to your business goals',
    skills: ["Python", "R", "SQL", "Spark", "Airflow", "Kafka", "AWS", "Snowflake", "Databricks", "Docker", "Kubernetes", "Excel", "Power BI", "Tableau", "Looker", "Statistics", "Data Visualization", "Machine Learning","Artificial Intelligence"],
    experience: '8+ years',
    location: 'San Francisco, CA'
  }
};

// Simulate API delays
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const aboutLoader = async () => {
  await delay(400);
  return { profile: mockData.profile };
};

const AboutPage = () => {
  const { profile } = useLoaderData();

  return (
    <div className="py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">About Me</h1>
            <p className="text-xl text-gray-600">{profile.bio}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-semibold mb-6">Background</h2>
              <div className="space-y-4 text-gray-600">
                <p>
               I am  an independent Data Engineer, Data Analyst, and Software Engineer 
               working with companies and other engineers at the edge of new frontiers.
               </p>
               <p>
               My journey began with a curiosity about how data and systems work, and it has 
               evolved into a career focused on building reliable data pipelines, uncovering 
               actionable insights, and developing scalable software solutions.
             </p>
              <p>
               When I'm not engineering systems, you can find me exploring new technologies, 
               contributing to open-source projects, or sharing knowledge through blog posts 
               and community talks.
              </p>
              </div>
              </div>
               <div>
              <h2 className="text-2xl font-semibold mb-6">Skills & Expertise</h2>
              <div className="grid grid-cols-2 gap-4">
                {profile.skills.map((skill) => (
                  <div
                    key={skill}
                    className="flex items-center p-3 bg-blue-50 rounded-lg"
                  >
                    <CheckIcon className="w-5 h-5 text-blue-600 mr-3" />
                    <span className="font-medium">{skill}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 space-y-4">
                <div className="flex justify-between">
                  <span className="font-medium">Experience:</span>
                  <span className="text-blue-600">{profile.experience}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Location:</span>
                  <span className="text-blue-600">{profile.location}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
export default AboutPage;