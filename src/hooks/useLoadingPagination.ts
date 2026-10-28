'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';

export function useLoadingPagination<T>(items: T[], initialPageSize: number = 4) {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(initialPageSize);
  const [isPageLoading, setIsPageLoading] = useState<boolean>(false);

  // When total items or filter change, reset to page 1
  useEffect(() => {
    setCurrentPage(1);
  }, [items.length]);

  const totalRecords = items.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRecords);

  const paginatedItems = useMemo(() => {
    return items.slice(startIndex, endIndex);
  }, [items, startIndex, endIndex]);

  const changePage = useCallback((page: number) => {
    if (page < 1 || page > totalPages) return;
    setIsPageLoading(true);
    setCurrentPage(page);
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 180);
    return () => clearTimeout(timer);
  }, [totalPages]);

  const changePageSize = useCallback((newSize: number) => {
    setIsPageLoading(true);
    setPageSize(newSize);
    setCurrentPage(1);
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 180);
    return () => clearTimeout(timer);
  }, []);

  const resetPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return {
    currentPage: safePage,
    pageSize,
    totalPages,
    totalRecords,
    startIndex,
    endIndex,
    paginatedItems,
    isPageLoading,
    changePage,
    changePageSize,
    resetPage,
  };
}
