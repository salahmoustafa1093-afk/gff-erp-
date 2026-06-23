import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  setCurrentBranch,
  setBranchList,
  setBranchLoading,
  setBranchError,
  type Branch,
} from '@/app/slices/branchSlice';
import { apiService } from '@/app/api';
import { toast } from 'react-toastify';

export interface BranchCreateData {
  name: string;
  code: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  timezone?: string;
  currency?: string;
}

export interface BranchUpdateData extends Partial<BranchCreateData> {
  id: string;
  isActive?: boolean;
}

export function useBranch() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  const currentBranch = useAppSelector((state) => state.branch.currentBranch);
  const branchList = useAppSelector((state) => state.branch.branchList);
  const isLoading = useAppSelector((state) => state.branch.isLoading);

  // Fetch branches
  const { isLoading: isFetching } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      dispatch(setBranchLoading(true));
      try {
        const data = await apiService.get<Branch[]>('/branches');
        dispatch(setBranchList(data));
        dispatch(setBranchError(null));
        return data;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch branches';
        dispatch(setBranchError(message));
        throw error;
      } finally {
        dispatch(setBranchLoading(false));
      }
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Create branch
  const createBranch = useMutation({
    mutationFn: async (data: BranchCreateData) => {
      const response = await apiService.post<Branch>('/branches', data);
      return response;
    },
    onSuccess: (newBranch) => {
      dispatch(setBranchList([...branchList, newBranch]));
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success(`Branch "${newBranch.name}" created successfully`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create branch');
    },
  });

  // Update branch
  const updateBranch = useMutation({
    mutationFn: async (data: BranchUpdateData) => {
      const { id, ...updateData } = data;
      const response = await apiService.patch<Branch>(`/branches/${id}`, updateData);
      return response;
    },
    onSuccess: (updatedBranch) => {
      const updatedList = branchList.map((b) =>
        b.id === updatedBranch.id ? updatedBranch : b
      );
      dispatch(setBranchList(updatedList));
      if (currentBranch?.id === updatedBranch.id) {
        dispatch(setCurrentBranch(updatedBranch));
      }
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success(`Branch "${updatedBranch.name}" updated successfully`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update branch');
    },
  });

  // Delete branch
  const deleteBranch = useMutation({
    mutationFn: async (branchId: string) => {
      await apiService.delete(`/branches/${branchId}`);
      return branchId;
    },
    onSuccess: (branchId) => {
      const removedBranch = branchList.find((b) => b.id === branchId);
      const updatedList = branchList.filter((b) => b.id !== branchId);
      dispatch(setBranchList(updatedList));
      if (currentBranch?.id === branchId && updatedList.length > 0) {
        dispatch(setCurrentBranch(updatedList[0]));
      }
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success(`Branch "${removedBranch?.name}" deleted successfully`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete branch');
    },
  });

  // Switch branch
  const switchBranch = useCallback(
    (branchId: string) => {
      const branch = branchList.find((b) => b.id === branchId);
      if (branch) {
        dispatch(setCurrentBranch(branch));
        toast.success(`Switched to branch: ${branch.name}`);
        // Invalidate queries that depend on branch
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['sales'] });
        queryClient.invalidateQueries({ queryKey: ['inventory'] });
        queryClient.invalidateQueries({ queryKey: ['finance'] });
      }
    },
    [branchList, dispatch, queryClient]
  );

  // Refresh branches
  const refreshBranches = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['branches'] });
  }, [queryClient]);

  // Computed
  const activeBranches = useMemo(
    () => branchList.filter((b) => b.isActive),
    [branchList]
  );

  const mainBranch = useMemo(
    () => branchList.find((b) => b.isMain),
    [branchList]
  );

  const currentBranchName = useMemo(
    () => currentBranch?.name || 'Select Branch',
    [currentBranch]
  );

  const currentBranchCode = useMemo(
    () => currentBranch?.code || '',
    [currentBranch]
  );

  return {
    // State
    currentBranch,
    branchList,
    activeBranches,
    mainBranch,
    isLoading: isLoading || isFetching,
    error: useAppSelector((state) => state.branch.error),

    // Computed
    currentBranchName,
    currentBranchCode,
    hasMultipleBranches: branchList.length > 1,

    // Actions
    switchBranch,
    refreshBranches,
    setCurrentBranch: useCallback(
      (branch: Branch | null) => dispatch(setCurrentBranch(branch)),
      [dispatch]
    ),

    // Mutations
    createBranch: createBranch.mutateAsync,
    updateBranch: updateBranch.mutateAsync,
    deleteBranch: deleteBranch.mutateAsync,
    isCreating: createBranch.isPending,
    isUpdating: updateBranch.isPending,
    isDeleting: deleteBranch.isPending,
  };
}

export default useBranch;