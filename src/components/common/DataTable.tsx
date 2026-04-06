import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Search, Plus, Download, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { exportToExcel, ExportOptions } from "@/lib/exportToExcel";

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  idKey: keyof T;
  searchPlaceholder?: string;
  onAdd?: () => void;
  addButtonText?: string;
  onRowClick?: (item: T) => void;
  searchKeys?: string[];
  itemsPerPage?: number;
  exportFilename?: string;
  rowClassName?: (item: T) => string;
  toolbarExtra?: React.ReactNode;
  exportOptions?: ExportOptions<T>;
  exportColumns?: { key: string; header: string; render?: (item: T) => string }[];
  /** When provided, search is delegated to the server via this callback (debounced). */
  onServerSearch?: (query: string) => void;
  /** Show a loading spinner in the search box during server search. */
  isSearching?: boolean;
}

const DEBOUNCE_MS = 300;

export function DataTable<T extends object>({
  data,
  columns,
  searchPlaceholder = "Search...",
  onAdd,
  addButtonText = "Add",
  onRowClick,
  searchKeys = [],
  itemsPerPage = 20,
  idKey,
  exportFilename,
  rowClassName,
  toolbarExtra,
  exportOptions,
  exportColumns: exportColumnsProp,
  onServerSearch,
  isSearching = false,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      setCurrentPage(1);
      if (onServerSearch) {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          onServerSearch(value.trim());
        }, DEBOUNCE_MS);
      }
    },
    [onServerSearch],
  );

  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  const getItemKey = (item: T, index: number): string => {
    const val = item[idKey];
    return val !== undefined && val !== null ? String(val) : String(index);
  };

  const filteredData = useMemo(() => {
    if (onServerSearch) return data;
    if (!searchQuery.trim()) return data;

    const query = searchQuery.toLowerCase();
    return data.filter((item) =>
      searchKeys.some((key) => {
        const value = item[key];
        if (typeof value === "string") {
          return value.toLowerCase().includes(query);
        }
        if (typeof value === "number") {
          return value.toString().includes(query);
        }
        if (Array.isArray(value)) {
          return value.some((v) => String(v).toLowerCase().includes(query));
        }
        return false;
      })
    );
  }, [data, searchQuery, searchKeys, onServerSearch]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleExport = () => {
    if (exportColumnsProp) {
      const exportData = filteredData.map((item) => {
        const row: Record<string, unknown> = {};
        exportColumnsProp.forEach((col) => {
          row[col.key] = col.render ? col.render(item) : (item[col.key as keyof T] ?? "");
        });
        return row;
      });
      const cols = exportColumnsProp.map((col) => ({ key: col.key, header: col.header }));
      exportToExcel(exportData, cols, exportFilename || "export", exportOptions as ExportOptions<Record<string, unknown>>);
    } else {
      const exportCols = columns
        .filter((col) => col.key !== "actions")
        .map((col) => ({ key: String(col.key), header: col.header }));
      exportToExcel(filteredData, exportCols, exportFilename || "export", exportOptions);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {onAdd && (
          <Button onClick={onAdd}>
            <Plus className="mr-2 h-4 w-4" />
            {addButtonText}
          </Button>
        )}
        <Button variant="outline" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export Excel
        </Button>
        <div className="relative w-52">
          {isSearching ? (
            <Loader2 className="absolute left-2.5 top-1/2 h-[13px] w-[13px] -translate-y-1/2 animate-spin text-muted-foreground" />
          ) : (
            <Search className="absolute left-2.5 top-1/2 h-[13px] w-[13px] -translate-y-1/2 text-muted-foreground" />
          )}
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="h-9 bg-background pl-8 text-xs"
          />
        </div>
        {toolbarExtra && <div className="ml-auto">{toolbarExtra}</div>}
      </div>

      <div className="overflow-hidden rounded-none border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={String(column.key)}>{column.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No results found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item, index) => (
                <TableRow
                  key={getItemKey(item, index)}
                  onClick={() => onRowClick?.(item)}
                  className={`${onRowClick ? "cursor-pointer" : ""} ${rowClassName?.(item) || ""}`}
                >
                  {columns.map((column) => (
                    <TableCell key={String(column.key)}>
                      {column.render
                        ? column.render(item)
                        : String(item[column.key as keyof T] ?? "")}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(currentPage - 1)}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    onClick={() => handlePageChange(pageNum)}
                    isActive={currentPage === pageNum}
                    className="cursor-pointer"
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              );
            })}

            <PaginationItem>
              <PaginationNext
                onClick={() => handlePageChange(currentPage + 1)}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
