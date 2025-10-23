
import {  
  useNavigate, 
  useLoaderData
} from 'react-router-dom';
import { motion } from 'framer-motion';

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

 export const blogLoader = async () => {
  await delay(500);
  return { posts: mockData.blogPosts };
};

const BlogPage = () => {
  const { posts } = useLoaderData();
  const navigate = useNavigate();

  return (
    <div className="py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Blog</h1>
          <p className="text-xl text-gray-600">
            Thoughts on development, design, and technology
          </p>
        </div>

        <div className="space-y-8">
          {posts.map((post, index) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/blog/${post.id}`)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>{post.date}</span>
                  <span>•</span>
                  <span>{post.readTime}</span>
                  <span>•</span>
                  <span>{post.author}</span>
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4 hover:text-blue-600 transition-colors">
                {post.title}
              </h2>
              
              <p className="text-gray-600 mb-4 line-clamp-3">
                {post.excerpt}
              </p>
              
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </div>
  );
};
export default BlogPage;