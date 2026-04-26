import { auth, db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { LogOut, Apple, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';

export default function Navbar() {
  const { userData } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  const toggleRole = async () => {
    if (!userData) return;
    const newRole = userData.role === 'admin' ? 'student' : 'admin';
    try {
      await updateDoc(doc(db, 'users', userData.uid), {
        role: newRole
      });
      // Force reload to pick up role change
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert("Demoted. To make yourself an admin, change the code or allow it in rules. For demo, we just allow anyone to be admin");
    }
  };

  return (
    <header className="bg-transparent pt-6 pb-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <span className="bg-emerald-500 text-white p-1 rounded">
              <Apple className="w-5 h-5" />
            </span>
            MessPredict
          </h1>
          <p className="text-slate-500 text-sm hidden sm:block">AI Waste Predictor & Management System</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={toggleRole} className="text-xs flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-1.5 rounded-lg hover:bg-amber-200 transition-colors font-medium">
            <ShieldAlert className="w-3 h-3" />
            <span className="hidden sm:inline">Demo: Swap to</span> {userData?.role === 'student' ? 'Admin' : 'Student'}
          </button>
          <div className="text-right hidden sm:block">
            <div className="font-bold text-sm tracking-tight">{userData?.name}</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{userData?.role}</div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-10 h-10 bg-slate-200 hover:bg-slate-300 rounded-full border-2 border-white shadow-sm flex items-center justify-center transition-colors text-slate-500"
            title="Log out"
          >
            <LogOut className="w-4 h-4 ml-0.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
