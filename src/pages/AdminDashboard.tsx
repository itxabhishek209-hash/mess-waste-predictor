import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { format } from 'date-fns';
import { Bell, Utensils, AlertTriangle, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const [predictionData, setPredictionData] = useState<any>(null);
  const [wasteDataList, setWasteDataList] = useState<any[]>([]);
  const [wasteForm, setWasteForm] = useState({
    riceKg: '', dalKg: '', rotiKg: '', curryKg: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Fetch prediction from Express API
    const fetchPrediction = async () => {
      try {
        const res = await fetch('/api/prediction');
        const data = await res.json();
        setPredictionData(data);
      } catch (e) {
        console.error("Failed to fetch prediction", e);
      }
    };
    fetchPrediction();

    // Listen to Firebase Waste Data
    const q = query(
      collection(db, 'wasteRecords'), 
      orderBy('date', 'desc'),
      limit(7)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        // Seed dummy data
        const dummyData = [
          { date: format(new Date(Date.now() - 6 * 86400000), 'yyyy-MM-dd'), totalWasteKg: 18, riceKg: 8, dalKg: 3, rotiKg: 4, curryKg: 3 },
          { date: format(new Date(Date.now() - 5 * 86400000), 'yyyy-MM-dd'), totalWasteKg: 15, riceKg: 7, dalKg: 2, rotiKg: 3, curryKg: 3 },
          { date: format(new Date(Date.now() - 4 * 86400000), 'yyyy-MM-dd'), totalWasteKg: 20, riceKg: 9, dalKg: 4, rotiKg: 5, curryKg: 2 },
          { date: format(new Date(Date.now() - 3 * 86400000), 'yyyy-MM-dd'), totalWasteKg: 12, riceKg: 5, dalKg: 2, rotiKg: 3, curryKg: 2 },
          { date: format(new Date(Date.now() - 2 * 86400000), 'yyyy-MM-dd'), totalWasteKg: 10, riceKg: 4, dalKg: 2, rotiKg: 2, curryKg: 2 },
          { date: format(new Date(Date.now() - 1 * 86400000), 'yyyy-MM-dd'), totalWasteKg: 8, riceKg: 3, dalKg: 1, rotiKg: 2, curryKg: 2 }
        ];
        dummyData.forEach(async (data, i) => {
          try {
            await addDoc(collection(db, 'wasteRecords'), {
              ...data,
              addedBy: 'System',
              createdAt: Date.now() - ((6-i) * 86400000)
            });
          } catch(e) {}
        });
      }

      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).reverse(); // Oldest first for chart
      setWasteDataList(records);
    });

    return () => unsubscribe();
  }, []);

  const handleWasteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const r = Number(wasteForm.riceKg) || 0;
    const d = Number(wasteForm.dalKg) || 0;
    const ro = Number(wasteForm.rotiKg) || 0;
    const c = Number(wasteForm.curryKg) || 0;
    const total = r + d + ro + c;

    if (total === 0) {
      alert("Please enter some waste data.");
      setIsSubmitting(false);
      return;
    }

    try {
      await addDoc(collection(db, 'wasteRecords'), {
        date: format(new Date(), 'yyyy-MM-dd'),
        riceKg: r,
        dalKg: d,
        rotiKg: ro,
        curryKg: c,
        totalWasteKg: total,
        addedBy: 'Admin',
        createdAt: Date.now()
      });
      setWasteForm({ riceKg: '', dalKg: '', rotiKg: '', curryKg: '' });
      alert("Waste data recorded successfully.");
    } catch (e) {
      console.error(e);
      alert("Failed to submit waste data");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNotify = () => {
    alert("Notification sent to local NGOs for food donation! (Demo)");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Col 1: Prediction & Waste Chart */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        {/* Prediction Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col min-h-[220px]">
          <div className="flex justify-between items-start mb-4">
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider">Prediction</span>
            <span className="text-slate-400 text-xs">Today</span>
          </div>
          <div className="mt-auto">
            <div className="text-5xl font-extrabold text-slate-800">
              {predictionData ? predictionData.predictedStudents : <span className="animate-pulse">--</span>}
            </div>
            <p className="text-slate-500 font-medium mt-1 mb-4">Estimated Attendance</p>
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
            Based on historical engagement
          </div>
        </div>

        {/* Waste Analytics Chart */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex-1 min-h-[340px] flex flex-col">
          <h3 className="text-lg font-bold mb-4">Weekly Waste (kg)</h3>
          <div className="flex-1 w-full mt-2">
            {wasteDataList.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={wasteDataList} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tickFormatter={(val) => val.split('-')[2]} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <Tooltip 
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="totalWasteKg" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                No waste data recorded.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Col 2: Prep Guide & Manual Input */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        {/* Prep List */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex-1">
          <h3 className="text-lg font-bold mb-4 flex items-center justify-between">
            Preparation Guide
            <span className="text-xs font-normal text-slate-400">Auto-calculated</span>
          </h3>
          <ul className="space-y-3 mt-4">
            <li className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-white border border-slate-100 rounded-xl shadow-sm flex items-center justify-center font-bold text-slate-600">R</div>
                <div>
                  <div className="font-bold text-sm">Rice</div>
                  <div className="text-xs text-slate-500">Calculated quantity</div>
                </div>
              </div>
              <div className="text-lg font-bold">
                {predictionData ? predictionData.foodToPrepare.riceKg : '--'} <span className="text-xs text-slate-400">kg</span>
              </div>
            </li>
            <li className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-white border border-slate-100 rounded-xl shadow-sm flex items-center justify-center font-bold text-slate-600">D</div>
                <div>
                  <div className="font-bold text-sm">Lentils (Dal)</div>
                  <div className="text-xs text-slate-500">Gravy base</div>
                </div>
              </div>
              <div className="text-lg font-bold">
                {predictionData ? predictionData.foodToPrepare.dalKg : '--'} <span className="text-xs text-slate-400">kg</span>
              </div>
            </li>
            <li className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-white border border-slate-100 rounded-xl shadow-sm flex items-center justify-center font-bold text-slate-600">B</div>
                <div>
                  <div className="font-bold text-sm">Breads (Roti)</div>
                  <div className="text-xs text-slate-500">Flour quantity</div>
                </div>
              </div>
              <div className="text-lg font-bold">
                {predictionData ? predictionData.foodToPrepare.rotiKg : '--'} <span className="text-xs text-slate-400">kg</span>
              </div>
            </li>
            <li className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-white border border-slate-100 rounded-xl shadow-sm flex items-center justify-center font-bold text-slate-600">C</div>
                <div>
                  <div className="font-bold text-sm">Curry (Mix veg)</div>
                  <div className="text-xs text-slate-500">Side dish</div>
                </div>
              </div>
              <div className="text-lg font-bold">
                {predictionData ? predictionData.foodToPrepare.curryKg : '--'} <span className="text-xs text-slate-400">kg</span>
              </div>
            </li>
          </ul>
        </div>

        {/* Manual Input Form */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 min-h-[220px]">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Manual Waste Log</h3>
          <form onSubmit={handleWasteSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 ml-1">RICE (KG)</label>
                <input type="number" step="0.1" min="0" value={wasteForm.riceKg} onChange={e => setWasteForm({...wasteForm, riceKg: e.target.value})} className="w-full mt-1 bg-slate-50 border-none rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 text-sm font-medium" placeholder="0.0" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 ml-1">DAL (KG)</label>
                <input type="number" step="0.1" min="0" value={wasteForm.dalKg} onChange={e => setWasteForm({...wasteForm, dalKg: e.target.value})} className="w-full mt-1 bg-slate-50 border-none rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 text-sm font-medium" placeholder="0.0" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 ml-1">ROTI (KG)</label>
                <input type="number" step="0.1" min="0" value={wasteForm.rotiKg} onChange={e => setWasteForm({...wasteForm, rotiKg: e.target.value})} className="w-full mt-1 bg-slate-50 border-none rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 text-sm font-medium" placeholder="0.0" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 ml-1">CURRY (KG)</label>
                <input type="number" step="0.1" min="0" value={wasteForm.curryKg} onChange={e => setWasteForm({...wasteForm, curryKg: e.target.value})} className="w-full mt-1 bg-slate-50 border-none rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 text-sm font-medium" placeholder="0.0" />
              </div>
            </div>
            <button disabled={isSubmitting} type="submit" className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors shadow-sm">
              {isSubmitting ? 'Submitting...' : 'Log Waste Data'}
            </button>
          </form>
        </div>
      </div>

      {/* Col 3: Notification & Impact */}
      <div className="lg:col-span-3 flex flex-col gap-4">
        {/* Notifications */}
        <div className="bg-amber-500 rounded-3xl p-6 text-white shadow-lg shadow-amber-200/50 flex flex-col justify-between min-h-[220px]">
          <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
          </div>
          <div className="mt-auto">
            <h3 className="font-bold text-xl leading-tight">Surplus Detected?</h3>
            <p className="text-white/90 text-sm mt-1 mb-6">A significant amount of excess food is expected today.</p>
          </div>
          <button onClick={handleNotify} className="w-full py-3 bg-white text-amber-600 rounded-xl font-bold text-sm tracking-wide shadow-sm hover:bg-amber-50 transition-colors">
            Notify NGO Partners
          </button>
        </div>

        {/* Impact Card */}
        <div className="bg-slate-950 rounded-3xl p-6 text-white shadow-sm flex flex-col justify-center min-h-[200px]">
          <div className="text-emerald-400 font-mono text-[10px] mb-3 tracking-widest uppercase font-bold">Environmental Impact</div>
          <div className="text-5xl font-extrabold tracking-tight">128 kg</div>
          <div className="text-sm font-medium text-slate-400 mt-2 mb-4">Food Saved this month</div>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-900"></div>
              <div className="w-6 h-6 rounded-full bg-slate-700 border border-slate-900"></div>
              <div className="w-6 h-6 rounded-full bg-slate-600 border border-slate-900 shadow-sm"></div>
            </div>
            <span className="text-[10px] text-slate-400">Feeding the local community</span>
          </div>
        </div>
      </div>
    </div>
  );
}
