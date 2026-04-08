"use client";
import {
  LayoutDashboard, Calendar, FileText, Settings,
  LogOut, CheckSquare, Bell, User, ChevronRight,
  Building2, Wallet, Plane
} from "lucide-react";
import { useRouter, usePathname } from 'next/navigation';
import { useTransition, useState } from 'react';
import Link from 'next/link';
import { logoutUser } from '@/app/actions';

const NAV = [
  {
    group: null,
    items: [{ href: '/', icon: LayoutDashboard, label: 'Dashboard' }]
  },
  {
    group: 'WORKSPACE',
    items: [
      { href: '/attendance', icon: CheckSquare, label: 'Attendance' },
      { href: '/leave',       icon: Plane,       label: 'Leave Actions' },
      { href: '/calendar',    icon: Calendar,    label: 'My Calendar' },
    ]
  },
  {
    group: 'PERSONAL',
    items: [
      { href: '/profile',    icon: User,     label: 'My Profile' },
      { href: '/travel-expense', icon: Plane, label: 'Travel Expense' },
      { href: '/advance-salary', icon: Wallet,   label: 'Advance Salary' },
    ]
  },
];

export default function DashboardLayoutClient({ children, user }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [hovered, setHovered] = useState(null);

  const handleLogout = () => startTransition(async () => {
    await logoutUser();
    router.push('/login');
  });

  const initials    = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';
  const displayName = user?.name || 'Unknown User';
  const displayRole = user?.role || 'Employee';
  const isActive    = (href) => href !== '#' && (pathname === href || pathname.startsWith(href + '/'));

  return (
    <div id="app-shell" className="flex h-screen w-full overflow-hidden bg-slate-50 relative">
      
      {/* ── Global Animated Background ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-100/50 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] rounded-full bg-violet-100/50 blur-[100px] animate-pulse delay-700" />
      </div>

      {/* ─────────────────── SIDEBAR ─────────────────── */}
      <aside className="flex flex-col w-[260px] shrink-0 h-full overflow-hidden z-20 relative bg-slate-950 border-r border-slate-800/50 shadow-2xl backdrop-blur-xl">
        
        {/* Decorative Sidebar Glow */}
        <div className="absolute top-0 left-0 w-full h-[30%] bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />

        {/* Logo */}
        <div className="flex items-center gap-4 px-6 py-8 border-b border-white/5 relative z-10">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl shrink-0 bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M4 4h4v16H4V4zm6 0h4l6 8-6 8h-4l6-8-6-8z"/>
            </svg>
          </div>
          <div>
            <div className="text-white font-black text-sm tracking-tight leading-none uppercase">Aura HRMS</div>
            <div className="text-[10px] font-black tracking-[0.2em] mt-1 text-slate-500 uppercase">Enterprise</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-1 relative z-10 custom-scrollbar">
          {(() => {
            const itemsToRender = [...NAV];
            if (user?.role === 'HR') {
              itemsToRender.push({
                group: 'ADMINISTRATION',
                items: [{ href: '/employee-database', icon: User, label: 'Employee Database' }]
              });
            }
            return itemsToRender.map(({ group, items }) => (
              <div key={group || 'main'} className={group ? 'mt-8' : ''}>
                {group && (
                  <div className="px-4 mb-3 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">
                    {group}
                  </div>
                )}
                {items.map(({ href, icon: Icon, label }) => {
                  const active = isActive(href);
                  return (
                    <Link key={label} href={href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-bold transition-all duration-300 relative group no-underline
                        ${active ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                      onMouseEnter={() => setHovered(label)}
                      onMouseLeave={() => setHovered(null)}
                    >
                      {active && (
                        <div className="absolute inset-0 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-600/30 ring-1 ring-white/10" />
                      )}
                      {!active && hovered === label && (
                        <div className="absolute inset-0 rounded-2xl bg-white/5" />
                      )}
                      <Icon size={18} className={`relative z-10 shrink-0 transition-transform duration-300 group-hover:scale-110 ${active ? 'text-white' : 'text-slate-500'}`} />
                      <span className="relative z-10 flex-1">{label}</span>
                      {active && <ChevronRight size={14} className="relative z-10 opacity-60" />}
                    </Link>
                  );
                })}
              </div>
            ));
          })()}
        </nav>

        {/* User Card */}
        <div className="p-4 border-t border-white/5 relative z-10">
          <div className="flex items-center gap-3 p-4 rounded-3xl bg-white/5 border border-white/5 shadow-inner mb-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black text-white shrink-0 bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md ring-1 ring-white/30">
              {initials}
            </div>
            <div className="overflow-hidden flex-1">
              <div className="text-[13px] font-black text-white truncate leading-none mb-1">{displayName}</div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{displayRole}</div>
            </div>
          </div>
          <button onClick={handleLogout} disabled={isPending}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300
              ${isPending ? 'opacity-50 cursor-not-allowed' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-rose-900/20 hover:text-rose-400 hover:border-rose-900/30'}`}
          >
            <LogOut size={14} />
            {isPending ? 'Signing out…' : 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* ─────────────────── MAIN ─────────────────── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-transparent relative z-10">

        {/* Header */}
        <header className="h-20 shrink-0 flex items-center justify-between px-10 bg-white/40 backdrop-blur-3xl border-b border-indigo-100/50 shadow-sm">

          {/* Left: Search or Indicator */}
          <div className="flex items-center gap-4">
             <div className="p-2.5 rounded-2xl bg-white border border-indigo-100 shadow-sm text-indigo-600">
               <Building2 size={20} />
             </div>
             <div>
               <h1 className="text-base font-black text-slate-900 tracking-tight leading-none mb-1">Aura HR Portal</h1>
               <div className="flex items-center gap-2">
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Online</span>
               </div>
             </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <button className="relative w-10 h-10 rounded-2xl flex items-center justify-center bg-white border border-slate-100 shadow-sm hover:border-indigo-200 transition-all group overflow-hidden">
                <div className="absolute inset-0 bg-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Bell size={18} className="text-slate-400 relative z-10 group-hover:text-indigo-600 transition-colors" />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white z-20" />
              </button>
            </div>

            <div className="h-8 w-px bg-slate-200" />

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-black text-slate-800 leading-none mb-1">{displayName}</div>
                <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none">{displayRole}</div>
              </div>
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-xs font-black text-white bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg ring-4 ring-white">
                {initials}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
        
        .animate-slide-up {
          animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
