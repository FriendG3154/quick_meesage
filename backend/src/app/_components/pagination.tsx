"use client";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
    if (totalPages <= 5) return i + 1;
    if (currentPage <= 3) return i + 1;
    if (currentPage >= totalPages - 2) return totalPages - 4 + i;
    return currentPage - 2 + i;
  });

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-1.5 mt-8">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="px-3 py-2 text-[12px] font-medium text-[#78716c] border border-[#e7e5e0] hover:border-[#c9772b] hover:text-[#c9772b] disabled:opacity-30 disabled:hover:border-[#e7e5e0] disabled:hover:text-[#78716c] disabled:cursor-not-allowed transition-all duration-200"
      >
        上一页
      </button>

      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`w-9 h-9 text-[13px] font-medium transition-all duration-200 ${
            page === currentPage
              ? "bg-[#1c1917] text-white border border-[#1c1917]"
              : "text-[#78716c] border border-[#e7e5e0] hover:border-[#c9772b] hover:text-[#c9772b]"
          }`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="px-3 py-2 text-[12px] font-medium text-[#78716c] border border-[#e7e5e0] hover:border-[#c9772b] hover:text-[#c9772b] disabled:opacity-30 disabled:hover:border-[#e7e5e0] disabled:hover:text-[#78716c] disabled:cursor-not-allowed transition-all duration-200"
      >
        下一页
      </button>
    </div>
  );
}
