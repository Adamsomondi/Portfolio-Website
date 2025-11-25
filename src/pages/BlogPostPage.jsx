//This is the Blog Post Detail Page with Dark Mode Support using Outlet Context
import React, { Suspense } from 'react';
import {  
  useNavigate, 
  useLoaderData, 
  Await,
  useOutletContext,
} from 'react-router-dom';
import { motion } from 'framer-motion';

// Mock Data Store
const mockData = {
  blogPosts: [
    {
      id: '1',
      title: 'The Why Behind Relational Database Design: Normalization Explained',
      excerpt: 'Understanding data anomalies, redundancy, and the normalization process that ensures reliable and efficient relational databases',
      content: `In the world of structured relational databases, two fundamental principles guide our design decisions: ensuring data reliability and maintaining operational efficiency. These principles are achieved through careful attention to avoiding data anomalies and reducing data redundancy.

## Understanding the Core Problems

In a relational database management system (RDBMS), a data anomaly represents an inconsistency in your dataset that results from write operations—whether inserting, deleting, or updating records. Meanwhile, data redundancy refers to the unnecessary duplication of data across different tables. This duplication creates a dangerous scenario where data can become inconsistent, making data integrity increasingly difficult to maintain as your system grows.

## The Normalization Solution

Normalization provides a systematic approach to organizing data that addresses these challenges through progressive refinement:

**First Normal Form (1NF)** eliminates duplicate data and simplifies query operations by ensuring each table cell contains only atomic values.

**Second Normal Form (2NF)** takes the next step by eliminating redundant data, requiring that all non-key attributes are fully dependent on the primary key—not just part of it.

**Third Normal Form (3NF)** ensures that all attributes are functionally dependent only on the primary key, removing transitive dependencies that could lead to update anomalies.

**Boyce-Codd Normal Form (BCNF)** represents a stricter interpretation of 3NF, where every non-trivial dependency must be a super key, closing potential loopholes in the normalization process.

**Fourth Normal Form (4NF)** ensures that tables don't contain multi-valued dependencies, further refining the data structure.

**Fifth Normal Form (5NF)** represents the highest level of normalization, involving the decomposition of tables into smaller structures to eliminate any remaining redundancy while preserving all information.

Understanding these normalization forms provides the foundation for designing robust, maintainable relational database systems that scale effectively with your application's needs.`,
      author: 'Adams',
      date: '2024-12-15',
      readTime: '8 min read',
      tags: ['Databases', 'SQL', 'RDBMS', 'Normalization', 'Data Architecture']
    },
    {
      id: '2',
      title: 'MongoDB Architecture: Embracing Denormalization for Performance',
      excerpt: 'Exploring MongoDB\'s approach to data modeling, where duplication and denormalization become strategic advantages',
      content: `Unlike traditional relational databases that prioritize normalization, MongoDB takes a fundamentally different approach—one that frequently employs both data duplication and denormalization for valid performance and flexibility reasons.

## Understanding MongoDB's Design Philosophy

The pivotal step in MongoDB's design process involves clearly defining your data retrieval needs, which effectively determines the structure of your system entities. This document-oriented approach allows for more natural data modeling that aligns with how applications actually consume data.

## The Technical Foundation

MongoDB operates as a database server that communicates using a binary protocol called the MongoDB Wire Protocol. Internally, data is stored as BSON (Binary JSON), which provides efficient encoding and decoding of documents. Since programming languages speak their own dialects, MongoDB drivers act as the bridge, translating between your application code and the database.

A critical architectural constraint: a MongoDB replica set can only have one primary node at any given time. This design choice enables MongoDB to offer the flexibility needed for building transactional, operational, and analytical applications.

## Replication: Ensuring Data Availability

Replication forms a crucial component of MongoDB's distributed architecture, ensuring data accessibility and resilience to faults. By spreading identical datasets across various database servers, replication safeguards against single points of failure. When one server goes down, your application continues running seamlessly.

## Sharding: Horizontal Scaling Strategy

As applications gain popularity and data volumes increase, sharding becomes essential—a horizontal scaling strategy for distributing data across multiple machines. This approach divides a larger database into smaller, more manageable parts called shards, with each shard storing a portion of the total dataset on a separate database server instance.

It's important to note that each shard must also implement replication to maintain data integrity and availability, creating a multi-layered approach to fault tolerance.

## Scaling Strategies Compared

**Vertical scaling** enhances a single server's capacity by upgrading hardware—more powerful CPUs, increased RAM, or expanded storage. However, technological limitations impose strict upper bounds on what a single machine can handle, creating practical constraints on growth.

**Horizontal scaling**, on the other hand, divides your system's data and workload across multiple servers. Each machine handles only a fraction of the total workload, which can be significantly more cost-effective than investing in increasingly expensive high-end hardware. The tradeoff? Increased infrastructure complexity and more sophisticated system maintenance requirements.

MongoDB's architecture embraces horizontal scaling as a first-class citizen, providing built-in tools and patterns to manage this complexity effectively.`,
      author: 'Adams',
      date: '2024-12-10',
      readTime: '10 min read',
      tags: ['MongoDB', 'NoSQL', 'Databases', 'Sharding', 'Replication', 'Scalability']
    }
  ],
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

// Comments Section Component
const CommentsSection = ({ comments, isDark }) => {
  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div 
          key={comment.id} 
          className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-gray-900">{comment.author}</span>
            <span className="text-sm text-gray-500">{comment.date}</span>
          </div>
          <p className="text-gray-700">{comment.content}</p>
        </div>
      ))}
    </div>
  );
};

const BlogPostPage = () => {
  const { isDark } = useOutletContext();
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
                isDark ? 'text-gray-300' : 'text-gray-500'
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
                    className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </header>

            <div className="prose max-w-none">
              <p className={`text-xl mb-8 ${
                isDark ? 'text-white' : 'text-gray-600'
              }`}>
                {post.excerpt}
              </p>
              <div className={`leading-relaxed whitespace-pre-line ${
                isDark ? 'text-white' : 'text-gray-800'
              }`}>
                {post.content}
              </div>
            </div>
          </article>

          {/* Comments Section with Deferred Loading */}
          <section className={`border-t pt-8 ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <h2 className={`text-2xl font-bold mb-6 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Comments
            </h2>
            <Suspense fallback={
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className={`ml-3 ${
                  isDark ? 'text-white' : 'text-gray-600'
                }`}>
                  Loading comments...
                </span>
              </div>
            }>
              <Await resolve={comments}>
                {(resolvedComments) => (
                  <CommentsSection comments={resolvedComments} isDark={isDark} />
                )}
              </Await>
            </Suspense>
          </section>
        </motion.div>
      </div>
    </div>
  );
};

export default BlogPostPage;