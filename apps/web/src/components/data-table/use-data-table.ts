import { useState, useMemo, useCallback } from "react";
import {
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  RowSelectionState,
  GroupingState,
  ExpandedState,
  PaginationState,
} from "@tanstack/react-table";

export interface UseDataTableOptions {
  /** Initial page size */
  initialPageSize?: number;
  /** Initial sorting */
  initialSorting?: SortingState;
  /** Initial grouping */
  initialGrouping?: GroupingState;
  /** Persist state to localStorage */
  persistKey?: string;
  /** Enable server-side pagination */
  serverSide?: boolean;
  /** Total row count for server-side pagination */
  rowCount?: number;
}

export interface DataTableState {
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  columnVisibility: VisibilityState;
  rowSelection: RowSelectionState;
  grouping: GroupingState;
  expanded: ExpandedState;
  pagination: PaginationState;
  globalFilter: string;
}

export interface UseDataTableReturn extends DataTableState {
  // Setters
  setSorting: (sorting: SortingState) => void;
  setColumnFilters: (filters: ColumnFiltersState) => void;
  setColumnVisibility: (visibility: VisibilityState) => void;
  setRowSelection: (selection: RowSelectionState) => void;
  setGrouping: (grouping: GroupingState) => void;
  setExpanded: (expanded: ExpandedState) => void;
  setPagination: (pagination: PaginationState) => void;
  setGlobalFilter: (filter: string) => void;
  // Actions
  reset: () => void;
  resetSorting: () => void;
  resetFilters: () => void;
  resetSelection: () => void;
  toggleColumnVisibility: (columnId: string) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  // Computed
  pageCount: number;
  currentPage: number;
  pageSize: number;
  hasSelection: boolean;
  selectedCount: number;
}

const DEFAULT_STATE: DataTableState = {
  sorting: [],
  columnFilters: [],
  columnVisibility: {},
  rowSelection: {},
  grouping: [],
  expanded: {},
  pagination: { pageIndex: 0, pageSize: 20 },
  globalFilter: "",
};

