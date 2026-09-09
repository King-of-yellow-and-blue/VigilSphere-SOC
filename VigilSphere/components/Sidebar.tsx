"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Activity, Share2, Settings, User } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Dashboard', icon: Shield },
    { href: '/triage', label: 'Triage Alerts', icon: Activity },
    { href: '/integrations', label: 'Integrations', icon: Share2 },
  ];

  return (
    <div className="w-64 h-full bg-black/40 backdrop-blur-xl border-r border-cyan-900/50 flex flex-col pt-8 pb-4 isolate z-50">
      <div className="px-6 mb-12">
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 tracking-wider">
          VIGILSPHERE
        </h1>
        <p className="text-cyan-600/70 text-xs tracking-[0.2em] mt-1 uppercase font-mono">
          Security Operations
        </p>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shadow-[inset_0_0_15px_rgba(6,182,212,0.1)]'
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 border border-transparent'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]' : 'opacity-70'}`} />
              <span className="font-medium text-sm tracking-wide">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,1)]" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 mt-auto">
        <div className="pt-4 border-t border-cyan-900/30 space-y-2">
           <Link href="/settings" className="flex items-center gap-3 px-4 py-2 w-full text-left text-gray-500 hover:text-gray-300 transition-colors">
              <Settings className="w-4 h-4" />
              <span className="text-sm">Settings</span>
           </Link>
           <Link href="/settings" className="flex items-center gap-3 px-4 py-2 w-full text-left text-gray-500 hover:text-gray-300 transition-colors">
              <User className="w-4 h-4" />
              <span className="text-sm">Analyst Profile</span>
           </Link>
        </div>
      </div>
    </div>
  );
}
