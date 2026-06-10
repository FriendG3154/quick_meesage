"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "概览", icon: LayoutGrid },
  { href: "/users", label: "用户", icon: Users },
  { href: "/messages", label: "笔记", icon: FileText },
  { href: "/trash", label: "回收站", icon: Trash2 },
  { href: "/auth", label: "权限", icon: Shield },
];

function LayoutGrid({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function Users({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function FileText({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  );
}

function Trash2({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

function Shield({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-[240px] bg-[#1c1917] flex flex-col z-50">
      {/* Logo区域 */}
      <div className="px-7 py-8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#c9772b] flex items-center justify-center">
            <span className="text-white font-display text-sm font-bold tracking-wider">Q</span>
          </div>
          <div>
            <h1 className="font-display text-white text-base font-semibold tracking-wide">快灵感</h1>
            <p className="text-[11px] text-[#78716c] -mt-0.5 tracking-widest uppercase">Admin</p>
          </div>
        </div>
      </div>

      {/* 分隔线 */}
      <div className="mx-7 h-px bg-[#292524]" />

      {/* 导航 */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3.5 px-4 py-3 rounded-lg text-[13px] transition-all duration-300 ${
                isActive
                  ? "bg-[#c9772b]/15 text-[#d4a574] font-medium"
                  : "text-[#a8a29e] hover:text-[#e7e5e0] hover:bg-[#292524]/50"
              }`}
            >
              <Icon className={`w-[18px] h-[18px] ${isActive ? "text-[#d4a574]" : "text-[#78716c]"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* 底部信息 */}
      <div className="px-7 py-5 border-t border-[#292524]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#292524] flex items-center justify-center">
            <span className="text-[11px] font-medium text-[#a8a29e]">A</span>
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-[#e7e5e0] truncate">管理员</p>
            <p className="text-[11px] text-[#78716c] truncate">admin@qm.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