export function useDataTable(options: UseDataTableOptions = {}): UseDataTableReturn {
  const {
    initialPageSize = 20,
    initialSorting = [],
    initialGrouping = [],
    persistKey,
    serverSide = false,
    rowCount = 0,
  } = options;

  // Load persisted state
  const loadPersistedState = useCallback((): Partial<DataTableState> | null => {
    if (!persistKey || typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem(`dataTable_${persistKey}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore parsing errors
    }
    return null;
  }, [persistKey]);

  const persistedState = loadPersistedState();

  // State
  const [sorting, setSorting] = useState<SortingState>(
    persistedState?.sorting ?? initialSorting
  );
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    persistedState?.columnFilters ?? []
  );
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    persistedState?.columnVisibility ?? {}
  );
  const [rowSelection, setRowSelection] = useState<RowSelectionState>(
    persistedState?.rowSelection ?? {}
  );
  const [grouping, setGrouping] = useState<GroupingState>(
    persistedState?.grouping ?? initialGrouping
  );
  const [expanded, setExpanded] = useState<ExpandedState>(
    persistedState?.expanded ?? {}
  );
  const [pagination, setPagination] = useState<PaginationState>(
    persistedState?.pagination ?? { pageIndex: 0, pageSize: initialPageSize }
  );
  const [globalFilter, setGlobalFilter] = useState(
    persistedState?.globalFilter ?? ""
  );

  // Persist state changes
  const persistState = useCallback(
    (state: Partial<DataTableState>) => {
      if (!persistKey || typeof window === "undefined") return;
      try {
        const currentState: DataTableState = {
          sorting,
          columnFilters,
          columnVisibility,
          rowSelection,
          grouping,
          expanded,
          pagination,
          globalFilter,
          ...state,
        };
        localStorage.setItem(`dataTable_${persistKey}`, JSON.stringify(currentState));
      } catch {
        // Ignore storage errors
      }
    },
    [
      persistKey,
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      grouping,
      expanded,
      pagination,
      globalFilter,
    ]
  );

  // Wrapped setters that persist
  const handleSetSorting = useCallback(
    (newSorting: SortingState) => {
      setSorting(newSorting);
      persistState({ sorting: newSorting });
    },
    [persistState]
  );

  const handleSetColumnFilters = useCallback(
    (filters: ColumnFiltersState) => {
      setColumnFilters(filters);
      persistState({ columnFilters: filters });
    },
    [persistState]
  );

  const handleSetColumnVisibility = useCallback(
    (visibility: VisibilityState) => {
      setColumnVisibility(visibility);
      persistState({ columnVisibility: visibility });
    },
    [persistState]
  );

  const handleSetRowSelection = useCallback(
    (selection: RowSelectionState) => {
      setRowSelection(selection);
      persistState({ rowSelection: selection });
    },
    [persistState]
  );

  const handleSetGrouping = useCallback(
    (newGrouping: GroupingState) => {
      setGrouping(newGrouping);
      persistState({ grouping: newGrouping });
    },
    [persistState]
  );

  const handleSetExpanded = useCallback(
    (newExpanded: ExpandedState) => {
      setExpanded(newExpanded);
      persistState({ expanded: newExpanded });
    },
    [persistState]
  );

  const handleSetPagination = useCallback(
    (newPagination: PaginationState) => {
      setPagination(newPagination);
      persistState({ pagination: newPagination });
    },
    [persistState]
  );

  const handleSetGlobalFilter = useCallback(
    (filter: string) => {
      setGlobalFilter(filter);
      persistState({ globalFilter: filter });
    },
    [persistState]
  );

  // Actions
  const reset = useCallback(() => {
    handleSetSorting([]);
    handleSetColumnFilters([]);
    handleSetColumnVisibility({});
    handleSetRowSelection({});
    handleSetGrouping([]);
    handleSetExpanded({});
    handleSetPagination({ pageIndex: 0, pageSize: initialPageSize });
    handleSetGlobalFilter("");
  }, [
    handleSetSorting,
    handleSetColumnFilters,
    handleSetColumnVisibility,
    handleSetRowSelection,
    handleSetGrouping,
    handleSetExpanded,
    handleSetPagination,
    handleSetGlobalFilter,
    initialPageSize,
  ]);

  const resetSorting = useCallback(() => handleSetSorting([]), [handleSetSorting]);
  const resetFilters = useCallback(() => handleSetColumnFilters([]), [handleSetColumnFilters]);
  const resetSelection = useCallback(() => handleSetRowSelection({}), [handleSetRowSelection]);

  const toggleColumnVisibility = useCallback(
    (columnId: string) => {
      const newVisibility = {
        ...columnVisibility,
        [columnId]: !columnVisibility[columnId],
      };
      handleSetColumnVisibility(newVisibility);
    },
    [columnVisibility, handleSetColumnVisibility]
  );

  const setPage = useCallback(
    (page: number) => {
      handleSetPagination({ ...pagination, pageIndex: page });
    },
    [pagination, handleSetPagination]
  );

  const setPageSize = useCallback(
    (size: number) => {
      handleSetPagination({ pageIndex: 0, pageSize: size });
    },
    [handleSetPagination]
  );

  const nextPage = useCallback(() => {
    handleSetPagination({ ...pagination, pageIndex: pagination.pageIndex + 1 });
  }, [pagination, handleSetPagination]);

  const previousPage = useCallback(() => {
    handleSetPagination({
      ...pagination,
      pageIndex: Math.max(0, pagination.pageIndex - 1),
    });
  }, [pagination, handleSetPagination]);

  // Computed values
  const pageCount = useMemo(() => {
    if (serverSide && rowCount) {
      return Math.ceil(rowCount / pagination.pageSize);
    }
    return 1; // For client-side, table handles this
  }, [serverSide, rowCount, pagination.pageSize]);

  const hasSelection = Object.keys(rowSelection).length > 0;
  const selectedCount = Object.keys(rowSelection).length;

  return {
    // State
    sorting,
    columnFilters,
    columnVisibility,
    rowSelection,
    grouping,
    expanded,
    pagination,
    globalFilter,
    // Setters
    setSorting: handleSetSorting,
    setColumnFilters: handleSetColumnFilters,
    setColumnVisibility: handleSetColumnVisibility,
    setRowSelection: handleSetRowSelection,
    setGrouping: handleSetGrouping,
    setExpanded: handleSetExpanded,
    setPagination: handleSetPagination,
    setGlobalFilter: handleSetGlobalFilter,
    // Actions
    reset,
    resetSorting,
    resetFilters,
    resetSelection,
    toggleColumnVisibility,
    setPage,
    setPageSize,
    nextPage,
    previousPage,
    // Computed
    pageCount,
    currentPage: pagination.pageIndex,
    pageSize: pagination.pageSize,
    hasSelection,
    selectedCount,
  };
}
