//This is the Comment Page.
import {
  useAsyncValue
} from 'react-router-dom';
import { motion } from 'framer-motion';

const CommentsSection = () => {
  const comments = useAsyncValue();
  
  return (
    <div className="space-y-6">
      {comments.map((comment) => (
        <motion.div
          key={comment.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gray-50 rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">{comment.author}</h3>
            <span className="text-sm text-gray-500">{comment.date}</span>
          </div>
          <p className="text-gray-700">{comment.content}</p>
        </motion.div>
      ))}
    </div>
  );
};
export default CommentsSection;