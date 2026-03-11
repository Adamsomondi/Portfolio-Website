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

// Lazy loaded pages
const LazyAbout = lazy(() => Promise.resolve({ default: AboutPage }));
const LazyProjects = lazy(() => Promise.resolve({ default: ProjectsPage }));
const LazyProjectDetail = lazy(() => Promise.resolve({ default: ProjectDetailPage }));
const LazyBlog = lazy(() => Promise.resolve({ default: BlogPage }));
const LazyBlogPost = lazy(() => Promise.resolve({ default: BlogPostPage }));
const LazyContact = lazy(() => Promise.resolve({ default: ContactPage }));

// Lazy load environment pages
const LazyDesertFace = lazy(() => import('../pages/DesertFacePage'));
const LazyOceanFace = lazy(() => import('../pages/OceanFacePage'));
const LazyForestFace = lazy(() => import('../pages/ForestFacePage'));

const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
    errorElement: <ErrorPage />
  },

  {
    path: '/home',
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <HomePage />, loader: homeLoader }
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

  // ── Environment demos (fullscreen, no Layout wrapper) ──
  {
    path: '/demo/desert',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <LazyDesertFace />
      </Suspense>
    ),
    errorElement: <ErrorPage />
  },
  {
    path: '/demo/ocean',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <LazyOceanFace />
      </Suspense>
    ),
    errorElement: <ErrorPage />
  },
  {
    path: '/demo/forest',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <LazyForestFace />
      </Suspense>
    ),
    errorElement: <ErrorPage />
  },

  { path: '*', element: <ErrorPage /> }
]);

export default router;