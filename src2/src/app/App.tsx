import { RouterProvider } from 'react-router-dom';
import { router } from './routes';

console.log("App component loaded");

export default function App() {
  console.log("App rendering with router");
  return (
    <RouterProvider router={router} />
  );
}
