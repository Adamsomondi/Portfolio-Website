//This is the About Page.
import { 
  useLoaderData
} from 'react-router-dom';
import { motion} from 'framer-motion';
import { 
  CheckIcon
} from '@heroicons/react/24/outline';

// Mock Data Store
const mockData = {
  profile: {
    name: 'Adams Omondi',
    title: 'Data Engineer & Data Analyst',
    bio: 'I build reliable modern Software solutions and optimize  robust data pipelines that transform raw data into trusted, actionable insights — empowering smarter decisions, measurable growth, and solutions tailored to your business goals',
    skills: ["Python", "NextJS", "SQL", "React", "AWS", "Databricks", "Angular", "C++", "Excel", "Power BI", "Tableau", "Looker", "Statistics", "Data Visualization", "Machine Learning","Artificial Intelligence"],
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