"use client";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

const variantStyles = {
  default: "bg-[#f5f3ef] text-[#78716c] border-[#e7e5e0]",
  success: "bg-[#e8f0e8] text-[#5c7a5c] border-[#d0e0d0]",
  warning: "bg-[#f5e6d3] text-[#c9772b] border-[#e7d5c0]",
  danger: "bg-[#f5e0df] text-[#b4534e] border-[#e5cfcf]",
  info: "bg-[#e8ecf1] text-[#4a5568] border-[#d0d8e0]",
};

export function Badge({ children, variant = "default" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-[3px] text-[11px] font-medium tracking-wide border ${variantStyles[variant]}`}>
      {children}
    </span>
  );
}
