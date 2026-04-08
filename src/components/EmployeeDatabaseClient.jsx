"use client";
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, X, Search, Mail, Phone, Calendar, Briefcase, Building2, ShieldCheck, MapPin, FileText, CreditCard, Landmark, ClipboardList, ShieldQuestion, ExternalLink } from 'lucide-react';

export default function EmployeeDatabaseClient({ employeeDb = [] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [mounted, setMounted]       = useState(false);
  
  useEffect(() => { setMounted(true); }, []);
  
  useEffect(() => {
    if (selectedUser) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [selectedUser]);

  const filteredEmployees = employeeDb.filter(emp => 
    emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    emp.empId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-10">
      
      {/* ── Search & Filter ── */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        <div className="px-10 py-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100">
              <Search size={18} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Organization Profiles</h2>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">HR Master Database</div>
            </div>
          </div>
          <div className="relative flex-1 max-w-md">
            <input 
              type="text" 
              placeholder="SEARCH BY NAME, ID, OR ROLE..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-3.5 text-[11px] font-black tracking-widest text-slate-700 shadow-sm outline-none focus:border-indigo-600 transition-all placeholder:text-slate-300"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/80 backdrop-blur-md border-b border-slate-50">
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Employee</th>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Role & Dept</th>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Contact</th>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Joined</th>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredEmployees.length === 0 ? (
                <tr><td colSpan={5} className="py-24 text-center text-slate-300 font-black uppercase tracking-widest">No profiles matched your query</td></tr>
              ) : filteredEmployees.map((emp, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-xs shadow-md group-hover:scale-105 transition-transform">{emp.fullName[0]}</div>
                      <div>
                        <div className="text-[13px] font-black text-slate-900 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{emp.fullName}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{emp.empId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="text-[11px] font-black text-indigo-600 uppercase tracking-widest mb-1">{emp.designation}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{emp.department}</div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="text-[12px] font-black text-slate-700">{emp.email}</div>
                    <div className="text-[10px] font-bold text-slate-400 tabular-nums lowercase">{emp.contactNo}</div>
                  </td>
                  <td className="px-10 py-6 text-center text-[11px] font-black text-slate-500 tabular-nums uppercase">{emp.doj}</td>
                  <td className="px-10 py-6 text-right">
                    <button 
                      onClick={() => setSelectedUser(emp)}
                      className="bg-slate-100 text-slate-600 font-black px-5 py-2 rounded-xl text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all active:scale-95 shadow-sm border border-slate-200/50">
                      Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Employee Detail Modal ── */}
      {(selectedUser && mounted) && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
           <style dangerouslySetInnerHTML={{ __html: `#app-shell { filter: blur(25px); pointer-events: none; transition: 0.5s; }` }} />
           <div className="absolute inset-0 bg-slate-950/40 animate-in fade-in" onClick={() => setSelectedUser(null)} />
           <div className="relative w-full max-w-4xl bg-white rounded-[48px] shadow-[0_32px_120px_-15px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-500">
              <div className="px-10 py-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-3xl bg-slate-900 border border-slate-800 text-white flex items-center justify-center text-xl font-black shadow-lg shadow-slate-200">{selectedUser.fullName[0]}</div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-2">{selectedUser.fullName}</h2>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedUser.empId} — Organizational Profile</div>
                  </div>
                </div>
                <button onClick={() => setSelectedUser(null)} className="w-10 h-10 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 transition-all flex items-center justify-center shadow-sm"><X size={18} /></button>
              </div>
              
              <div className="max-h-[min(700px,80vh)] overflow-y-auto custom-scrollbar p-10 space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 size={10} className="text-indigo-400" />
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Department</div>
                      </div>
                      <div className="text-[12px] font-black text-slate-900 uppercase">{selectedUser.department}</div>
                    </div>
                    <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2 mb-1">
                        <Briefcase size={10} className="text-indigo-400" />
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Designation</div>
                      </div>
                      <div className="text-[12px] font-black text-slate-900 uppercase">{selectedUser.designation}</div>
                    </div>
                    <div className="space-y-1.5 p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
                      <div className="flex items-center gap-2 mb-1">
                        <Mail size={10} className="text-indigo-400" />
                        <div className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Email Address</div>
                      </div>
                      <div className="text-[12px] font-black text-indigo-600 truncate" title={selectedUser.email}>{selectedUser.email}</div>
                    </div>
                    <div className="space-y-1.5 p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
                      <div className="flex items-center gap-2 mb-1">
                        <Phone size={10} className="text-indigo-400" />
                        <div className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Contact Number</div>
                      </div>
                      <div className="text-[12px] font-black text-indigo-600 tabular-nums">{selectedUser.contactNo}</div>
                    </div>
                    <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar size={10} className="text-indigo-400" />
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Joining Date</div>
                      </div>
                      <div className="text-[12px] font-black text-slate-900 tabular-nums uppercase">{selectedUser.doj}</div>
                    </div>
                    <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2 mb-1">
                        <ShieldCheck size={10} className="text-indigo-400" />
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Experience</div>
                      </div>
                      <div className="text-[12px] font-black text-slate-900 uppercase">{selectedUser.experienceLevel}</div>
                    </div>
                 </div>

                 {/* ── Document Repository ── */}
                 <div className="pt-6 border-t border-slate-100">
                   <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
                        <FileText size={14} />
                      </div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Document Repository</h3>
                   </div>
                   
                   <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                      {[
                        { label: 'PAN Card', icon: CreditCard, key: 'panCard' },
                        { label: 'Aadhar Card', icon: ShieldQuestion, key: 'aadharCard' },
                        { label: 'Offer Letter', icon: FileText, key: 'offerLetter' },
                        { label: 'Joining Doc', icon: ClipboardList, key: 'joiningLetter' },
                        { label: 'Confirmation', icon: ShieldCheck, key: 'confirmationLetter' },
                        { label: 'Qualifications', icon: Landmark, key: 'qualifications' },
                        { label: 'Bank Passbook', icon: Landmark, key: 'passbook' },
                        { label: 'Relieving', icon: FileText, key: 'relievingLetter' },
                        { label: 'Experience Cert', icon: ClipboardList, key: 'expCertificate' },
                      ].map((doc, idx) => {
                        const uri = selectedUser[doc.key];
                        return (
                          <div key={idx} className={`p-3 rounded-[32px] border transition-all flex flex-col items-center justify-center text-center gap-2
                            ${uri ? 'bg-white border-indigo-100 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-50/50 cursor-pointer group/doc' : 'bg-slate-50 border-slate-100 opacity-60'}`}
                            onClick={() => uri && window.open(uri, '_blank')}
                          >
                             <div className={`w-9 h-9 rounded-2xl flex items-center justify-center mb-0.5
                               ${uri ? 'bg-indigo-50 text-indigo-600 group-hover/doc:bg-indigo-600 group-hover/doc:text-white' : 'bg-slate-100 text-slate-400'}`}>
                               <doc.icon size={16} />
                             </div>
                             <div className="text-[8.5px] font-black uppercase tracking-widest text-slate-900 leading-none">{doc.label}</div>
                             <div className={`text-[7px] font-bold uppercase tracking-tight
                               ${uri ? 'text-indigo-500' : 'text-slate-400'}`}>
                               {uri ? 'VIEW FILE' : 'PENDING'}
                             </div>
                          </div>
                        );
                      })}
                   </div>
                 </div>

                 <div className="pt-2">
                   <button onClick={() => setSelectedUser(null)} className="w-full py-5 bg-slate-900 text-white font-black rounded-3xl text-sm uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-600 transition-all active:scale-95 leading-none">Close Employee Profile</button>
                 </div>
              </div>
           </div>
        </div>,
        document.body
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
        
        .modal-open { overflow: hidden !important; }
      `}</style>
    </div>
  );
}
