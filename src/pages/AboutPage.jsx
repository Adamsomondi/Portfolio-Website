// This is the About Page with Dark Mode Support using Outlet Context
import { useLoaderData, useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckIcon } from '@heroicons/react/24/outline';
import { api } from '../lib/api';

export const aboutLoader = async () => {
  const profile = await api.getProfile();
  return { profile };
};

const AboutPage = () => {
  const { isDark } = useOutletContext();
  const { profile } = useLoaderData();

  return (
    <div className="py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className={`text-4xl font-bold mb-4 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              About Me
            </h1>
            <p className={`text-xl max-w-2xl mx-auto ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {profile.bio}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

            {/* Background */}
            <div>
              <h2 className={`text-2xl font-semibold mb-6 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Background
              </h2>
              <div className={`space-y-4 leading-relaxed ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <p>
                  I build software that solves real business problems. Most recently that meant
                  designing and shipping a full internal platform for{' '}
                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Buildafrique Group
                  </span>
                  {' '}— a real estate investment firm — that manages a global investor database
                  and a Kenyan land banking module, secured behind JWT authentication with
                  four distinct permission roles. The system runs on PostgreSQL hosted on Neon,
                  an Express API deployed to Render, and a React frontend on Vercel.
                </p>
                <p>
                  I work across the full stack comfortably — React on the frontend,
                  Node.js and Express on the backend, SQL databases for structured data,
                  and Python for data analysis and machine learning when the problem calls for it.
                  I have shipped production systems, not just side projects.
                </p>
                <p>
                  On the data side, I build pipelines, model databases correctly from the start,
                  and produce visualizations that give stakeholders actual clarity rather than
                  noise. I take normalization, indexing, and query performance seriously because
                  bad data architecture is expensive to fix later.
                </p>
                <p>
                  I am based in Nairobi and available for full-time roles, contract work,
                  and technical consulting. If you have a hard problem, I am interested.
                </p>
              </div>
            </div>

            {/* Skills + Meta */}
            <div>
              <h2 className={`text-2xl font-semibold mb-6 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Skills & Expertise
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {profile.skills.map((skill) => (
                  <div
                    key={skill}
                    className={`flex items-center p-3 rounded-lg transition-colors ${
                      isDark
                        ? 'bg-blue-900/30 hover:bg-blue-900/50'
                        : 'bg-blue-50 hover:bg-blue-100'
                    }`}
                  >
                    <CheckIcon className={`w-5 h-5 mr-3 flex-shrink-0 ${
                      isDark ? 'text-blue-400' : 'text-blue-600'
                    }`} />
                    <span className={`font-medium text-sm ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      {skill}
                    </span>
                  </div>
                ))}
              </div>

              {/* Meta */}
              <div className={`mt-8 space-y-3 border-t pt-6 ${
                isDark ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <div className="flex justify-between items-center">
                  <span className={`font-medium ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Experience
                  </span>
                  <span className={`font-semibold ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {profile.experience}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`font-medium ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Location
                  </span>
                  <span className={`font-semibold ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {profile.location}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`font-medium ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Availability
                  </span>
                  <span className="font-semibold text-green-500">
                    Open to work
                  </span>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-6">
                <a
                  href={`mailto:${profile.email}`}
                  className={`w-full flex items-center justify-center px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105 ${
                    isDark
                      ? 'bg-white text-black hover:bg-gray-200'
                      : 'bg-gray-900 text-white hover:bg-gray-700'
                  }`}
                >
                  Let's Work Together →
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AboutPage;