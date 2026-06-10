"use client";

import { useState } from "react";
import { Sidebar } from "../_components/sidebar";

export default function AuthPage() {
  const [_showCreateModal, _setShowCreateModal] = useState(false);

  const plans = [
    {
      name: "免费用户",
      subtitle: "默认等级",
      icon: "🆓",
      accent: "bg-[#f5f3ef]",
      border: "border-[#e7e5e0]",
      features: [
        { label: "语音转文字", value: "禁用", type: "danger" as const },
        { label: "回收站保留", value: "7天" },
        { label: "存储空间", value: "100MB" },
      ],
    },
    {
      name: "会员",
      subtitle: "付费等级",
      icon: "⭐",
      accent: "bg-[#f5e6d3]",
      border: "border-[#c9772b]",
      highlighted: true,
      features: [
        { label: "语音转文字", value: "启用", type: "success" as const },
        { label: "回收站保留", value: "30天" },
        { label: "存储空间", value: "1GB" },
      ],
    },
    {
      name: "高级会员",
      subtitle: "尊享等级",
      icon: "👑",
      accent: "bg-[#f5e0df]",
      border: "border-[#e7e5e0]",
      features: [
        { label: "语音转文字", value: "启用", type: "success" as const },
        { label: "回收站保留", value: "90天" },
        { label: "存储空间", value: "5GB" },
      ],
    },
  ];

  const comparisonRows = [
    { feature: "文本笔记", free: true, premium: true, pro: true },
    { feature: "语音记录", free: true, premium: true, pro: true },
    { feature: "手绘作品", free: true, premium: true, pro: true },
    { feature: "语音转文字", free: false, premium: true, pro: true },
    { feature: "回收站保留", free: "7天", premium: "30天", pro: "90天" },
    { feature: "存储空间", free: "100MB", premium: "1GB", pro: "5GB" },
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-[240px] p-10 paper-texture">
        {/* Header */}
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="text-[11px] font-medium text-[#78716c] tracking-[0.2em] uppercase mb-2">Membership</p>
            <h1 className="font-display text-[28px] font-semibold text-[#1c1917] tracking-tight">会员权限</h1>
            <p className="text-[13px] text-[#78716c] mt-1">管理会员等级和权限配置</p>
          </div>
          <button
            onClick={() => _setShowCreateModal(true)}
            className="px-5 py-2.5 bg-[#1c1917] text-white text-[13px] font-medium hover:bg-[#292524] transition-colors duration-200"
          >
            + 创建会员等级
          </button>
        </div>

        {/* Membership Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-white border ${plan.border} p-7 transition-all duration-300 hover:shadow-lg hover:shadow-[#1c1917]/5 hover:-translate-y-0.5 ${
                plan.highlighted ? "ring-1 ring-[#c9772b]/20" : ""
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-6 px-3 py-1 bg-[#c9772b] text-white text-[10px] font-semibold tracking-widest uppercase">
                  推荐
                </div>
              )}
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-12 h-12 ${plan.accent} flex items-center justify-center text-xl`}>
                  {plan.icon}
                </div>
                <div>
                  <h3 className="font-display text-base font-semibold text-[#1c1917]">{plan.name}</h3>
                  <p className="text-[11px] text-[#78716c] tracking-wider uppercase">{plan.subtitle}</p>
                </div>
              </div>
              <div className="space-y-4">
                {plan.features.map((f) => (
                  <div key={f.label} className="flex items-center justify-between text-[13px]">
                    <span className="text-[#78716c]">{f.label}</span>
                    {f.type ? (
                      <span
                        className={`text-[11px] font-medium px-2 py-[2px] border ${
                          f.type === "success"
                            ? "bg-[#e8f0e8] text-[#5c7a5c] border-[#d0e0d0]"
                            : "bg-[#f5e0df] text-[#b4534e] border-[#e5cfcf]"
                        }`}
                      >
                        {f.value}
                      </span>
                    ) : (
                      <span className="font-medium text-[#1c1917] tabular-nums">{f.value}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Permissions Table */}
        <div className="bg-white border border-[#e7e5e0]">
          <div className="px-7 py-5 border-b border-[#e7e5e0]">
            <h2 className="font-display text-lg font-semibold text-[#1c1917]">权限对比</h2>
            <p className="text-[11px] text-[#78716c] mt-0.5 tracking-wider uppercase">Feature Comparison</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e7e5e0]">
                  <th className="px-7 py-3.5 text-left text-[10px] font-semibold text-[#78716c] tracking-[0.15em] uppercase">
                    功能
                  </th>
                  <th className="px-7 py-3.5 text-center text-[10px] font-semibold text-[#78716c] tracking-[0.15em] uppercase">
                    免费用户
                  </th>
                  <th className="px-7 py-3.5 text-center text-[10px] font-semibold text-[#78716c] tracking-[0.15em] uppercase">
                    会员
                  </th>
                  <th className="px-7 py-3.5 text-center text-[10px] font-semibold text-[#78716c] tracking-[0.15em] uppercase">
                    高级会员
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, _i) => (
                  <tr key={row.feature} className="border-b border-[#f5f3ef] last:border-0">
                    <td className="px-7 py-4 text-[13px] text-[#1c1917]">{row.feature}</td>
                    <td className="px-7 py-4 text-center">
                      {typeof row.free === "boolean" ? (
                        <span
                          className={`inline-flex items-center justify-center w-5 h-5 text-[11px] font-bold ${
                            row.free
                              ? "bg-[#e8f0e8] text-[#5c7a5c]"
                              : "bg-[#f5e0df] text-[#b4534e]"
                          }`}
                        >
                          {row.free ? "✓" : "✗"}
                        </span>
                      ) : (
                        <span className="text-[13px] text-[#78716c] tabular-nums">{row.free}</span>
                      )}
                    </td>
                    <td className="px-7 py-4 text-center">
                      {typeof row.premium === "boolean" ? (
                        <span
                          className={`inline-flex items-center justify-center w-5 h-5 text-[11px] font-bold ${
                            row.premium
                              ? "bg-[#e8f0e8] text-[#5c7a5c]"
                              : "bg-[#f5e0df] text-[#b4534e]"
                          }`}
                        >
                          {row.premium ? "✓" : "✗"}
                        </span>
                      ) : (
                        <span className="text-[13px] text-[#78716c] tabular-nums">{row.premium}</span>
                      )}
                    </td>
                    <td className="px-7 py-4 text-center">
                      {typeof row.pro === "boolean" ? (
                        <span
                          className={`inline-flex items-center justify-center w-5 h-5 text-[11px] font-bold ${
                            row.pro
                              ? "bg-[#e8f0e8] text-[#5c7a5c]"
                              : "bg-[#f5e0df] text-[#b4534e]"
                          }`}
                        >
                          {row.pro ? "✓" : "✗"}
                        </span>
                      ) : (
                        <span className="text-[13px] text-[#78716c] tabular-nums">{row.pro}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
