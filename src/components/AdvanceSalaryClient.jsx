"use client";

import { useState, useTransition } from 'react';
import { 
  Wallet, FileText, CheckCircle2, 
  Clock, X, Plus, AlertCircle, Loader2, Send, Calendar, DollarSign, Briefcase, ChevronRight
} from 'lucide-react';
import { submitAdvanceSalaryRequest } from '@/app/actions';

export default function AdvanceSalaryClient({ user, initialRecords }) {
  const [records, setRecords] = useState(initialRecords || []);
  const [activeTab, setActiveTab] = useState('apply'); // 'apply' or 'records'
  const [isPending, startTransition] = useTransition();

  // Form State
  const [formData, setFormData] = useState({
    department: '',
    amount: '',
    reason: '',
    dateNeeded: '',
    months: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await submitAdvanceSalaryRequest(formData);
      if (result.success) {
        setFormData({ department: '', amount: '', reason: '', dateNeeded: '', months: '' });
        // Update local records for immediate UI feedback
        const newRecord = {
          id: Date.now().toString(),
          timestamp: new Date().toLocaleString('en-GB'),
          name: user.name,
          empId: user.empId,
          department: formData.department,
          amount: formData.amount,
          reason: formData.reason,
          dateNeeded: formData.dateNeeded,
          months: formData.months,
          status: 'Pending'
        };
        setRecords([newRecord, ...records]);
        setActiveTab('records');
      } else {
        alert(result.error || "Failed to submit request.");
      }
    });
  };

  // Stats
  const totalRequested = records.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  const pendingCount = records.filter(r => r.status === 'Pending').length;
  const approvedCount = records.filter(r => r.status === 'Approved').length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10 pb-20">
      
      {/* ── Header Area ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 mb-2">Advance Salary Request</h2>
          <div className="flex items-center gap-4 mt-4">
             <button 
               onClick={() => setActiveTab('apply')}
               className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm
                 ${activeTab === 'apply' ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'}`}
             >
               <Plus size={16} />
               Apply New
             </button>
             <button 
               onClick={() => setActiveTab('records')}
               className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm
                 ${activeTab === 'records' ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'}`}
             >
               <FileText size={16} />
               My Records
             </button>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-white/50 backdrop-blur-xl border border-white/50 rounded-2xl shadow-sm">
           <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-black uppercase ring-4 ring-indigo-50">
             {user?.name?.[0] || 'U'}
           </div>
           <div>
              <div className="text-[11px] font-black text-slate-900 leading-none mb-0.5">{user?.name || 'krishna Pawar'}</div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Employee</div>
           </div>
        </div>
      </div>

      {activeTab === 'apply' ? (
        /* ── APPLY NEW VIEW ── */
        <div className="animate-in fade-in slide-in-from-left-8 duration-700">
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden max-w-5xl">
             <div className="bg-slate-50/50 border-b border-indigo-50 px-10 py-6">
                <h3 className="text-xl font-black text-emerald-600 tracking-tight">New Advance Application</h3>
             </div>
             
             <form onSubmit={handleSubmit} className="p-10 space-y-8">
                
                {/* Row 1: Employee Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Employee Name</label>
                      <input type="text" readOnly value={user?.name || 'krishna Pawar'} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3.5 px-5 text-slate-600 font-bold outline-none cursor-not-allowed" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Employee ID</label>
                      <input type="text" readOnly value={user?.empId || 'EMP102'} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3.5 px-5 text-slate-600 font-bold outline-none cursor-not-allowed" />
                   </div>
                </div>

                {/* Row 2: Department & Amount */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Department</label>
                      <select 
                        required
                        value={formData.department}
                        onChange={e => setFormData({...formData, department: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-xl py-3.5 px-5 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                      >
                        <option value="">Select...</option>
                        <option value="IT">Information Technology</option>
                        <option value="HR">Human Resources</option>
                        <option value="Finance">Finance</option>
                        <option value="Operations">Operations</option>
                        <option value="Sales">Sales</option>
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 text-emerald-600">Required Amount (₹)</label>
                      <div className="relative">
                         <input 
                           type="number" 
                           required 
                           min="500"
                           value={formData.amount}
                           onChange={e => setFormData({...formData, amount: e.target.value})}
                           placeholder="0.00"
                           className="w-full bg-white border border-slate-200 rounded-xl py-3.5 px-5 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                         />
                      </div>
                   </div>
                </div>

                {/* Row 3: Reason */}
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Reason for Advance</label>
                   <textarea 
                     required
                     value={formData.reason}
                     onChange={e => setFormData({...formData, reason: e.target.value})}
                     placeholder="e.g. Medical Emergency"
                     className="w-full bg-white border border-slate-200 rounded-xl py-3.5 px-5 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none min-h-[100px] resize-none"
                   />
                </div>

                {/* Row 4: Date Needed & Repayment */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Date Needed</label>
                      <input 
                        type="date" 
                        required 
                        value={formData.dateNeeded}
                        onChange={e => setFormData({...formData, dateNeeded: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-xl py-3.5 px-5 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Repayment Period</label>
                      <select 
                        required
                        value={formData.months}
                        onChange={e => setFormData({...formData, months: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-xl py-3.5 px-5 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                      >
                        <option value="">Select Months...</option>
                        <option value="1">1 Month</option>
                        <option value="2">2 Months</option>
                        <option value="3">3 Months</option>
                        <option value="6">6 Months</option>
                        <option value="12">12 Months</option>
                      </select>
                   </div>
                </div>

                {/* Submit Block */}
                <div className="pt-6 flex justify-end">
                   <button 
                     type="submit" 
                     disabled={isPending}
                     className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-10 py-3.5 font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50 group"
                   >
                     {isPending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                     Submit Request
                   </button>
                </div>

             </form>
          </div>
        </div>
      ) : (
        /* ── MY RECORDS VIEW ── */
        <div className="animate-in fade-in slide-in-from-right-8 duration-700 space-y-8">
           {/* Metric Cards for context */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Requested</div>
                <div className="text-3xl font-black text-indigo-600">₹{totalRequested.toLocaleString()}</div>
             </div>
             <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pending</div>
                <div className="text-3xl font-black text-amber-600">{pendingCount}</div>
             </div>
             <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Approved</div>
                <div className="text-3xl font-black text-emerald-600">{approvedCount}</div>
             </div>
           </div>

           <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden relative">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                      <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Application Date</th>
                      <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Amount (₹)</th>
                      <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Repayment (Months)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {records.map((r, i) => (
                      <tr key={r.id || i} className="group hover:bg-slate-50/20 transition-colors">
                        <td className="px-8 py-6">
                           <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                             r.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' : 
                             r.status === 'Rejected' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                           }`}>
                             {r.status || 'Pending'}
                           </span>
                        </td>
                        <td className="px-8 py-6">
                           <span className="text-xs font-bold text-slate-600">{r.timestamp?.split(',')[0]}</span>
                        </td>
                        <td className="px-8 py-6 font-black text-slate-900 text-sm">
                           ₹{parseFloat(r.amount).toLocaleString()}
                        </td>
                        <td className="px-8 py-6 text-xs font-bold text-slate-600">
                           {r.months} Months
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}
