"use client";

import React, { useMemo, useCallback, useState, useRef } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  flexRender,
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  RowSelectionState,
  ExpandedState,
  GroupingState,
  Header,
  HeaderGroup,
  Row,
  Cell,
  AccessorKeyColumnDef,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  GripVertical,
  Settings2,
  Columns,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  MoreHorizontal,
  Check,
  X,
} from "lucide-react";
import { clsx } from "clsx";

// Types
export type DataTableColumnDef<TData, TValue = unknown> = ColumnDef<TData, TValue> & {
  enablePinning?: boolean;
  enableGrouping?: boolean;
  enableResizing?: boolean;
  pin?: "left" | "right";
  size?: number;
  minSize?: number;
  maxSize?: number;
};

export interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, any>[];
  /** Enable virtual scrolling for large datasets */
  enableVirtualization?: boolean;
  /** Estimated row height for virtualization */
  estimateRowHeight?: number;
  /** Enable row selection */
  enableRowSelection?: boolean;
  /** Enable multi-row selection */
  enableMultiRowSelection?: boolean;
  /** Enable column pinning */
  enableColumnPinning?: boolean;
  /** Enable column resizing */
  enableColumnResizing?: boolean;
  /** Enable grouping */
  enableGrouping?: boolean;
  /** Enable sorting */
  enableSorting?: boolean;
  /** Enable filtering */
  enableFiltering?: boolean;
  /** Initial sorting state */
  initialSorting?: SortingState;
  /** Initial grouping state */
  initialGrouping?: GroupingState;
  /** Fixed height for the table container */
  height?: number | string;
  /** Fixed width for the table container */
  width?: number | string;
  /** Callback when row is clicked */
  onRowClick?: (row: TData) => void;
  /** Callback when rows are selected */
  onSelectionChange?: (selectedRows: TData[]) => void;
  /** Render expanded row content */
  renderExpandedRow?: (row: TData) => React.ReactNode;
  /** Custom row ID accessor */
  getRowId?: (row: TData) => string;
  /** Loading state */
  isLoading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Custom class name */
  className?: string;
  /** Sticky header */
  stickyHeader?: boolean;
  /** Show column visibility toggle */
  showColumnToggle?: boolean;
  /** Show settings panel */
  showSettings?: boolean;
}

// Default column widths
const DEFAULT_COLUMN_SIZE = 150;
const DEFAULT_MIN_COLUMN_SIZE = 50;
const DEFAULT_MAX_COLUMN_SIZE = 500;

