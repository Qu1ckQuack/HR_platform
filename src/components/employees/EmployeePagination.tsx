export type EmployeePaginationProps = {
  page: number;
  totalPages: number;
  totalEmployees: number;
  isLoading: boolean;
  onPageChange: (newPage: number) => void;
};

export function EmployeePagination({
  page,
  totalPages,
  totalEmployees,
  isLoading,
  onPageChange,
}: EmployeePaginationProps) {
  return (
    <footer className="flex justify-between p-3 text-xs text-slate-500">
      <span>
        แสดง {totalEmployees === 0 ? 0 : (page - 1) * 10 + 1}–
        {Math.min(page * 10, totalEmployees)} จาก {totalEmployees}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="หน้าก่อนหน้า"
          disabled={page === 1 || isLoading}
          onClick={() => onPageChange(page - 1)}
          className="rounded px-2 py-1 text-base hover:cursor-pointer enabled:hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ‹
        </button>
        <b className="rounded bg-[#102d59] px-3 py-2 text-white">
          {page}
        </b>
        <button
          type="button"
          aria-label="หน้าถัดไป"
          disabled={page >= totalPages || isLoading}
          onClick={() => onPageChange(page + 1)}
          className="rounded px-2 py-1 text-base hover:cursor-pointer enabled:hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ›
        </button>
      </div>
    </footer>
  );
}
