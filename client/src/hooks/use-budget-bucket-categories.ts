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
  
  // Memoize Maps to avoid recreating on every render
  const { categoryById, categoryBySlug, uuidToSlug, slugToUuid } = useMemo(() => {
    const byId = new Map<string, BudgetBucketCategory>();
    const bySlug = new Map<string, BudgetBucketCategory>();
    const toSlug = new Map<string, string>();
    const toUuid = new Map<string, string>();
    
    categories.forEach(cat => {
      byId.set(cat.id, cat);
      bySlug.set(cat.slug, cat);
      toSlug.set(cat.id, cat.slug);
      toUuid.set(cat.slug, cat.id);
    });
    
    return { categoryById: byId, categoryBySlug: bySlug, uuidToSlug: toSlug, slugToUuid: toUuid };
  }, [categories]);
  
  const getCategoryLabel = useCallback((id: string): string => {
    return categoryById.get(id)?.displayName || categoryBySlug.get(id)?.displayName || id;
  }, [categoryById, categoryBySlug]);
  
  const getCategoryIcon = useCallback((id: string): string | null => {
    return categoryById.get(id)?.iconName || categoryBySlug.get(id)?.iconName || null;
  }, [categoryById, categoryBySlug]);
  
  const getSlugFromUuid = useCallback((uuid: string): string => {
    return uuidToSlug.get(uuid) || uuid;
  }, [uuidToSlug]);
  
  const allCategoryIds = useMemo(() => categories.map(cat => cat.id), [categories]);
  
  return {
    categories,
    categoryById,
    categoryBySlug,
    uuidToSlug,
    slugToUuid,
    getCategoryLabel,
    getCategoryIcon,
    getSlugFromUuid,
    allCategoryIds,
  };
}

// Backward compatibility alias
export const useBudgetCategoryLookup = useBudgetBucketCategoryLookup;
