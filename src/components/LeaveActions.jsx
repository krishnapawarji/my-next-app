"use client";
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, Plus, FileText, CheckCircle, AlertCircle, X, ChevronRight, User, Briefcase, MessageSquare, ShieldCheck, MapPin, Clock, ArrowRight, ThumbsUp, ThumbsDown, Sparkles } from 'lucide-react';
import { applyLeave, updateLeaveStatus } from '@/app/actions';

const LEAVE_TYPES = ['Casual Leave','Sick Leave','Earned Leave','Maternity Leave','Paternity Leave','Unpaid Leave','Compensatory Leave'];
const DEPARTMENTS = ['Engineering','Sales','HR','Finance','Marketing','Operations','Design'];
const MANAGERS    = ['Rahul Yadav','Madhavi Joshi','Nikita Sharma'];

// ── Components ──────────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    'Pending':  { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
    'Approved by Manager': { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100' },
    'Approved': { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
    'Rejected': { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100' },
  };
  const s = map[status] || { bg: 'bg-slate-50', text: 'text-slate-400', border: 'border-slate-100' };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase border ${s.bg} ${s.text} ${s.border}`}>
      {status || '—'}
    </span>
  );
}

const FormField = ({ label, icon: Icon, children }) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex items-center gap-2 px-1">
      {Icon && <Icon size={12} className="text-slate-400" />}
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{label}</label>
    </div>
    <div className="relative">{children}</div>
  </div>
);

export default function LeaveActionsPage({ 
  myHistory = [], 
  teamPending = [], 
  teamHistory = [], 
  sessionUser = null
}) {
  const [activePortalTab, setActivePortalTab] = useState('My History');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showApplyModal, setShowApplyModal]   = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [approvalNote, setApprovalNote] = useState('');
  const [responsiblePerson, setResponsiblePerson] = useState('');
  
  const [isLoading, setIsLoading]   = useState(false);
  const [success, setSuccess]       = useState(false);
  const [mounted, setMounted]       = useState(false);
  
  useEffect(() => { setMounted(true); }, []);
  
  useEffect(() => {
    if (showApplyModal || showApprovalModal) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [showApplyModal, showApprovalModal]);
  
  const todayISO = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate]   = useState(todayISO);
  const [endDate, setEndDate]     = useState(todayISO);
  const [declared, setDeclared]     = useState(false);
  const [error, setError]           = useState('');

  const totalDays = (() => {
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (isNaN(s) || isNaN(e)) return 0;
    if (e < s) return 0;
    return Math.ceil((e - s) / 86400000) + 1;
  })();

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!declared) {
      setError('Accept the legal declaration first.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const result = await applyLeave(new FormData(e.target));
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          setShowApplyModal(false);
          setSuccess(false);
          setIsLoading(false);
        }, 2000);
      } else {
        setError(result.error || 'Submission failed.');
        setIsLoading(false);
      }
    } catch (err) {
      setError('Connection error.');
      setIsLoading(false);
    }
  };

  const handleApprovalAction = async (decision) => {
    if (!selectedRequest) return;
    setIsLoading(true);
    try {
      const result = await updateLeaveStatus(selectedRequest.id, decision, approvalNote, responsiblePerson);
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          setShowApprovalModal(false);
          setSuccess(false);
          setIsLoading(false);
          setSelectedRequest(null);
          setApprovalNote('');
          setResponsiblePerson('');
        }, 1500);
      } else {
        alert(result.error || 'Update failed');
        setIsLoading(false);
      }
    } catch (err) {
      alert('Connection error');
      setIsLoading(false);
    }
  };

  const canViewDashboard = sessionUser?.role === 'Manager' || sessionUser?.role === 'HR';
  const inputClass = "w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-[13px] font-bold text-slate-700 outline-none focus:border-indigo-300 focus:bg-white transition-all placeholder:text-slate-300";

  return (
    <div className="flex flex-col gap-10">
      
      {/* ── Tabs & Call-to-Action ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-1 p-1.5 bg-slate-100/50 rounded-[22px] backdrop-blur-sm border border-slate-200/50">
          <button 
            onClick={() => setActivePortalTab('My History')}
            className={`px-8 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${activePortalTab === 'My History' ? 'bg-white text-indigo-700 shadow-xl shadow-indigo-100/20' : 'text-slate-400 hover:text-slate-600'}`}>
            My Balance
          </button>
          {canViewDashboard && (
            <button 
              onClick={() => setActivePortalTab('Manager Dashboard')}
              className={`px-8 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${activePortalTab === 'Manager Dashboard' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200' : 'text-slate-400 hover:text-slate-600'}`}>
              {sessionUser?.role === 'HR' ? 'HR Approval Desk' : 'Team Requests'}
            </button>
          )}
        </div>

        <button
          onClick={() => setShowApplyModal(true)}
          className="group flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 hover:bg-indigo-600 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] transition-all duration-300 shadow-2xl shadow-indigo-100 active:scale-95 overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          <Plus size={18} strokeWidth={3} className="relative z-10" />
          <span className="relative z-10">New Application</span>
        </button>
      </div>

      {activePortalTab === 'My History' ? (
        <div className="space-y-10">
          {/* ── Metric Grid ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'Annual Balance', value: '18 Days', color: 'indigo', icon: ShieldCheck, sub: 'Casual/Sick Remaining' },
              { label: 'Pending Approval', value: myHistory.filter(h => h.status === 'Pending').length, color: 'amber', icon: Clock, sub: 'Awaiting Response' },
              { label: 'Used This Cycle', value: myHistory.filter(h => h.status === 'Approved').length, color: 'emerald', icon: CalendarDays, sub: 'Approved Time Off' },
            ].map((stat, i) => (
              <div key={i} className="bg-white p-7 rounded-[32px] border border-slate-100 shadow-sm relative group overflow-hidden">
                  <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-[60px] opacity-10 transition-all duration-700 bg-${stat.color}-400 group-hover:opacity-30`} />
                  <div className="flex items-center gap-5 relative z-10">
                    <div className={`p-4 rounded-[22px] bg-slate-50 text-${stat.color}-600 border border-slate-100 transition-transform duration-500 group-hover:scale-110 shadow-sm`}>
                      <stat.icon size={24} />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</div>
                      <div className="text-2xl font-black text-slate-900 tabular-nums leading-none mb-1">{stat.value}</div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase">{stat.sub}</div>
                    </div>
                  </div>
              </div>
            ))}
          </div>

          {/* ── Timeline Table ── */}
          <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
             <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100">
                   <FileText size={18} />
                 </div>
                 <div>
                   <h2 className="text-xl font-black text-slate-900 tracking-tight">Personal Timeline</h2>
                   <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Detailed history</div>
                 </div>
               </div>
             </div>
             <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/80 backdrop-blur-md border-b border-slate-50">
                      <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Application Type</th>
                      <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Duration</th>
                      <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Days</th>
                      <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Context</th>
                      <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {myHistory.length === 0 ? (
                      <tr><td colSpan={5} className="py-24 text-center text-slate-300 font-black uppercase tracking-widest">No entries found</td></tr>
                    ) : myHistory.map((rec, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-all group">
                        <td className="px-10 py-6">
                           <div className="text-[13px] font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{rec.type}</div>
                        </td>
                        <td className="px-10 py-6 text-[12px] font-black text-slate-500 tabular-nums">{rec.dates}</td>
                        <td className="px-10 py-6 text-center">
                          <span className="bg-indigo-50 text-indigo-700 font-black px-3 py-1.5 rounded-xl text-[11px] tabular-nums">{rec.days}</span>
                        </td>
                        <td className="px-10 py-6">
                           <div className="text-[11px] font-bold text-slate-400 max-w-xs truncate leading-relaxed" title={rec.reason}>{rec.reason}</div>
                        </td>
                        <td className="px-10 py-6 text-right">
                          <div className="flex flex-col items-end gap-2">
                             <StatusBadge status={rec.status} />
                             {rec.notes && <div className="text-[9px] font-bold text-slate-300 italic uppercase truncate max-w-[150px]" title={rec.notes}>{rec.notes}</div>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          
          {/* ── Manager Pending Desk ── */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 px-3">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Clock size={16} fill="currentColor" className="opacity-20" />
              </div>
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                {sessionUser?.role === 'HR' ? 'HR Pending Authorization' : 'Pending Requests Workspace'}
              </h2>
            </div>
            
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden min-h-[200px]">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Applicant Details</th>
                      <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Timeline</th>
                      <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Category</th>
                      <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Statement</th>
                      <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {teamPending.length === 0 ? (
                      <tr><td colSpan={5} className="py-20 text-center text-slate-300 font-black uppercase tracking-widest">Inbox Zero</td></tr>
                    ) : teamPending.map((rec, i) => (
                      <tr key={i} className="hover:bg-amber-50/20 transition-all group">
                        <td className="px-10 py-6">
                          <div className="flex items-center gap-3">
                             <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center text-[10px] font-black text-white">{rec.applicant[0]}</div>
                             <div className="text-[13px] font-black text-slate-900">{rec.applicant}</div>
                          </div>
                        </td>
                        <td className="px-10 py-6 text-[12px] font-black text-slate-500 tabular-nums">{rec.dates}</td>
                        <td className="px-10 py-6 text-[10px] font-black text-indigo-600 uppercase tracking-widest">{rec.type}</td>
                        <td className="px-10 py-6">
                          <div className="text-[11px] font-bold text-slate-400 truncate max-w-[200px]" title={rec.reason}>{rec.reason}</div>
                        </td>
                        <td className="px-10 py-6 text-right">
                          <button 
                            onClick={() => { setSelectedRequest(rec); setShowApprovalModal(true); }}
                            className="bg-slate-900 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all hover:bg-indigo-600 active:scale-95 leading-none">
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ── Team Audit History ── */}
          <div className="space-y-6">
             <div className="flex items-center gap-3 px-3">
              <div className="p-2 rounded-xl bg-violet-50 text-violet-600">
                <Sparkles size={16} fill="currentColor" className="opacity-20" />
              </div>
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Management Audit History</h2>
            </div>
            
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Team Member</th>
                      <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Period</th>
                      <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Decision</th>
                      <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Audit Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {teamHistory.length === 0 ? (
                      <tr><td colSpan={4} className="py-20 text-center text-slate-300 font-black uppercase tracking-widest">No history recorded</td></tr>
                    ) : teamHistory.map((rec, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-all">
                        <td className="px-10 py-6 text-[13px] font-black text-slate-900">{rec.applicant}</td>
                        <td className="px-10 py-6 text-[12px] font-black text-slate-500 tabular-nums">{rec.dates}</td>
                        <td className="px-10 py-6"><StatusBadge status={rec.status} /></td>
                        <td className="px-10 py-6 text-[11px] font-bold text-slate-400 italic max-w-xs truncate">{rec.notes || 'No statement provided'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modals Redesigned with Deep Glassmorphism ── */}
      {(showApplyModal && mounted) && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
           <style dangerouslySetInnerHTML={{ __html: `#app-shell { filter: blur(25px); pointer-events: none; transition: 0.5s; }` }} />
           <div className="absolute inset-0 bg-slate-950/40 animate-in fade-in" onClick={() => !isLoading && setShowApplyModal(false)} />
           <div className="relative w-full max-w-2xl bg-white rounded-[48px] shadow-[0_32px_120px_-15px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-500 scale-100 translate-y-0">
             {success ? (
               <div className="p-24 flex flex-col items-center text-center">
                 <div className="w-24 h-24 rounded-[32px] bg-emerald-50 text-emerald-600 flex items-center justify-center mb-8 animate-bounce transition-all shadow-xl shadow-emerald-100">
                    <CheckCircle size={40} />
                 </div>
                 <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-3">Submission Success!</h2>
                 <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Your request has been routed for approval</p>
               </div>
             ) : (
               <>
                 <div className="px-12 py-10 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                     <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-100">
                        <CalendarDays size={20} />
                     </div>
                     <div>
                       <h2 className="text-2xl font-black text-slate-900 tracking-tight">Time Off Gateway</h2>
                       <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">Official Application Form</div>
                     </div>
                   </div>
                   <button onClick={() => setShowApplyModal(false)} className="w-10 h-10 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all flex items-center justify-center"><X size={20} /></button>
                 </div>
                 <form onSubmit={handleApplySubmit} className="p-12 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-2 gap-8">
                      <FormField label="Current Status" icon={Briefcase}><input name="designation" required placeholder="Job Title" className={inputClass} /></FormField>
                      <FormField label="Subsystem" icon={User}>
                        <select name="department" required className={inputClass}>
                          {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                        </select>
                      </FormField>
                      <FormField label="Authority" icon={ShieldCheck}>
                        <select name="manager" required className={inputClass}>
                          {MANAGERS.map(m => <option key={m}>{m}</option>)}
                        </select>
                      </FormField>
                      <FormField label="Request Logic" icon={FileText}>
                        <select name="leaveType" required className={inputClass}>
                          {LEAVE_TYPES.map(t => <option key={t}>{t}</option>)}
                        </select>
                      </FormField>
                    </div>
                    
                    <div className="bg-indigo-50/50 p-6 rounded-[32px] border border-indigo-100/50 flex gap-6 items-center shadow-inner">
                       <div className="flex-1 space-y-2">
                         <div className="text-[9px] font-black text-indigo-400 uppercase tracking-widest ml-1">Start Phase</div>
                         <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} name="startDate" className="w-full bg-white px-4 py-3 rounded-xl text-xs font-black border border-indigo-100 shadow-sm outline-none focus:ring-4 focus:ring-indigo-100 transition-all" />
                       </div>
                       <div className="pt-5"><ArrowRight size={18} className="text-indigo-200" /></div>
                       <div className="flex-1 space-y-2">
                         <div className="text-[9px] font-black text-indigo-400 uppercase tracking-widest ml-1">End Phase</div>
                         <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} name="endDate" className="w-full bg-white px-4 py-3 rounded-xl text-xs font-black border border-indigo-100 shadow-sm outline-none focus:ring-4 focus:ring-indigo-100 transition-all" />
                       </div>
                       <div className="bg-white p-4 rounded-2xl text-center border border-indigo-100 min-w-[80px] shadow-sm">
                         <div className="text-[8px] font-black text-indigo-300 uppercase leading-none mb-1">Total</div>
                         <div className="text-2xl font-black text-indigo-600 leading-none">{totalDays}</div>
                         <input type="hidden" name="totalDays" value={totalDays} />
                       </div>
                    </div>

                    <FormField label="Strategic Reason" icon={MessageSquare}>
                      <textarea name="reason" rows={3} required placeholder="State your reason for leave..." className={inputClass + " resize-none h-28"} />
                    </FormField>
                    
                    <div onClick={() => setDeclared(!declared)} className={`group/dec p-5 rounded-[24px] border-2 transition-all flex items-center gap-4 cursor-pointer ${declared ? 'bg-indigo-50 border-indigo-600' : 'bg-slate-50 border-slate-100'}`}>
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${declared ? 'bg-indigo-600 shadow-lg shadow-indigo-200' : 'bg-white border-2 border-slate-200'}`}>
                        {declared && <CheckCircle size={16} className="text-white" />}
                      </div>
                      <span className={`text-[11px] font-black uppercase tracking-widest transition-colors ${declared ? 'text-indigo-900' : 'text-slate-400'}`}>I verify all data is authentic and follows policy</span>
                      <input type="hidden" name="declaration" value={declared ? 'on' : 'off'} />
                    </div>

                    {error && <div className="text-rose-600 text-[10px] font-black uppercase text-center p-3 bg-rose-50 rounded-xl border border-rose-100">{error}</div>}

                    <div className="flex gap-4">
                      <button type="button" onClick={() => setShowApplyModal(false)} className="flex-1 py-5 bg-slate-100 font-black rounded-3xl text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-200 transition-all">Cancel</button>
                      <button type="submit" disabled={isLoading} className="flex-[2] py-5 bg-indigo-600 font-black rounded-3xl text-xs uppercase tracking-[0.2em] text-white shadow-2xl shadow-indigo-200 active:scale-95 transition-all relative overflow-hidden">
                        <span className="relative z-10">{isLoading ? 'Processing Request...' : 'Finalize Application'}</span>
                      </button>
                    </div>
                 </form>
               </>
             )}
           </div>
        </div>,
        document.body
      )}

      {/* ── Approval Workspace Portal ── */}
      {(showApprovalModal && mounted) && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
           <style dangerouslySetInnerHTML={{ __html: `#app-shell { filter: blur(25px); pointer-events: none; transition: 0.5s; }` }} />
           <div className="absolute inset-0 bg-slate-950/40 animate-in fade-in" onClick={() => !isLoading && setShowApprovalModal(false)} />
           <div className="relative w-full max-w-lg bg-white rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
              {success ? (
                <div className="p-20 flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-[28px] bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 shadow-lg shadow-emerald-100"><CheckCircle size={32} /></div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Status Modified</h2>
                </div>
              ) : (
                <>
                  <div className="px-10 py-8 bg-slate-50 flex items-center justify-between border-b border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-white border border-slate-100 text-amber-500 rounded-2xl flex items-center justify-center shadow-sm"><AlertCircle size={22} /></div>
                      <div>
                        <h2 className="text-lg font-black text-slate-900 tracking-tight">Audit Request</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">{selectedRequest?.applicant}</p>
                      </div>
                    </div>
                    <button onClick={() => setShowApprovalModal(false)} className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400"><X size={18} /></button>
                  </div>
                  <div className="p-10 space-y-8">
                    <div className="bg-slate-50/80 p-6 rounded-3xl border border-slate-100 flex flex-col gap-4 shadow-inner">
                       <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Application Period</span>
                         <span className="text-[11px] font-black text-slate-700 tabular-nums">{selectedRequest?.dates}</span>
                       </div>
                       <div className="space-y-2 p-1">
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Applicant Statement</span>
                         <div className="text-[12px] font-bold text-slate-600 italic leading-relaxed bg-white/50 p-4 rounded-2xl border border-dashed text-center">"{selectedRequest?.reason}"</div>
                       </div>
                    </div>

                    <div className="space-y-6">
                      <FormField label="Point of Coverage" icon={User}>
                         <input 
                           value={responsiblePerson}
                           onChange={e => setResponsiblePerson(e.target.value)}
                           placeholder="Primary coverage person" 
                           className={inputClass} 
                         />
                      </FormField>

                      <FormField label="Official Audit Remark" icon={MessageSquare}>
                         <textarea 
                           value={approvalNote}
                           onChange={e => setApprovalNote(e.target.value)}
                           placeholder="Corporate audit trails..." 
                           rows={2} 
                           className={inputClass + " resize-none h-24"} 
                         />
                      </FormField>
                    </div>

                    <div className="flex gap-4">
                       <button 
                         onClick={() => handleApprovalAction('Rejected')}
                         disabled={isLoading}
                         className="flex-1 py-4 bg-white border border-rose-200 text-rose-600 font-black rounded-3xl hover:bg-rose-50 transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-widest">
                         <ThumbsDown size={16} /> Deny
                       </button>
                       <button 
                         onClick={() => handleApprovalAction('Approved')}
                         disabled={isLoading}
                         className="flex-[1.5] py-4 bg-slate-900 text-white font-black rounded-3xl shadow-2xl hover:bg-indigo-600 active:scale-95 transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em] relative overflow-hidden">
                          <ThumbsUp size={16} /> {sessionUser?.role === 'HR' ? 'Grant Final Approval' : 'Authorize & Route to HR'}
                        </button>
                    </div>
                  </div>
                </>
              )}
           </div>
        </div>,
        document.body
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────────
function HistoryIcon({ size = 16, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  );
}
