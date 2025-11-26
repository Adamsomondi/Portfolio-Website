import React, { Suspense, lazy } from 'react';
import {  
  createBrowserRouter, 
  Navigate
} from 'react-router-dom';

// Pages
import HomePage, { homeLoader } from '../pages/HomePage';
import AboutPage, { aboutLoader } from '../pages/AboutPage';
import ProjectsPage, { projectsLoader } from '../pages/ProjectsPage';
import ProjectDetailPage, { projectDetailLoader } from '../pages/ProjectDetailPage';
import BlogPage, { blogLoader } from '../pages/BlogPage';
import ContactPage, { contactAction } from '../pages/ContactPage';
import BlogPostPage, { blogPostLoader } from '../pages/BlogPostPage';
import LandingPage from '../pages/LandingPage';

// Shared
import Layout from '../components/Layout';
import ErrorPage from '../pages/ErrorPage';
import LoadingSpinner from '../components/loadingSpinner';

// Lazy
const LazyAbout = lazy(() => Promise.resolve({ default: AboutPage }));
const LazyProjects = lazy(() => Promise.resolve({ default: ProjectsPage }));
const LazyProjectDetail = lazy(() => Promise.resolve({ default: ProjectDetailPage }));
const LazyBlog = lazy(() => Promise.resolve({ default: BlogPage }));
const LazyBlogPost = lazy(() => Promise.resolve({ default: BlogPostPage }));
const LazyContact = lazy(() => Promise.resolve({ default: ContactPage }));

const router = createBrowserRouter([
  // Landing page route - ALWAYS shows when visiting root
  {
    path: '/',
    element: <LandingPage />,
    errorElement: <ErrorPage />
  },
  
  // Main app routes (with layout)
  {
    path: '/home',
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <HomePage />,
        loader: homeLoader
      }
    ]
  },
  {
    path: '/about',
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <LazyAbout />
          </Suspense>
        ),
        loader: aboutLoader
      }
    ]
  },
  {
    path: '/projects',
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <LazyProjects />
          </Suspense>
        ),
        loader: projectsLoader
      },
      {
        path: ':id',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <LazyProjectDetail />
          </Suspense>
        ),
        loader: projectDetailLoader
      }
    ]
  },
  {
    path: '/blog',
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <LazyBlog />
          </Suspense>
        ),
        loader: blogLoader
      },
      {
        path: ':id',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <LazyBlogPost />
          </Suspense>
        ),
        loader: blogPostLoader
      }
    ]
  },
  {
    path: '/contact',
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <LazyContact />
          </Suspense>
        ),
        action: contactAction
      }
    ]
  },
  {
    path: '/redirect-demo',
    element: <Navigate to="/projects" replace />
  },
  // Catch-all route for 404
  {
    path: '*',
    element: <ErrorPage />
  }
]);

export default router;