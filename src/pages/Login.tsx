import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithGoogle } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { Apple } from 'lucide-react';

export default function Login() {
  const { user, userData, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && userData) {
      if (userData.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    }
  }, [user, userData, navigate]);

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Login failed', error);
      alert('Failed to sign in. Please try again.');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
           <span className="bg-emerald-500 text-white p-3 rounded-2xl shadow-lg shadow-emerald-200/50">
             <Apple className="w-10 h-10" />
           </span>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Mess Waste Predictor
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 font-medium">
          Sign in to manage your daily meals
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-4 shadow-sm sm:rounded-3xl sm:px-10 border border-slate-100">
          <button
            onClick={handleLogin}
            className="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-200/50 text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 focus:outline-none transition-all"
          >
            Sign in with Google
          </button>
          
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-400 font-bold tracking-wider text-[10px] uppercase">
                  Important Note
                </span>
              </div>
            </div>
            <div className="mt-6 text-xs text-center text-slate-500 font-medium leading-relaxed">
              Users sign in to book meals. First login creates a 'student' account. You can navigate between standard user and admin views from the Navbar using the "Demo Setup" toggle.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
