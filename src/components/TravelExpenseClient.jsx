"use client";

import { useState, useTransition, useEffect } from 'react';
import { 
  Plane, Wallet, FileText, CheckCircle2, 
  MapPin, Clock, X, Plus, AlertCircle, Calendar as CalendarIcon, Loader2, CheckSquare, RotateCcw, Eye
} from 'lucide-react';
import { submitTravelExpense } from '@/app/actions';

export default function TravelExpenseClient({ records, user }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Form State
  const [visitDetails, setVisitDetails] = useState({
    companyName: '',
    clientName: '',
    visitLocation: '',
    advanceAmount: "0"
  });

  const [duration, setDuration] = useState({
    startDate: '',
    endDate: ''
  });

  const [dailyExpenses, setDailyExpenses] = useState({});

  // Calculate Days
  const getDaysArray = (start, end) => {
    const list = [];
    if (start && end) {
      const s = new Date(start);
      const e = new Date(end);
      if (s <= e) {
        let current = new Date(s);
        while (current <= e) {
          list.push(current.toISOString().split('T')[0]);
          current.setDate(current.getDate() + 1);
        }
      }
    }
    return list;
  };

  const daysList = getDaysArray(duration.startDate, duration.endDate);

  // Initialize missing days
  useEffect(() => {
    setDailyExpenses(prev => {
      const next = { ...prev };
      daysList.forEach(dateStr => {
        if (!next[dateStr]) {
          next[dateStr] = [{ id: Math.random().toString(), details: '', amount: "", receipt: null }];
        }
      });
      return next;
    });
  }, [duration.startDate, duration.endDate]);

  // Derived Stats
  const totalAmount = records.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  const pendingCount = records.filter(r => r.status === 'Pending').length;
  const approvedCount = records.filter(r => r.status === 'Approved').length;

  const currentTotalExpenses = daysList.reduce((sum, day) => {
    const dayItems = dailyExpenses[day] || [];
    return sum + dayItems.reduce((daySum, item) => daySum + (parseFloat(item.amount) || 0), 0);
  }, 0);

  const netReimbursement = currentTotalExpenses - (parseFloat(visitDetails.advanceAmount) || 0);

  const handleReset = () => {
    setVisitDetails({ companyName: '', clientName: '', visitLocation: '', advanceAmount: "0" });
    setDuration({ startDate: '', endDate: '' });
    setDailyExpenses({});
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    startTransition(async () => {
      // Structure the data for actions
      const payload = {
         visitDetails,
         duration,
         dailyExpenses: daysList.map(date => ({
            date,
            items: dailyExpenses[date].map(item => ({
               details: item.details,
               amount: item.amount,
               // File upload parsing mock - actual transfer involves FormData
            }))
         })),
         totalExpenses: currentTotalExpenses,
         netReimbursement
      };
      
      await submitTravelExpense(payload);
      setIsFormOpen(false);
      handleReset();
    });
  };

  const addLineItem = (dateStr) => {
    setDailyExpenses(prev => ({
      ...prev,
      [dateStr]: [...(prev[dateStr] || []), { id: Math.random().toString(), details: '', amount: "", receipt: null }]
    }));
  };

  const updateLineItem = (dateStr, id, field, value) => {
    setDailyExpenses(prev => ({
      ...prev,
      [dateStr]: prev[dateStr].map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  // ── Render Form ── 
  if (isFormOpen) {
    return (
      <div className="space-y-6 animate-fade-in relative z-10 p-2 max-w-5xl mx-auto pb-24">
        
        {/* Header Block */}
        <div className="bg-[#295191] rounded-2xl p-6 text-white flex justify-between items-center shadow-lg">
           <div className="flex items-start gap-4">
              <FileText size={32} className="opacity-90 mt-1" />
              <div>
                 <h2 className="text-2xl font-black tracking-tight">Travel Expense Reimbursement</h2>
                 <p className="text-blue-200 text-sm mt-1 font-medium">Submit visit details & upload receipts.</p>
              </div>
           </div>
           <button 
             onClick={handleReset}
             className="flex items-center gap-2 border border-blue-400/30 bg-blue-800/20 hover:bg-blue-800/40 px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm"
           >
             <RotateCcw size={16} />
             Reset
           </button>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-8">
           
           {/* Section 1: Visit Details */}
           <div className="space-y-4">
              <h3 className="text-[#1a56db] font-bold text-lg border-b border-slate-100 pb-2">1. Visit Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-2">
                 <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Employee Name</label>
                    <input type="text" readOnly value={user?.name || "Nikita Sharma"} className="form-input bg-slate-50 cursor-not-allowed" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Company Name</label>
                    <input type="text" required value={visitDetails.companyName} onChange={e => setVisitDetails({...visitDetails, companyName: e.target.value})} placeholder="Company Visited" className="form-input" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Client Name</label>
                    <input type="text" required value={visitDetails.clientName} onChange={e => setVisitDetails({...visitDetails, clientName: e.target.value})} placeholder="Client Name" className="form-input" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Visit Location</label>
                    <input type="text" required value={visitDetails.visitLocation} onChange={e => setVisitDetails({...visitDetails, visitLocation: e.target.value})} placeholder="City / Site" className="form-input" />
                 </div>
                 <div className="space-y-2 md:col-span-2 max-w-md">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Advance Amount (₹)</label>
                    <input type="number" required min="0" value={visitDetails.advanceAmount} onChange={e => setVisitDetails({...visitDetails, advanceAmount: e.target.value})} className="form-input" />
                 </div>
              </div>
           </div>

           {/* Section 2: Duration */}
           <div className="space-y-4">
              <h3 className="text-[#1a56db] font-bold text-lg border-b border-slate-100 pb-2">2. Duration</h3>
              <div className="flex flex-col md:flex-row gap-6 pt-2 items-end">
                 <div className="space-y-2 flex-1 max-w-[200px]">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Start Date</label>
                    <input type="date" required value={duration.startDate} onChange={e => setDuration({...duration, startDate: e.target.value})} className="form-input" />
                 </div>
                 <div className="space-y-2 flex-1 max-w-[200px]">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">End Date</label>
                    <input type="date" required min={duration.startDate} value={duration.endDate} onChange={e => setDuration({...duration, endDate: e.target.value})} className="form-input" />
                 </div>
                 <div className="flex-1 max-w-[200px]">
                    <div className="bg-[#1e8a5b] text-white text-sm font-bold h-[42px] flex items-center justify-center rounded-lg shadow-sm">
                       {daysList.length} Day(s)
                    </div>
                 </div>
              </div>
           </div>

           {/* Section 3: Daily Breakdown */}
           <div className="space-y-4">
              <h3 className="text-[#1a56db] font-bold text-lg border-b border-slate-100 pb-2">3. Daily Breakdown</h3>
              
              {daysList.length === 0 && (
                <div className="py-8 text-center text-slate-400 font-medium text-sm border-2 border-dashed border-slate-100 rounded-xl">
                   Select start and end dates to build out daily expenses.
                </div>
              )}

              <div className="space-y-6 pt-2">
                 {daysList.map((dateStr, index) => {
                    const displayDate = new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                    const items = dailyExpenses[dateStr] || [];

                    return (
                       <div key={dateStr} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                          <div className="bg-slate-50/50 px-4 py-3 flex justify-between items-center border-b border-slate-200">
                             <h4 className="font-bold text-slate-800 text-sm">Day {index + 1}</h4>
                             <span className="text-xs font-black bg-white border border-slate-200 px-2.5 py-1 rounded text-slate-600">{displayDate}</span>
                          </div>
                          
                          <div className="p-4 space-y-4">
                             {items.map((item, iIndex) => (
                                <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                                   <div className="md:col-span-5 space-y-2">
                                      {iIndex === 0 && <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Details</label>}
                                      <textarea rows={1} required value={item.details} onChange={e => updateLineItem(dateStr, item.id, 'details', e.target.value)} className="form-input min-h-[42px] resize-y" />
                                   </div>
                                   <div className="md:col-span-3 space-y-2">
                                      {iIndex === 0 && <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Amount (₹)</label>}
                                      <input type="number" required min="0" value={item.amount} onChange={e => updateLineItem(dateStr, item.id, 'amount', e.target.value)} className="form-input" />
                                   </div>
                                   <div className="md:col-span-4 space-y-2">
                                      {iIndex === 0 && <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Receipts</label>}
                                      <input type="file" className="form-input file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                                   </div>
                                </div>
                             ))}
                             
                             <button type="button" onClick={() => addLineItem(dateStr)} className="text-xs font-bold text-[#1a56db] border border-blue-200 bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors w-full sm:w-auto">
                                + Add More
                             </button>
                          </div>
                       </div>
                    );
                 })}
              </div>
           </div>

           {/* Footer Totals */}
           <div className="grid grid-cols-1 sm:grid-cols-2 bg-slate-50 border border-slate-200 rounded-xl p-6 mt-8">
              <div className="text-center sm:border-r border-slate-200">
                 <div className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-1">Total Expenses</div>
                 <div className="text-2xl font-black text-[#1a56db]">₹ {currentTotalExpenses.toLocaleString()}</div>
              </div>
              <div className="text-center mt-4 sm:mt-0">
                 <div className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-1">Net Reimbursement</div>
                 <div className={`text-2xl font-black ${netReimbursement >= 0 ? "text-[#1e8a5b]" : "text-rose-600"}`}>
                   ₹ {netReimbursement.toLocaleString()}
                 </div>
              </div>
           </div>

           {/* Sticky Action Footer */}
           <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200 p-4 z-40 sm:relative sm:bg-transparent sm:backdrop-blur-none sm:border-0 sm:p-0 mt-8">
              <div className="flex justify-between items-center max-w-5xl mx-auto">
                 <button type="button" onClick={() => setIsFormOpen(false)} className="text-sm font-bold text-slate-500 hover:text-slate-800">
                    Cancel & Return
                 </button>
                 <button type="submit" disabled={isPending || daysList.length === 0} className="bg-[#1a56db] hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-md flex items-center gap-2">
                    {isPending ? <Loader2 size={18} className="animate-spin" /> : <Eye size={18} />}
                    <span>Review Application</span>
                 </button>
              </div>
           </div>

        </form>
      </div>
    );
  }

  // ── Render List View ──
  return (
    <div className="space-y-8 animate-fade-in relative z-10 p-2">
      
      {/* ── HEADER & ACTIONS ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 mb-2">Travel Expenses</h2>
          <p className="text-sm font-medium text-slate-500">Manage and track your corporate travel claims.</p>
        </div>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="group relative flex items-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold tracking-wide shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5 transition-all overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
          <Plus size={18} />
          <span>New Expense</span>
        </button>
      </div>

      {/* ── METRICS SECTION ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="metric-card bg-indigo-50 border-indigo-100 group">
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="text-xs font-black text-indigo-500 uppercase tracking-widest">Total Claimed</div>
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
              <Wallet size={18} />
            </div>
          </div>
          <div className="text-4xl font-black text-slate-900 tracking-tight transition-transform duration-300 group-hover:translate-x-1 relative z-10">
            ₹{totalAmount.toLocaleString()}
          </div>
        </div>

        <div className="metric-card bg-amber-50 border-amber-100 group">
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="text-xs font-black text-amber-500 uppercase tracking-widest">Pending Auth</div>
            <div className="w-10 h-10 rounded-2xl bg-amber-600/10 flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors duration-300">
              <Clock size={18} />
            </div>
          </div>
          <div className="text-4xl font-black text-slate-900 tracking-tight transition-transform duration-300 group-hover:translate-x-1 relative z-10">
            {pendingCount}
          </div>
        </div>

        <div className="metric-card bg-emerald-50 border-emerald-100 group">
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="text-xs font-black text-emerald-500 uppercase tracking-widest">Approved</div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-600/10 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="text-4xl font-black text-slate-900 tracking-tight transition-transform duration-300 group-hover:translate-x-1 relative z-10">
            {approvedCount}
          </div>
        </div>
      </div>

      {/* ── DATA TABLE ── */}
      <div className="card backdrop-blur-3xl bg-white/70">
        <div className="p-6 border-b border-indigo-50 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500">
            <FileText size={16} />
          </div>
          <h3 className="text-base font-bold text-slate-900">Expense History</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th className="text-left w-24">Date</th>
                <th className="text-left">Destination</th>
                <th className="text-left">Category</th>
                <th className="text-left">Remarks</th>
                <th className="text-right">Amount (₹)</th>
                <th className="text-center w-28">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.length > 0 ? records.map((r, i) => (
                <tr key={r.id || i} style={{ animationDelay: `${i * 0.05}s` }} className="animate-slide-up hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors">
                  <td className="whitespace-nowrap font-medium">{r.date || '-'}</td>
                  <td>
                    <div className="flex items-center gap-2">
                       <MapPin size={14} className="text-slate-400" />
                       <span className="font-bold text-slate-800">{r.destination || '-'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2 border border-slate-200 bg-white rounded-lg px-2 py-1 w-max">
                      {r.category === 'Flight' && <Plane size={12} className="text-indigo-500" />}
                      {r.category === 'Hotel' && <CheckSquare size={12} className="text-teal-500" />}
                      {r.category === 'Taxi' && <Clock size={12} className="text-amber-500" />}
                      {r.category === 'Daily' && <CalendarIcon size={12} className="text-indigo-500" />}
                      <span className="text-xs font-bold text-slate-600">{r.category || '-'}</span>
                    </div>
                  </td>
                  <td className="text-slate-500 max-w-[200px] truncate">{r.remarks || '-'}</td>
                  <td className="text-right font-black text-slate-900">
                    {r.amount ? parseFloat(r.amount).toLocaleString() : '-'}
                  </td>
                  <td className="text-center">
                    <span className={`badge ${
                      r.status === 'Approved' ? 'badge-green' : 
                      r.status === 'Rejected' ? 'badge-red' : 'badge-amber'
                    }`}>
                      {r.status || 'Pending'}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6">
                     <div className="flex flex-col items-center justify-center py-16 px-4">
                       <div className="w-16 h-16 rounded-3xl bg-indigo-50 flex items-center justify-center mb-4 ring-8 ring-white">
                         <Plane size={24} className="text-indigo-300" />
                       </div>
                       <h4 className="text-sm font-bold text-slate-900 mb-1">No Travel Expenses Found</h4>
                       <p className="text-xs font-medium text-slate-500 text-center max-w-xs leading-relaxed">
                         Submit a new travel expense using the button above.
                       </p>
                     </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
