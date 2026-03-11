import { RouterProvider } from 'react-router-dom';
import router from './routes';
import LoadingSpinner from './components/loadingSpinner';

const App = () => {
  return (
    <div className="App">
      <RouterProvider router={router} fallbackElement={<LoadingSpinner />} />
    </div>
  );
};

export default App;