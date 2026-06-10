"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "概览", icon: "📊" },
  { href: "/users", label: "用户管理", icon: "👥" },
  { href: "/messages", label: "笔记管理", icon: "📝" },
  { href: "/trash", label: "回收站", icon: "🗑️" },
  { href: "/auth", label: "会员权限", icon: "🔐" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
        <div className="w-8 h-8 rounded-lg bg-[#0052ff] flex items-center justify-center text-white font-bold text-sm">
          Q
        </div>
        <div>
          <h1 className="font-semibold text-gray-900 text-sm">快灵感管理后台</h1>
          <p className="text-xs text-gray-400">Quick Message</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-[#0052ff]/10 text-[#0052ff] font-medium"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">管理员</p>
            <p className="text-xs text-gray-400 truncate">admin@qm.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
