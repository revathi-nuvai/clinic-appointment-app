import React from 'react';
import { useNavigate } from 'react-router-dom';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-blue-700 mb-4">Clinic Appointment System</h1>
      <p className="text-gray-600 mb-8">Book appointments with top doctors easily</p>
      <div className="flex gap-4">
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Login
        </button>
        <button
          onClick={() => navigate('/register')}
          className="px-6 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
        >
          Register
        </button>
      </div>
    </div>
  );
};

export default Landing;
