"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Sidebar } from "../_components/sidebar";
import { SearchInput } from "../_components/search-input";
import { Pagination } from "../_components/pagination";

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
      <main className="flex-1 ml-[240px] p-10 paper-texture">
        {/* Header */}
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="text-[11px] font-medium text-[#78716c] tracking-[0.2em] uppercase mb-2">User Management</p>
            <h1 className="font-display text-[28px] font-semibold text-[#1c1917] tracking-tight">用户管理</h1>
            <p className="text-[13px] text-[#78716c] mt-1">管理所有注册用户</p>
          </div>
          <SearchInput value={search} onChange={setSearch} placeholder="搜索用户名或手机号..." />
        </div>

        {/* Users Table */}
        <div className="bg-white border border-[#e7e5e0]">
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
                    状态
                  </th>
                  <th className="px-7 py-3.5 text-left text-[10px] font-semibold text-[#78716c] tracking-[0.15em] uppercase">
                    注册时间
                  </th>
                  <th className="px-7 py-3.5 text-left text-[10px] font-semibold text-[#78716c] tracking-[0.15em] uppercase">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-7 py-10 text-center text-[13px] text-[#a8a29e]">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-[#e7e5e0] border-t-[#c9772b] rounded-full animate-spin" />
                        加载中...
                      </div>
                    </td>
                  </tr>
                ) : data?.items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-7 py-10 text-center text-[13px] text-[#a8a29e]">
                      暂无用户数据
                    </td>
                  </tr>
                ) : (
                  data?.items.map((user) => (
                    <tr key={user.id} className="border-b border-[#f5f3ef] last:border-0 hover:bg-[#faf9f7] transition-colors duration-200">
                      <td className="px-7 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#f5e6d3] flex items-center justify-center text-[12px] font-semibold text-[#c9772b]">
                            {(user.wxName ?? "U")[0]}
                          </div>
                          <div>
                            <p className="text-[13px] font-medium text-[#1c1917]">{user.wxName ?? "未知用户"}</p>
                            <p className="text-[11px] text-[#a8a29e]">{user.wxOpenid ? "微信用户" : "手机用户"}</p>
                          </div>
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
                      <td className="px-7 py-4">
                        <span className={`inline-flex items-center px-2 py-[2px] text-[11px] font-medium border ${
                          user.isActive
                            ? "bg-[#e8f0e8] text-[#5c7a5c] border-[#d0e0d0]"
                            : "bg-[#f5e6d3] text-[#c9772b] border-[#e7d5c0]"
                        }`}>
                          {user.isActive ? "活跃" : "禁用"}
                        </span>
                      </td>
                      <td className="px-7 py-4 text-[13px] text-[#a8a29e]">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString("zh-CN") : "-"}
                      </td>
                      <td className="px-7 py-4">
                        <button className="text-[13px] text-[#c9772b] hover:text-[#a06020] transition-colors duration-200 font-medium">
                          查看详情
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="py-4 border-t border-[#f5f3ef]">
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
