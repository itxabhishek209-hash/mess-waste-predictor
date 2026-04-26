import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { CheckCircle2, Utensils, Calendar } from 'lucide-react';

const mockMenu = {
  breakfast: 'Idli, Sambhar, Chutney, Tea',
  lunch: 'Rice, Dal Makhani, Paneer Butter Masala, Roti, Salad',
  dinner: 'Rice, Mix Veg, Chole, Roti, Gulab Jamun'
};

export default function StudentDashboard() {
  const { userData } = useAuth();
  const [willEat, setWillEat] = useState<boolean | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const todayDate = format(new Date(), 'yyyy-MM-dd');
  const bookingId = `${userData?.uid}_${todayDate}`;

  useEffect(() => {
    if (!userData) return;
    
    const fetchBooking = async () => {
      try {
        const bookingRef = doc(db, 'mealBookings', bookingId);
        const bookingSnap = await getDoc(bookingRef);
        if (bookingSnap.exists()) {
          setWillEat(bookingSnap.data().willEat);
        } else {
          setWillEat(null);
        }
      } catch (e) {
        console.error("Error fetching booking", e);
      }
    };
    
    fetchBooking();
  }, [userData, bookingId]);

  const handleBook = async (status: boolean) => {
    if (!userData) return;
    setIsSaving(true);
    
    try {
      const bookingRef = doc(db, 'mealBookings', bookingId);
      const bookingSnap = await getDoc(bookingRef);
      
      if (bookingSnap.exists()) {
        await updateDoc(bookingRef, {
          willEat: status,
          updatedAt: Date.now()
        });
      } else {
        await setDoc(bookingRef, {
          userId: userData.uid,
          date: todayDate,
          willEat: status,
          mealType: 'all', // simplify for demo
          updatedAt: Date.now()
        });
      }
      setWillEat(status);
    } catch (error) {
      console.error("Error saving booking", error);
      alert("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Booking Card */}
      <div className="lg:col-span-7 bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
        <h2 className="text-2xl font-bold tracking-tight mb-8">Today's Meal Plan</h2>
        
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          {willEat === null ? (
            <p className="text-slate-500 mb-8 max-w-sm">Please confirm your attendance for today's meals. This helps us prepare the exact amount of food needed and reduces waste.</p>
          ) : willEat ? (
            <div className="bg-emerald-50 w-full mb-8 py-6 rounded-2xl border border-emerald-100 flex flex-col items-center gap-3 relative overflow-hidden">
              <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-emerald-300 to-emerald-500"></div>
              <div className="bg-white p-3 rounded-full shadow-sm">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <div>
                <span className="font-bold text-emerald-800 text-lg block">Attendance Confirmed</span>
                <span className="text-emerald-600 text-sm font-medium">Thank you for helping us predict effectively!</span>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 w-full mb-8 py-6 rounded-2xl border border-amber-100 flex flex-col items-center gap-3 relative overflow-hidden">
               <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-amber-300 to-amber-500"></div>
               <div className="bg-white p-3 rounded-full shadow-sm">
                 <Calendar className="w-8 h-8 text-amber-500" />
               </div>
               <div>
                  <span className="font-bold text-amber-800 text-lg block">Marked as Absent</span>
                  <span className="text-amber-600 text-sm font-medium">Enjoy your day out!</span>
               </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 w-full mt-auto">
          <button
            disabled={isSaving}
            onClick={() => handleBook(true)}
            className={`flex-1 py-4 px-4 rounded-2xl font-bold transition-all shadow-sm ${willEat === true ? 'bg-emerald-500 text-white shadow-emerald-200/50 hover:bg-emerald-600' : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 hover:border-slate-300'}`}
          >
            I will eat in Mess
          </button>
          <button
            disabled={isSaving}
            onClick={() => handleBook(false)}
            className={`flex-1 py-4 px-4 rounded-2xl font-bold transition-all shadow-sm ${willEat === false ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 hover:border-slate-300'}`}
          >
            Skip today
          </button>
        </div>
      </div>

      {/* Right Col: Stats & Menu */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        {/* Your Impact */}
        <div className="bg-slate-950 rounded-3xl p-6 text-white shadow-sm pb-8">
          <div className="text-emerald-400 font-mono text-[10px] mb-4 tracking-widest uppercase font-bold">Your Impact</div>
          <div className="text-4xl font-extrabold tracking-tight">12 <span className="text-xl font-medium text-slate-400">strikes</span></div>
          <div className="text-sm font-medium text-slate-400 mt-2 mb-4">Accurate predictions this month</div>
          <p className="text-xs text-slate-500 leading-relaxed border-t border-slate-800 pt-4 mt-4">
            By consistently updating your meal status, you directly contribute to reducing the hostel's carbon footprint.
          </p>
        </div>

        {/* Menu Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex-1 p-6">
          <div className="flex justify-between items-center mb-6 border-b border-slate-50 pb-4">
            <h2 className="text-lg font-bold text-slate-800">Today's Menu</h2>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{format(new Date(), 'EEEE')}</span>
          </div>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center shrink-0 text-amber-600 shadow-sm border border-amber-100/50">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Breakfast (7:30 AM)</h3>
                <p className="text-slate-800 text-sm font-medium leading-relaxed">{mockMenu.breakfast}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0 text-emerald-600 shadow-sm border border-emerald-100/50">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Lunch (12:30 PM)</h3>
                <p className="text-slate-800 text-sm font-medium leading-relaxed">{mockMenu.lunch}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0 text-indigo-600 shadow-sm border border-indigo-100/50">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Dinner (7:30 PM)</h3>
                <p className="text-slate-800 text-sm font-medium leading-relaxed">{mockMenu.dinner}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
