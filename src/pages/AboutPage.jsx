//This is the About Page.
import { 
  useLoaderData
} from 'react-router-dom';
import { motion} from 'framer-motion';
import { 
  CheckIcon
} from '@heroicons/react/24/outline';

// Mock Data Store
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
  },
],
  profile: {
    name: 'Adams Omondi',
    title: 'Data Engineer & Data Analyst',
    bio: 'I build reliable data infrastructure and optimize robust pipelines that transform raw data into trusted, actionable insights — empowering smarter decisions, measurable growth, and solutions tailored to your business goals',
    skills: ["Python", "R", "SQL", "Spark", "Airflow", "Kafka", "AWS", "Snowflake", "Databricks", "Docker", "Kubernetes", "Excel", "Power BI", "Tableau", "Looker", "Statistics", "Data Visualization", "Machine Learning","Artificial Intelligence"],
    experience: '3+ years',
    location: 'Nairobi, Kenya'
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