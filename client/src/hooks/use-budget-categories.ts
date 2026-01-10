import { useQuery } from "@tanstack/react-query";

export interface BudgetCategory {
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

export function useBudgetCategories() {
  return useQuery<BudgetCategory[]>({
    queryKey: ["/api/budget/categories"],
    staleTime: 5 * 60 * 1000,
  });
}

export function useBudgetCategoryLookup() {
  const { data: categories = [] } = useBudgetCategories();
  
  const categoryById = new Map<string, BudgetCategory>();
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
