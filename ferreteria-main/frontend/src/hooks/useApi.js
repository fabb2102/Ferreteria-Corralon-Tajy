import { useState, useEffect, useCallback } from 'react';
import { ApiError } from '../services/api';

/**
 * Custom hook for handling API calls with loading, error, and success states
 * @param {Function} apiFunction - The API service function to call
 * @param {Object} options - Configuration options
 * @returns {Object} - State and methods for API interaction
 */
export const useApi = (apiFunction, options = {}) => {
  const {
    immediate = false,
    onSuccess,
    onError,
    initialData = null,
  } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasExecuted, setHasExecuted] = useState(false);

  const execute = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiFunction(...args);
      setData(result);
      setHasExecuted(true);
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      const error = err instanceof ApiError ? err : new Error(err.message);
      setError(error);
      
      if (onError) {
        onError(error);
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  }, [apiFunction, onSuccess, onError]);

  const reset = useCallback(() => {
    setData(initialData);
    setError(null);
    setLoading(false);
    setHasExecuted(false);
  }, [initialData]);

  const refetch = useCallback(() => {
    if (hasExecuted) {
      return execute();
    }
  }, [execute, hasExecuted]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return {
    data,
    loading,
    error,
    execute,
    reset,
    refetch,
    hasExecuted,
  };
};

/**
 * Custom hook for handling paginated API calls
 * @param {Function} apiFunction - The API service function to call
 * @param {Object} options - Configuration options
 * @returns {Object} - State and methods for paginated API interaction
 */
export const usePaginatedApi = (apiFunction, options = {}) => {
  const {
    initialPage = 1,
    initialPageSize = 10,
    immediate = false,
    ...apiOptions
  } = options;

  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [filters, setFilters] = useState({});

  const {
    data: response,
    loading,
    error,
    execute,
    reset: apiReset,
    refetch,
  } = useApi(apiFunction, {
    ...apiOptions,
    immediate: false,
  });

  const data = response?.data || [];
  const total = response?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  const executeWithParams = useCallback(() => {
    const params = {
      page,
      pageSize,
      ...filters,
    };
    return execute(params);
  }, [execute, page, pageSize, filters]);

  const goToPage = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  }, [totalPages]);

  const changePageSize = useCallback((newPageSize) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when changing page size
  }, []);

  const updateFilters = useCallback((newFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filtering
  }, []);

  const reset = useCallback(() => {
    setPage(initialPage);
    setPageSize(initialPageSize);
    setFilters({});
    apiReset();
  }, [initialPage, initialPageSize, apiReset]);

  useEffect(() => {
    executeWithParams();
  }, [executeWithParams]);

  useEffect(() => {
    if (immediate) {
      executeWithParams();
    }
  }, [executeWithParams, immediate]);

  return {
    data,
    loading,
    error,
    page,
    pageSize,
    total,
    totalPages,
    filters,
    execute: executeWithParams,
    goToPage,
    changePageSize,
    updateFilters,
    reset,
    refetch,
  };
};