"use client";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: React.ReactNode;
  accent?: "amber" | "sage" | "rose" | "slate";
}

const accentMap = {
  amber: {
    bg: "bg-[#f5e6d3]",
    text: "text-[#c9772b]",
    border: "border-[#e7d5c0]",
  },
  sage: {
    bg: "bg-[#e8f0e8]",
    text: "text-[#5c7a5c]",
    border: "border-[#d0e0d0]",
  },
  rose: {
    bg: "bg-[#f5e0df]",
    text: "text-[#b4534e]",
    border: "border-[#e5cfcf]",
  },
  slate: {
    bg: "bg-[#e8ecf1]",
    text: "text-[#4a5568]",
    border: "border-[#d0d8e0]",
  },
};

export function StatCard({ title, value, change, changeType = "neutral", icon, accent = "amber" }: StatCardProps) {
  const colors = accentMap[accent];

  const changeColor = {
    positive: "text-[#5c7a5c]",
    negative: "text-[#b4534e]",
    neutral: "text-[#78716c]",
  }[changeType];

  return (
    <div className="group relative bg-white border border-[#e7e5e0] p-6 transition-all duration-300 hover:shadow-lg hover:shadow-[#1c1917]/5 hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[11px] font-medium text-[#78716c] tracking-widest uppercase mb-3">{title}</p>
          <p className="font-display text-3xl font-semibold text-[#1c1917] tabular-nums">{value}</p>
          {change && (
            <p className={`text-[12px] mt-2 font-medium ${changeColor}`}>{change}</p>
          )}
        </div>
        <div className={`w-11 h-11 rounded-lg ${colors.bg} ${colors.text} flex items-center justify-center border ${colors.border} transition-transform duration-300 group-hover:scale-110`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