export function DataTable<TData>({
  data,
  columns,
  enableVirtualization = true,
  estimateRowHeight = 48,
  enableRowSelection = false,
  enableMultiRowSelection = true,
  enableColumnPinning = true,
  enableColumnResizing = true,
  enableGrouping = false,
  enableSorting = true,
  enableFiltering = false,
  initialSorting = [],
  initialGrouping = [],
  height = 600,
  width = "100%",
  onRowClick,
  onSelectionChange,
  renderExpandedRow,
  getRowId,
  isLoading = false,
  emptyMessage = "No data available",
  className,
  stickyHeader = true,
  showColumnToggle = true,
  showSettings = true,
}: DataTableProps<TData>) {
  // State
  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [grouping, setGrouping] = useState<GroupingState>(initialGrouping);
  const [expanded, setExpanded] = useState<ExpandedState>(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  // Table instance
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      grouping,
      expanded,
      globalFilter,
    },
    enableRowSelection,
    enableMultiRowSelection,
    enableColumnPinning,
    enableColumnResizing,
    enableGrouping,
    enableSorting,
    enableFilters: enableFiltering,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGroupingChange: setGrouping,
    onExpandedChange: setExpanded,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowId,
    columnResizeMode: "onChange",
    defaultColumn: {
      size: DEFAULT_COLUMN_SIZE,
      minSize: DEFAULT_MIN_COLUMN_SIZE,
      maxSize: DEFAULT_MAX_COLUMN_SIZE,
    },
  });

  // Virtualization
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const { rows } = table.getRowModel();
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => estimateRowHeight,
    overscan: 10,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  // Notify parent of selection changes
  React.useEffect(() => {
    if (onSelectionChange) {
      const selectedRows = table.getSelectedRowModel().rows.map((row) => row.original);
      onSelectionChange(selectedRows);
    }
  }, [rowSelection, onSelectionChange, table]);

  // Get pinned columns
  const leftPinnedColumns = table.getLeftHeaderGroups();
  const centerColumns = table.getCenterHeaderGroups();
  const rightPinnedColumns = table.getRightHeaderGroups();

  // Calculate total width for proper scrolling
  const totalWidth = useMemo(() => {
    return table.getTotalSize();
  }, [table]);

  // Render header cell
  const renderHeaderCell = (header: Header<TData, unknown>) => {
    const canSort = header.column.getCanSort();
    const canResize = header.column.getCanResize();
    const isPinned = header.column.getIsPinned();
    const sortDirection = header.column.getIsSorted();

    return (
      <th
        key={header.id}
        className={clsx(
          "relative px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider",
          "border-b border-r border-white/10 dark:border-white/5",
          "bg-muted/50 backdrop-blur-sm",
          stickyHeader && "sticky top-0 z-20",
          canResize && "resize-x",
          isPinned === "left" && "sticky left-0 z-30 bg-muted/80",
          isPinned === "right" && "sticky right-0 z-30 bg-muted/80"
        )}
        style={{
          width: header.getSize(),
          left: isPinned === "left" ? header.getStart() : undefined,
          right: isPinned === "right" ? header.getStart("right") : undefined,
        }}
        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
      >
        <div className="flex items-center gap-2">
          {header.isPlaceholder ? null : (
            <>
              {flexRender(header.column.columnDef.header, header.getContext())}
              {canSort && (
                <span className="ml-auto">
                  {sortDirection === "asc" ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : sortDirection === "desc" ? (
                    <ArrowDown className="h-3 w-3" />
                  ) : (
                    <ArrowUpDown className="h-3 w-3 opacity-40" />
                  )}
                </span>
              )}
            </>
          )}
        </div>
        {canResize && (
          <div
            className={clsx(
              "absolute right-0 top-0 h-full w-1 bg-transparent cursor-col-resize",
              "hover:bg-primary/50 touch-none select-none"
            )}
            onMouseDown={header.getResizeHandler()}
            onTouchStart={header.getResizeHandler()}
          />
        )}
      </th>
    );
  };

  // Render row
  const renderRow = (row: Row<TData>, virtualRow?: { index: number; start: number }) => {
    const isGrouped = row.getIsGrouped();
    const isExpanded = row.getIsExpanded();
    const isSelected = row.getIsSelected();
    const canExpand = row.getCanExpand();

    return (
      <React.Fragment key={row.id}>
        <tr
          className={clsx(
            "border-b border-white/5 transition-colors",
            "hover:bg-white/5 dark:hover:bg-white/5",
            isSelected && "bg-primary/5",
            onRowClick && "cursor-pointer"
          )}
          style={{
            height: estimateRowHeight,
            transform: virtualRow
              ? `translateY(${virtualRow.start - (virtualRow.index * estimateRowHeight)}px)`
              : undefined,
          }}
          onClick={() => onRowClick?.(row.original)}
        >
          {row.getVisibleCells().map((cell) => {
            const isPinned = cell.column.getIsPinned();
            const isGroupedCell = cell.getIsGrouped();

            return (
              <td
                key={cell.id}
                className={clsx(
                  "px-4 py-3 text-sm",
                  "border-r border-white/5 last:border-r-0",
                  isPinned === "left" && "sticky left-0 bg-background/95 backdrop-blur-sm z-10",
                  isPinned === "right" && "sticky right-0 bg-background/95 backdrop-blur-sm z-10"
                )}
                style={{
                  width: cell.column.getSize(),
                  left: isPinned === "left" ? cell.column.getStart() : undefined,
                  right: isPinned === "right" ? cell.column.getStart("right") : undefined,
                }}
              >
                {isGroupedCell ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        row.toggleExpanded();
                      }}
                      className="p-1 hover:bg-muted rounded"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    <span className="font-medium">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      ({row.subRows?.length || 0})
                    </span>
                  </div>
                ) : cell.getIsAggregated() ? (
                  flexRender(
                    cell.column.columnDef.aggregatedCell ?? cell.column.columnDef.cell,
                    cell.getContext()
                  )
                ) : cell.getIsPlaceholder() ? null : (
                  flexRender(cell.column.columnDef.cell, cell.getContext())
                )}
              </td>
            );
          })}
        </tr>
        {/* Expanded row content */}
        {isExpanded && renderExpandedRow && (
          <tr>
            <td
              colSpan={row.getVisibleCells().length}
              className="px-4 py-4 bg-muted/20 border-b border-white/5"
            >
              {renderExpandedRow(row.original)}
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  };

  return (
    <div className={clsx("flex flex-col space-y-4", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          {/* Global Filter */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-white/20 dark:border-white/10 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus:ring-2 focus:ring-primary/50 text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Column Toggle */}
          {showColumnToggle && (
            <div className="relative">
              <button
                onClick={() => setShowColumnMenu(!showColumnMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/20 dark:border-white/10 bg-white/50 dark:bg-slate-800/50 hover:bg-white/70 dark:hover:bg-slate-800/70 text-sm"
              >
                <Columns className="h-4 w-4" />
                Columns
              </button>
              {showColumnMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-white/20 dark:border-white/10 bg-background/95 backdrop-blur-sm shadow-xl z-50">
                  <div className="p-2">
                    {table.getAllLeafColumns().map((column) => (
                      <label
                        key={column.id}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/50 cursor-pointer text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={column.getIsVisible()}
                          onChange={column.getToggleVisibilityHandler()}
                          className="rounded"
                        />
                        {column.columnDef.header?.toString() || column.id}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Selection info */}
          {enableRowSelection && Object.keys(rowSelection).length > 0 && (
            <span className="text-sm text-muted-foreground">
              {Object.keys(rowSelection).length} selected
            </span>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div
        ref={tableContainerRef}
        className={clsx(
          "relative rounded-xl border border-white/20 dark:border-white/10",
          "bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm",
          "overflow-auto"
        )}
        style={{ height, width }}
      >
        {isLoading ? (
          // Loading skeleton
          <div className="space-y-2 p-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted/50 rounded-lg shimmer" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Filter className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium">{emptyMessage}</p>
            {globalFilter && (
              <button
                onClick={() => setGlobalFilter("")}
                className="mt-2 text-sm text-primary hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <table
            className="w-full border-collapse"
            style={{ width: totalWidth, minWidth: "100%" }}
          >
            {/* Header */}
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {/* Selection column */}
                  {enableRowSelection && (
                    <th className="w-12 px-4 py-3 border-b border-r border-white/10 bg-muted/50">
                      <input
                        type="checkbox"
                        checked={table.getIsAllRowsSelected()}
                        onChange={table.getToggleAllRowsSelectedHandler()}
                        className="rounded"
                      />
                    </th>
                  )}
                  {headerGroup.headers.map(renderHeaderCell)}
                </tr>
              ))}
            </thead>

            {/* Body */}
            <tbody>
              {enableVirtualization
                ? virtualRows.map((virtualRow) => {
                    const row = rows[virtualRow.index];
                    return renderRow(row, virtualRow);
                  })
                : rows.map((row) => renderRow(row))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer / Pagination Info */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {enableVirtualization
            ? `${rows.length.toLocaleString()} rows`
            : `Showing ${table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to ${Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                rows.length
              )} of ${rows.length.toLocaleString()}`}
        </span>
        <div className="flex items-center gap-2">
          <span>Page {table.getState().pagination.pageIndex + 1}</span>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-2 py-1 rounded hover:bg-muted disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-2 py-1 rounded hover:bg-muted disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default DataTable;
