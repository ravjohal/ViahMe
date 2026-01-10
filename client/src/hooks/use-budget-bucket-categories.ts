import { useQuery } from "@tanstack/react-query";

export interface BudgetBucketCategory {
  id: string;
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
  
  const categoryById = new Map<string, BudgetBucketCategory>();
  categories.forEach(cat => categoryById.set(cat.id, cat));
  
  const getCategoryLabel = (id: string): string => {
    return categoryById.get(id)?.displayName || id;
  };
  
  const getCategoryIcon = (id: string): string | null => {
    return categoryById.get(id)?.iconName || null;
  };
  
  const allCategoryIds = categories.map(cat => cat.id);
  
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
