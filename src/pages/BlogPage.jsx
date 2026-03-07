// This is the Blog Page with Dark Mode Support using Outlet Context
import { useNavigate, useLoaderData, useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../lib/api';

// ── Loader ────────────────────────────────────────────────────────────────────
export const blogLoader = async () => {
  const posts = await api.getBlogPosts();
  return { posts };
};

const BlogPage = () => {
  const { isDark } = useOutletContext();
  const { posts } = useLoaderData();
  const navigate = useNavigate();

  return (
    <div className="py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className={`text-4xl font-bold mb-4 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Blog
          </h1>
          <p className={`text-xl ${
            isDark ? 'text-white' : 'text-gray-600'
          }`}>
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
              
              <h2 className="text-2xl font-bold text-black mb-4 hover:text-blue-600 transition-colors">
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