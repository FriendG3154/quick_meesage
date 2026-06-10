"use client";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({ value, onChange, placeholder = "搜索..." }: SearchInputProps) {
  return (
    <div className="relative group">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-72 pl-10 pr-4 py-2.5 bg-white border border-[#e7e5e0] text-[13px] text-[#1c1917] placeholder:text-[#a8a29e] focus:outline-none focus:border-[#c9772b] focus:ring-1 focus:ring-[#c9772b]/20 transition-all duration-300"
      />
      <svg
        className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a8a29e] group-focus-within:text-[#c9772b] transition-colors duration-300"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
        />
      </svg>
    </div>
  );
}
