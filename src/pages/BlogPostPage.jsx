import React, {Suspense} from 'react';
import {  
  useNavigate, 
  useLoaderData, 
  Await,
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

export const blogPostLoader = async ({ params }) => {
  await delay(300);
  const post = mockData.blogPosts.find(p => p.id === params.id);
  if (!post) {
    throw new Response('Post not found', { status: 404 });
  }
   // Simulate deferred loading for comments
  const commentsPromise = delay(2000).then(() => [
    { id: 1, author: 'Alice', content: 'Great post!', date: '2024-01-16' },
    { id: 2, author: 'Bob', content: 'Very helpful, thanks!', date: '2024-01-17' }
  ]);
  
  return defer({
    post,
    comments: commentsPromise
  });
};

const BlogPostPage = () => {
  const { post, comments } = useLoaderData();
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
            onClick={() => navigate('/blog')}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-8"
          >
            ← Back to Blog
          </button>

          <article className="mb-12">
            <header className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {post.title}
              </h1>
              <div className="flex items-center space-x-4 text-gray-500 mb-6">
                <span>{post.author}</span>
                <span>•</span>
                <span>{post.date}</span>
                <span>•</span>
                <span>{post.readTime}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </header>

            <div className="prose max-w-none">
              <p className="text-xl text-gray-600 mb-8">{post.excerpt}</p>
              <div className="text-gray-800 leading-relaxed">
                {post.content}
              </div>
            </div>
          </article>

          {/* Comments Section with Deferred Loading */}
          <section className="border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Comments</h2>
            <Suspense fallback={
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading comments...</span>
              </div>
            }>
              <Await resolve={comments}>
                <CommentsSection />
              </Await>
            </Suspense>
          </section>
        </motion.div>
      </div>
    </div>
  );
};
export default BlogPostPage;