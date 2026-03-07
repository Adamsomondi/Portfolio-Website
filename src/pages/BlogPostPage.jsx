// This is the Blog Post Detail Page with Dark Mode Support using Outlet Context
import React, { useState, useEffect } from 'react';
import { useNavigate, useLoaderData, useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../lib/api';

// ── Loader ────────────────────────────────────────────────────────────────────
export const blogPostLoader = async ({ params }) => {
  const post = await api.getBlogPost(params.id);
  return { post };
};

// Comments Section Component
const CommentsSection = ({ comments, isDark }) => {
  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div 
          key={comment.id} 
          className={`p-4 rounded-lg shadow-sm border ${
            isDark 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`font-medium ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              {comment.author}
            </span>
            <span className={`text-sm ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {comment.date}
            </span>
          </div>
          <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
            {comment.content}
          </p>
        </div>
      ))}
    </div>
  );
};

const BlogPostPage = () => {
  const { isDark } = useOutletContext();
  const { post } = useLoaderData();
  const navigate = useNavigate();
  const [comments, setComments] = useState(null);
  const [loadingComments, setLoadingComments] = useState(true);

  // Load comments after component mounts (simulating deferred loading)
  useEffect(() => {
    const loadComments = async () => {
      await delay(2000);
      setComments([
        { id: 1, author: 'James Mwangi', content: 'Great post!', date: '2024-01-16' },
        { id: 2, author: 'Kevin Omachi', content: 'Very helpful, thanks!', date: '2024-01-17' }
      ]);
      setLoadingComments(false);
    };
    
    loadComments();
  }, []);

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
            className={`flex items-center mb-8 font-medium ${
              isDark 
                ? 'text-blue-400 hover:text-blue-300' 
                : 'text-blue-600 hover:text-blue-800'
            }`}
          >
            ← Back to Blog
          </button>

          <article className="mb-12">
            <header className="mb-8">
              <h1 className={`text-4xl font-bold mb-4 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {post.title}
              </h1>
              <div className={`flex items-center space-x-4 mb-6 ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
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
                    className={`px-3 py-1 text-sm rounded-full ${
                      isDark
                        ? 'bg-blue-900 text-blue-200'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </header>

            <div className="prose max-w-none">
              <p className={`text-xl mb-8 ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {post.excerpt}
              </p>
              <div className={`leading-relaxed whitespace-pre-line ${
                isDark ? 'text-gray-300' : 'text-gray-800'
              }`}>
                {post.content}
              </div>
            </div>
          </article>

          {/* Comments Section with Loading State */}
          <section className={`border-t pt-8 ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <h2 className={`text-2xl font-bold mb-6 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Comments
            </h2>
            
            {loadingComments ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className={`ml-3 ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Loading comments...
                </span>
              </div>
            ) : (
              <CommentsSection comments={comments} isDark={isDark} />
            )}
          </section>
        </motion.div>
      </div>
    </div>
  );
};

export default BlogPostPage;