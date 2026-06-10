"use client";

import { useState } from "react";
import { Sidebar } from "../_components/sidebar";

export default function TrashPage() {
  const [_page, _setPage] = useState(1);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-[240px] p-10 paper-texture">
        {/* Header */}
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="text-[11px] font-medium text-[#78716c] tracking-[0.2em] uppercase mb-2">Trash</p>
            <h1 className="font-display text-[28px] font-semibold text-[#1c1917] tracking-tight">回收站</h1>
            <p className="text-[13px] text-[#78716c] mt-1">管理已删除的资源，支持恢复或永久删除</p>
          </div>
          <button className="px-5 py-2.5 bg-[#b4534e] text-white text-[13px] font-medium hover:bg-[#9a4540] transition-colors duration-200">
            清空回收站
          </button>
        </div>

        {/* Trash Table */}
        <div className="bg-white border border-[#e7e5e0]">
          <div className="px-7 py-5 border-b border-[#e7e5e0] flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold text-[#1c1917]">已删除项目</h2>
              <p className="text-[11px] text-[#78716c] mt-0.5 tracking-wider uppercase">Deleted Items</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e7e5e0]">
                  <th className="px-7 py-3.5 text-left text-[10px] font-semibold text-[#78716c] tracking-[0.15em] uppercase">
                    类型
                  </th>
                  <th className="px-7 py-3.5 text-left text-[10px] font-semibold text-[#78716c] tracking-[0.15em] uppercase">
                    资源ID
                  </th>
                  <th className="px-7 py-3.5 text-left text-[10px] font-semibold text-[#78716c] tracking-[0.15em] uppercase">
                    用户
                  </th>
                  <th className="px-7 py-3.5 text-left text-[10px] font-semibold text-[#78716c] tracking-[0.15em] uppercase">
                    删除时间
                  </th>
                  <th className="px-7 py-3.5 text-left text-[10px] font-semibold text-[#78716c] tracking-[0.15em] uppercase">
                    过期时间
                  </th>
                  <th className="px-7 py-3.5 text-left text-[10px] font-semibold text-[#78716c] tracking-[0.15em] uppercase">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={6} className="px-7 py-10 text-center text-[13px] text-[#a8a29e]">
                    回收站为空
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
