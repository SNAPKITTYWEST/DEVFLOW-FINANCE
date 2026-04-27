import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface OptimisticMutationOptions<TData, TError> {
  successMessage?: string;
  errorMessage?: string;
}

export function useOptimisticMutation<TData = any, TError = any>(
  apiCall: (variables: any) => Promise<TData>,
  rollbackFn: () => void,
  options: OptimisticMutationOptions<TData, TError> = {}
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<TError | null>(null);

  const mutate = useCallback(async (variables: any, optimisticUpdateFn: () => void) => {
    // Step 1: Optimistic local update
    optimisticUpdateFn();
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiCall(variables);
      if (options.successMessage) {
        toast.success(options.successMessage);
      }
      return result;
    } catch (err: any) {
      // Step 2: Rollback on failure
      rollbackFn();
      setError(err);
      toast.error(options.errorMessage || err.message || 'Update failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [apiCall, rollbackFn, options]);

  return { mutate, isLoading, error };
}
