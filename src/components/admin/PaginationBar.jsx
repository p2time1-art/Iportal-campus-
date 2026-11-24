import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

/**
 * Reusable server-side pagination footer for data tables.
 */
export default function PaginationBar({
  meta,
  page,
  perPage,
  onPageChange,
  onPerPageChange,
  loading = false,
  pageSizeOptions = [10, 25, 50, 100],
}) {
  const total = Number(meta?.total ?? 0);
  const currentPage = Number(meta?.current_page ?? page ?? 1);
  const lastPage = Math.max(1, Number(meta?.last_page ?? 1));
  const from = Number(meta?.from ?? (total > 0 ? (currentPage - 1) * perPage + 1 : 0));
  const to = Number(meta?.to ?? Math.min(total, currentPage * perPage));

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t border-slate-100 bg-slate-50/60 text-xs text-slate-600">
      <div className="flex items-center gap-3">
        <span>
          {total === 0 ? (
            'Showing 0 results'
          ) : (
            <>
              Showing <strong className="text-slate-900">{from.toLocaleString()}</strong>–
              <strong className="text-slate-900">{to.toLocaleString()}</strong> of{' '}
              <strong className="text-slate-900">{total.toLocaleString()}</strong>
            </>
          )}
        </span>

        {onPerPageChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Rows:</span>
            <Select
              value={String(perPage)}
              onValueChange={(v) => {
                onPerPageChange(Number(v));
                if (onPageChange) onPageChange(1);
              }}
              disabled={loading}
            >
              <SelectTrigger className="h-7 w-[72px] text-xs bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((opt) => (
                  <SelectItem key={opt} value={String(opt)}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <span className="mr-2 text-slate-500">
          Page <strong className="text-slate-900">{currentPage}</strong> of{' '}
          <strong className="text-slate-900">{lastPage}</strong>
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 w-7 p-0 bg-white"
          disabled={loading || currentPage <= 1}
          onClick={() => onPageChange(1)}
          title="First page"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 px-2 bg-white"
          disabled={loading || currentPage <= 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        >
          <ChevronLeft className="w-3.5 h-3.5 mr-0.5" /> Prev
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 px-2 bg-white"
          disabled={loading || currentPage >= lastPage}
          onClick={() => onPageChange(Math.min(lastPage, currentPage + 1))}
        >
          Next <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 w-7 p-0 bg-white"
          disabled={loading || currentPage >= lastPage}
          onClick={() => onPageChange(lastPage)}
          title="Last page"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
