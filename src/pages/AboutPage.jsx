//This is the About Page with Dark Mode Support using Outlet Context
import { 
  useLoaderData,
  useOutletContext
} from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  CheckIcon
} from '@heroicons/react/24/outline';

// Mock Data Store
const mockData = {
  profile: {
    name: 'Adams Omondi',
    title: 'Data Engineer & Data Analyst',
    bio: 'I build reliable modern Software solutions and optimize robust data pipelines that transform raw data into trusted, actionable insights — empowering smarter decisions, measurable growth, and solutions tailored to your business goals',
    skills: ["Python", "NextJS", "SQL", "React", "AWS", "Databricks", "Angular", "C++", "Excel", "Power BI", "Tableau", "Looker", "Statistics", "Data Visualization", "Machine Learning", "Artificial Intelligence"],
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
          <div className="text-center mb-12">
            <h1 className={`text-4xl font-bold mb-4 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              About Me
            </h1>
            <p className={`text-xl ${
              isDark ? 'text-white' : 'text-gray-600'
            }`}>
              {profile.bio}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className={`text-2xl font-semibold mb-6 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Background
              </h2>
              <div className={`space-y-4 ${
                isDark ? 'text-white' : 'text-gray-600'
              }`}>
                <p>
                  I am an independent Data Engineer, Data Analyst, and Software Engineer 
                  working with companies and other engineers at the edge of new frontiers.
                </p>
                <p>
                  My belief is that Technology should amplify human 
                  creativity, not replace human judgment.
                </p>
                <p>
                  When I'm not engineering systems, you can find me exploring new technologies, 
                  contributing to open-source projects, or sharing knowledge through blog posts 
                  and community talks.
                </p>
              </div>
            </div>
            
            <div>
              <h2 className={`text-2xl font-semibold mb-6 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Skills & Expertise
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {profile.skills.map((skill) => (
                  <div
                    key={skill}
                    className={`flex items-center p-3 rounded-lg ${
                      isDark 
                        ? 'bg-blue-900/30' 
                        : 'bg-blue-50'
                    }`}
                  >
                    <CheckIcon className={`w-5 h-5 mr-3 ${
                      isDark ? 'text-blue-400' : 'text-blue-600'
                    }`} />
                    <span className={`font-medium ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      {skill}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-8 space-y-4">
                <div className="flex justify-between">
                  <span className={`font-medium ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    Experience:
                  </span>
                  <span className={`${
                    isDark ? 'text-blue-400' : 'text-blue-600'
                  }`}>
                    {profile.experience}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={`font-medium ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    Location:
                  </span>
                  <span className={`${
                    isDark ? 'text-blue-400' : 'text-blue-600'
                  }`}>
                    {profile.location}
                  </span>
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