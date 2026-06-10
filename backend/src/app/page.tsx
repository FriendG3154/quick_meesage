"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { StatCard } from "./_components/stat-card";
import { Sidebar } from "./_components/sidebar";

export default function DashboardPage() {
  const { data: globalStats, isLoading: statsLoading } = api.message.getGlobalStats.useQuery();
  const { data: userList, isLoading: usersLoading } = api.user.list.useQuery({ page: 1, pageSize: 5 });

  const recentUsers = userList?.items ?? [];

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">概览</h1>
          <p className="text-sm text-gray-500 mt-1">欢迎回来，查看今日数据概况</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="总笔记数"
            value={globalStats?.total ?? 0}
            icon="📝"
          />
          <StatCard
            title="今日新增"
            value={globalStats?.today ?? 0}
            change="较昨日 +12%"
            changeType="positive"
            icon="📈"
          />
          <StatCard
            title="本周新增"
            value={globalStats?.thisWeek ?? 0}
            icon="📅"
          />
          <StatCard
            title="注册用户"
            value={userList?.total ?? 0}
            icon="👥"
          />
        </div>

        {/* Recent Users */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">最近注册用户</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    用户
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    手机号
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    角色
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    注册时间
                  </th>
                </tr>
              </thead>
              <tbody>
                {usersLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                      加载中...
                    </td>
                  </tr>
                ) : recentUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                      暂无用户数据
                    </td>
                  </tr>
                ) : (
                  recentUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#0052ff]/10 flex items-center justify-center text-sm font-medium text-[#0052ff]">
                            {(user.wxName ?? "U")[0]}
                          </div>
                          <span className="text-sm text-gray-900">{user.wxName ?? "未知用户"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.phone ?? "-"}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 2
                            ? "bg-purple-50 text-purple-700"
                            : user.role === 1
                            ? "bg-blue-50 text-blue-700"
                            : "bg-gray-50 text-gray-700"
                        }`}>
                          {user.role === 2 ? "管理员" : user.role === 1 ? "会员" : "普通用户"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString("zh-CN") : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
