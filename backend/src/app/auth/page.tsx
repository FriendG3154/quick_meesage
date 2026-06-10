"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Sidebar } from "../_components/sidebar";
import { Badge } from "../_components/badge";

export default function AuthPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">会员权限</h1>
            <p className="text-sm text-gray-500 mt-1">管理会员等级和权限配置</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-[#0052ff] text-white rounded-lg text-sm font-medium hover:bg-[#002b85] transition-colors"
          >
            + 创建会员等级
          </button>
        </div>

        {/* Membership Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Free Plan */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-xl">🆓</div>
              <div>
                <h3 className="font-semibold text-gray-900">免费用户</h3>
                <p className="text-xs text-gray-500">默认等级</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">语音转文字</span>
                <Badge variant="danger">禁用</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">回收站保留</span>
                <span className="text-gray-900 font-medium">7天</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">存储空间</span>
                <span className="text-gray-900 font-medium">100MB</span>
              </div>
            </div>
          </div>

          {/* Premium Plan */}
          <div className="bg-white rounded-xl border-2 border-[#0052ff] p-6 shadow-sm relative">
            <div className="absolute -top-3 left-4 px-2 py-0.5 bg-[#0052ff] text-white text-xs font-medium rounded">
              推荐
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#0052ff]/10 flex items-center justify-center text-xl">⭐</div>
              <div>
                <h3 className="font-semibold text-gray-900">会员</h3>
                <p className="text-xs text-gray-500">付费等级</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">语音转文字</span>
                <Badge variant="success">启用</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">回收站保留</span>
                <span className="text-gray-900 font-medium">30天</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">存储空间</span>
                <span className="text-gray-900 font-medium">1GB</span>
              </div>
            </div>
          </div>

          {/* Pro Plan */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center text-xl">👑</div>
              <div>
                <h3 className="font-semibold text-gray-900">高级会员</h3>
                <p className="text-xs text-gray-500">尊享等级</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">语音转文字</span>
                <Badge variant="success">启用</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">回收站保留</span>
                <span className="text-gray-900 font-medium">90天</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">存储空间</span>
                <span className="text-gray-900 font-medium">5GB</span>
              </div>
            </div>
          </div>
        </div>

        {/* Permissions Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">权限对比</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    功能
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    免费用户
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    会员
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    高级会员
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">文本笔记</td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant="success">✓</Badge>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant="success">✓</Badge>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant="success">✓</Badge>
                  </td>
                </tr>
                <tr className="border-b border-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">语音记录</td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant="success">✓</Badge>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant="success">✓</Badge>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant="success">✓</Badge>
                  </td>
                </tr>
                <tr className="border-b border-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">手绘作品</td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant="success">✓</Badge>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant="success">✓</Badge>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant="success">✓</Badge>
                  </td>
                </tr>
                <tr className="border-b border-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">语音转文字</td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant="danger">✗</Badge>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant="success">✓</Badge>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant="success">✓</Badge>
                  </td>
                </tr>
                <tr className="border-b border-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">回收站保留</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">7天</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">30天</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">90天</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">存储空间</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">100MB</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">1GB</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">5GB</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
