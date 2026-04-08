import { getSessionUser, getEmployeeDatabase } from '@/app/actions';
import EmployeeDatabaseClient from '@/components/EmployeeDatabaseClient';
import { redirect } from 'next/navigation';
import { User, ChevronRight } from 'lucide-react';

export default async function EmployeeDatabasePage() {
  const user = await getSessionUser();
  if (!user || user.role !== 'HR') {
    redirect('/');
  }

  const employeeDb = await getEmployeeDatabase();

  return (
    <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      
      {/* ── Page Header & Breadcrumbs ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            <span>Portal</span>
            <ChevronRight size={10} />
            <span className="text-indigo-600">Administration</span>
            <ChevronRight size={10} />
            <span className="text-indigo-600">Employee Database</span>
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-3">Employee <span className="text-indigo-600">Database</span></h1>
            <p className="text-slate-500 font-medium text-base max-w-xl">
              Manage organizational profiles, access employee records, and maintain the <span className="text-slate-900 font-bold">HR Master Database</span>.
            </p>
          </div>
        </div>

        {/* Global Employee Stats Pill */}
        <div className="flex items-center gap-3 p-3 px-5 rounded-2xl bg-indigo-50 border border-indigo-100 shadow-sm">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-white text-indigo-600 shadow-sm border border-indigo-50">
            <User size={18} />
          </div>
          <div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Records</div>
            <div className="text-xs font-black text-indigo-700 uppercase tracking-tighter">{employeeDb.length} Employees</div>
          </div>
        </div>
      </div>

      {/* ── Employee Database Component ── */}
      <EmployeeDatabaseClient employeeDb={employeeDb} />

    </div>
  );
}
