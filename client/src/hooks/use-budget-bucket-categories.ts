import { useQuery } from "@tanstack/react-query";
import { useMemo, useCallback } from "react";

export interface BudgetBucketCategory {
  id: string;
  slug: string;
  displayName: string;
  description: string | null;
  iconName: string | null;
  isEssential: boolean | null;
  suggestedPercentage: number | null;
  displayOrder: number | null;
  isActive: boolean | null;
  isSystemCategory: boolean | null;
}

// Backward compatibility alias
export type BudgetCategory = BudgetBucketCategory;

export function useBudgetBucketCategories() {
  return useQuery<BudgetBucketCategory[]>({
    queryKey: ["/api/budget/categories"],
    staleTime: 5 * 60 * 1000,
  });
}

// Backward compatibility alias
export const useBudgetCategories = useBudgetBucketCategories;

export function useBudgetBucketCategoryLookup() {
  const { data: categories = [] } = useBudgetBucketCategories();
  
  // Memoize Map to avoid recreating on every render - UUID-only lookup
  const categoryById = useMemo(() => {
    const byId = new Map<string, BudgetBucketCategory>();
    categories.forEach(cat => byId.set(cat.id, cat));
    return byId;
  }, [categories]);
  
  const getCategoryLabel = useCallback((id: string): string => {
    return categoryById.get(id)?.displayName || id;
  }, [categoryById]);
  
  const getCategoryIcon = useCallback((id: string): string | null => {
    return categoryById.get(id)?.iconName || null;
  }, [categoryById]);
  
  const allCategoryIds = useMemo(() => categories.map(cat => cat.id), [categories]);
  
  return {
    categories,
    categoryById,
    getCategoryLabel,
    getCategoryIcon,
    allCategoryIds,
  };
}

// Backward compatibility alias
export const useBudgetCategoryLookup = useBudgetBucketCategoryLookup;
