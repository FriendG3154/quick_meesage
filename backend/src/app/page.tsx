"use client";

import { api } from "~/trpc/react";
import { StatCard } from "./_components/stat-card";
import { Sidebar } from "./_components/sidebar";

function PenLineIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function TrendingUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export default function DashboardPage() {
  const { data: globalStats } = api.message.getGlobalStats.useQuery();
  const { data: userList, isLoading: usersLoading } = api.user.list.useQuery({ page: 1, pageSize: 5 });

  const recentUsers = userList?.items ?? [];

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-[240px] p-10 paper-texture">
        {/* Header */}
        <div className="mb-10 animate-fade-in-up">
          <p className="text-[11px] font-medium text-[#78716c] tracking-[0.2em] uppercase mb-2">Dashboard</p>
          <h1 className="font-display text-[28px] font-semibold text-[#1c1917] tracking-tight">概览</h1>
          <p className="text-[13px] text-[#78716c] mt-1">欢迎回来，查看今日数据概况</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          <div className="animate-fade-in-up stagger-1">
            <StatCard
              title="总笔记数"
              value={globalStats?.total ?? 0}
              icon={<PenLineIcon className="w-5 h-5" />}
              accent="amber"
            />
          </div>
          <div className="animate-fade-in-up stagger-2">
            <StatCard
              title="今日新增"
              value={globalStats?.today ?? 0}
              change="较昨日 +12%"
              changeType="positive"
              icon={<TrendingUpIcon className="w-5 h-5" />}
              accent="sage"
            />
          </div>
          <div className="animate-fade-in-up stagger-3">
            <StatCard
              title="本周新增"
              value={globalStats?.thisWeek ?? 0}
              icon={<CalendarIcon className="w-5 h-5" />}
              accent="slate"
            />
          </div>
          <div className="animate-fade-in-up stagger-4">
            <StatCard
              title="注册用户"
              value={userList?.total ?? 0}
              icon={<UsersIcon className="w-5 h-5" />}
              accent="rose"
            />
          </div>
        </div>

        {/* Recent Users */}
        <div className="animate-fade-in-up stagger-5">
          <div className="bg-white border border-[#e7e5e0]">
            <div className="px-7 py-5 border-b border-[#e7e5e0] flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold text-[#1c1917]">最近注册用户</h2>
                <p className="text-[11px] text-[#78716c] mt-0.5 tracking-wider uppercase">Recent Users</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#e7e5e0]">
                    <th className="px-7 py-3.5 text-left text-[10px] font-semibold text-[#78716c] tracking-[0.15em] uppercase">
                      用户
                    </th>
                    <th className="px-7 py-3.5 text-left text-[10px] font-semibold text-[#78716c] tracking-[0.15em] uppercase">
                      手机号
                    </th>
                    <th className="px-7 py-3.5 text-left text-[10px] font-semibold text-[#78716c] tracking-[0.15em] uppercase">
                      角色
                    </th>
                    <th className="px-7 py-3.5 text-left text-[10px] font-semibold text-[#78716c] tracking-[0.15em] uppercase">
                      注册时间
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {usersLoading ? (
                    <tr>
                      <td colSpan={4} className="px-7 py-10 text-center text-[13px] text-[#a8a29e]">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-[#e7e5e0] border-t-[#c9772b] rounded-full animate-spin" />
                          加载中...
                        </div>
                      </td>
                    </tr>
                  ) : recentUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-7 py-10 text-center text-[13px] text-[#a8a29e]">
                        暂无用户数据
                      </td>
                    </tr>
                  ) : (
                    recentUsers.map((user) => (
                      <tr key={user.id} className="border-b border-[#f5f3ef] last:border-0 hover:bg-[#faf9f7] transition-colors duration-200">
                        <td className="px-7 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#f5e6d3] flex items-center justify-center text-[12px] font-semibold text-[#c9772b]">
                              {(user.wxName ?? "U")[0]}
                            </div>
                            <span className="text-[13px] text-[#1c1917]">{user.wxName ?? "未知用户"}</span>
                          </div>
                        </td>
                        <td className="px-7 py-4 text-[13px] text-[#78716c]">{user.phone ?? "-"}</td>
                        <td className="px-7 py-4">
                          <span className={`inline-flex items-center px-2 py-[2px] text-[11px] font-medium border ${
                            user.role === 2
                              ? "bg-[#f5e0df] text-[#b4534e] border-[#e5cfcf]"
                              : user.role === 1
                              ? "bg-[#e8f0e8] text-[#5c7a5c] border-[#d0e0d0]"
                              : "bg-[#f5f3ef] text-[#78716c] border-[#e7e5e0]"
                          }`}>
                            {user.role === 2 ? "管理员" : user.role === 1 ? "会员" : "普通用户"}
                          </span>
                        </td>
                        <td className="px-7 py-4 text-[13px] text-[#a8a29e]">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString("zh-CN") : "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
