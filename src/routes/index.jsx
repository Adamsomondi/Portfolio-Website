import React, { Suspense, lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';

import Layout from '../components/Layout';
import ErrorPage from '../pages/ErrorPage';
import LoadingSpinner from '../components/loadingSpinner';

// ── Eager imports for loaders / actions only ──
import { homeLoader }          from '../pages/HomePage';
import { aboutLoader }         from '../pages/AboutPage';
import { projectsLoader }     from '../pages/ProjectsPage';
import { projectDetailLoader } from '../pages/ProjectDetailPage';
import { blogLoader }          from '../pages/BlogPage';
import { blogPostLoader }      from '../pages/BlogPostPage';
import { contactAction }       from '../pages/ContactPage';

// ── Lazy page components ──
const LandingPage     = lazy(() => import('../pages/LandingPage'));
const HomePage        = lazy(() => import('../pages/HomePage'));
const AboutPage       = lazy(() => import('../pages/AboutPage'));
const ProjectsPage    = lazy(() => import('../pages/ProjectsPage'));
const ProjectDetail   = lazy(() => import('../pages/ProjectDetailPage'));
const BlogPage        = lazy(() => import('../pages/BlogPage'));
const BlogPostPage    = lazy(() => import('../pages/BlogPostPage'));
const ContactPage     = lazy(() => import('../pages/ContactPage'));
const DesertFacePage  = lazy(() => import('../pages/DesertFacePage'));
const ForestFacePage  = lazy(() => import('../pages/ForestFacePage'));

const wrap = (Component) => (
  <Suspense fallback={<LoadingSpinner />}>
    <Component />
  </Suspense>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: wrap(LandingPage),
    errorElement: <ErrorPage />,
  },

  // ── Single Layout wrapper — state persists across pages ──
  {
    id: 'layout',
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      { id: 'home',           path: '/home',          element: wrap(HomePage),      loader: homeLoader },
      { id: 'about',          path: '/about',         element: wrap(AboutPage),     loader: aboutLoader },
      { id: 'projects',       path: '/projects',      element: wrap(ProjectsPage),  loader: projectsLoader },
      { id: 'project-detail', path: '/projects/:id',  element: wrap(ProjectDetail), loader: projectDetailLoader },
      { id: 'blog',           path: '/blog',          element: wrap(BlogPage),      loader: blogLoader },
      { id: 'blog-post',      path: '/blog/:id',      element: wrap(BlogPostPage),  loader: blogPostLoader },
      { id: 'contact',        path: '/contact',       element: wrap(ContactPage),   action: contactAction },
    ],
  },

  // ── Fullscreen demos — no Layout ──
  { id: 'demo-desert', path: '/demo/desert', element: wrap(DesertFacePage), errorElement: <ErrorPage /> },
  { id: 'demo-forest', path: '/demo/forest', element: wrap(ForestFacePage), errorElement: <ErrorPage /> },

  { path: '*', element: <ErrorPage /> },
]);

export default router;