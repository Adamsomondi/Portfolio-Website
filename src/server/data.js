// server/data.js — Single source of truth for all portfolio data

// ============================================
// PROJECTS
// ============================================
export const projects = [
  {
    id: '1',
    title: 'Buildafrique Group — Investor & Land Banking Database',
    description:
      'Enterprise internal database system for Buildafrique Group with role-based access, investor tracking, land banking, and an analytics dashboard.',
    longDescription:
      'A full-stack internal platform built for Buildafrique Group, a real estate investment firm. The system manages a global investor database filtered by asset class, region, and country, alongside a Kenyan land banking module with property listings, document uploads, and price filtering. Authentication is handled via JWT with four distinct roles: Admin, Full Viewer, Investor Viewer, and Property Viewer — each seeing only what they are permitted to access. The backend runs on Express and PostgreSQL hosted on Neon, deployed to Render. The frontend is deployed on Vercel.',
    tech: [
      'React',
      'Node.js',
      'Express',
      'PostgreSQL',
      'Neon',
      'JWT Auth',
      'Render',
      'Vercel',
      'Tailwind CSS'
    ],
    image: '/images/projects/adams.png',
    github: '', // private client repo — leave empty
    demo: 'https://buildafrique-b-6k8j2n9x1.vercel.app/investors',
    featured: true,
    highlights: [
      'Role-based access control — Admin, Full Viewer, Investor Viewer, Property Viewer',
      'Global investor database filterable by asset class, region, country, and priority score',
      'Land banking module with property photos, deed plan uploads, and price range filters',
      'Analytics dashboard with charts and cross-module stats',
      'JWT authentication with auto token refresh and session persistence',
      'Admin dashboard for creating, editing, deactivating, and permanently deleting users',
      'Viewed-item tracking per session so analysts know what they have already reviewed',
      'Deployed across Neon (database), Render (API), and Vercel (frontend)'
    ]
  }

  // More projects go here — Rick and Morty, Whisper AI, Bank Churn etc.
];

// ============================================
// BLOG POSTS
// ============================================
export const blogPosts = [
  {
    id: '1',
    title: 'The Why Behind Relational Database Design: Normalization Explained',
    excerpt:
      'Understanding data anomalies, redundancy, and the normalization process that ensures reliable and efficient relational databases',
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
    author: 'Adams Omondi',
    date: '2024-12-15',
    readTime: '8 min read',
    tags: ['Databases', 'SQL', 'RDBMS', 'Normalization', 'Data Architecture']
  },
  {
    id: '2',
    title: 'MongoDB Architecture: Embracing Denormalization for Performance',
    excerpt:
      "Exploring MongoDB's approach to data modeling, where duplication and denormalization become strategic advantages",
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
    author: 'Adams Omondi',
    date: '2024-12-10',
    readTime: '10 min read',
    tags: ['MongoDB', 'NoSQL', 'Databases', 'Sharding', 'Replication', 'Scalability']
  }
];

// ============================================
// PROFILE
// ============================================
export const profile = {
  name: 'Adams Omondi',
  title: 'Software Engineer',
  bio: 'I design and build full-stack systems that work in production — from JWT-secured APIs and role-based dashboards to data pipelines that turn raw information into decisions. I care about correctness, performance, and shipping things that last.',
  skills: [
    'Python', 'NextJS', 'SQL', 'React', 'AWS', 'Databricks',
    'Angular', 'C++', 'Excel', 'Power BI', 'Tableau', 'Looker',
    'Statistics', 'Data Visualization', 'Machine Learning', 'Artificial Intelligence'
  ],
  experience: '3+ years',
  location: 'Nairobi, Kenya',
  email: 'Adamsnogo025@gmail.com',
  phone: '+254715485763',
  social: {
    github: 'https://github.com/Adamsomondi',
    linkedin: 'https://www.linkedin.com/in/adams-omondi-338b94304',
    twitter: 'https://x.com/deepneuralmess'
  }
};