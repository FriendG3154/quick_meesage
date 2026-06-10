"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Sidebar } from "../_components/sidebar";

export default function MessagesPage() {
  const [_page, _setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data } = api.message.getGlobalStats.useQuery();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-[240px] p-10 paper-texture">
        {/* Header */}
        <div className="mb-10">
          <p className="text-[11px] font-medium text-[#78716c] tracking-[0.2em] uppercase mb-2">Note Management</p>
          <h1 className="font-display text-[28px] font-semibold text-[#1c1917] tracking-tight">笔记管理</h1>
          <p className="text-[13px] text-[#78716c] mt-1">管理所有用户笔记</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          <div className="bg-white border border-[#e7e5e0] p-6 group hover:shadow-lg hover:shadow-[#1c1917]/5 hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-[#e8ecf1] text-[#4a5568] flex items-center justify-center border border-[#d0d8e0]">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <div>
                <p className="text-[11px] font-medium text-[#78716c] tracking-widest uppercase mb-1">文本笔记</p>
                <p className="font-display text-2xl font-semibold text-[#1c1917] tabular-nums">{data?.total ?? 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-[#e7e5e0] p-6 group hover:shadow-lg hover:shadow-[#1c1917]/5 hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-[#f5e6d3] text-[#c9772b] flex items-center justify-center border border-[#e7d5c0]">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                </svg>
              </div>
              <div>
                <p className="text-[11px] font-medium text-[#78716c] tracking-widest uppercase mb-1">语音记录</p>
                <p className="font-display text-2xl font-semibold text-[#1c1917] tabular-nums">-</p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-[#e7e5e0] p-6 group hover:shadow-lg hover:shadow-[#1c1917]/5 hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-[#e8f0e8] text-[#5c7a5c] flex items-center justify-center border border-[#d0e0d0]">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 19l7-7 3 3-7 7-3-3z" />
                  <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                  <path d="M2 2l7.586 7.586" />
                  <circle cx="11" cy="11" r="2" />
                </svg>
              </div>
              <div>
                <p className="text-[11px] font-medium text-[#78716c] tracking-widest uppercase mb-1">手绘作品</p>
                <p className="font-display text-2xl font-semibold text-[#1c1917] tabular-nums">-</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: "all", label: "全部" },
            { key: "text", label: "文本" },
            { key: "voice", label: "语音" },
            { key: "drawing", label: "手绘" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTypeFilter(t.key)}
              className={`px-4 py-2 text-[13px] font-medium transition-all duration-200 ${
                typeFilter === t.key
                  ? "bg-[#1c1917] text-white border border-[#1c1917]"
                  : "bg-white text-[#78716c] border border-[#e7e5e0] hover:border-[#c9772b] hover:text-[#c9772b]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Messages Table */}
        <div className="bg-white border border-[#e7e5e0]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e7e5e0]">
                  <th className="px-7 py-3.5 text-left text-[10px] font-semibold text-[#78716c] tracking-[0.15em] uppercase">
                    类型
                  </th>
                  <th className="px-7 py-3.5 text-left text-[10px] font-semibold text-[#78716c] tracking-[0.15em] uppercase">
                    标题
                  </th>
                  <th className="px-7 py-3.5 text-left text-[10px] font-semibold text-[#78716c] tracking-[0.15em] uppercase">
                    用户
                  </th>
                  <th className="px-7 py-3.5 text-left text-[10px] font-semibold text-[#78716c] tracking-[0.15em] uppercase">
                    字数/时长
                  </th>
                  <th className="px-7 py-3.5 text-left text-[10px] font-semibold text-[#78716c] tracking-[0.15em] uppercase">
                    创建时间
                  </th>
                  <th className="px-7 py-3.5 text-left text-[10px] font-semibold text-[#78716c] tracking-[0.15em] uppercase">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={6} className="px-7 py-10 text-center text-[13px] text-[#a8a29e]">
                    暂无笔记数据
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
