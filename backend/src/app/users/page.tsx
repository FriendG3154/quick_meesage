"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Sidebar } from "../_components/sidebar";
import { SearchInput } from "../_components/search-input";
import { Pagination } from "../_components/pagination";
import { Badge } from "../_components/badge";

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const pageSize = 10;

  const { data, isLoading } = api.user.list.useQuery({
    page,
    pageSize,
    search: search || undefined,
  });

  const totalPages = Math.ceil((data?.total ?? 0) / pageSize);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
            <p className="text-sm text-gray-500 mt-1">管理所有注册用户</p>
          </div>
          <SearchInput value={search} onChange={setSearch} placeholder="搜索用户名或手机号..." />
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
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
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    注册时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                      加载中...
                    </td>
                  </tr>
                ) : data?.items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                      暂无用户数据
                    </td>
                  </tr>
                ) : (
                  data?.items.map((user) => (
                    <tr key={user.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#0052ff]/10 flex items-center justify-center text-sm font-medium text-[#0052ff]">
                            {(user.wxName ?? "U")[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{user.wxName ?? "未知用户"}</p>
                            <p className="text-xs text-gray-400">{user.wxOpenid ? "微信用户" : "手机用户"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.phone ?? "-"}</td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={
                            user.role === 2 ? "danger" : user.role === 1 ? "info" : "default"
                          }
                        >
                          {user.role === 2 ? "管理员" : user.role === 1 ? "会员" : "普通用户"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={user.isActive ? "success" : "warning"}>
                          {user.isActive ? "活跃" : "禁用"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString("zh-CN") : "-"}
                      </td>
                      <td className="px-6 py-4">
                        <button className="text-sm text-[#0052ff] hover:underline">查看详情</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </div>
      </main>
    </div>
  );
}
