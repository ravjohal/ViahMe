import { useQuery } from "@tanstack/react-query";

export interface SubTradition {
  id: string;
  value: string;
  label: string;
}

export interface MainTradition {
  id: string;
  value: string;
  label: string;
  description: string;
  subTraditions: SubTradition[];
}

export function useTraditionHierarchy() {
  return useQuery<MainTradition[]>({
    queryKey: ["/api/wedding-traditions/hierarchy"],
    staleTime: 1000 * 60 * 60,
  });
}

export function useMainTraditionByValue(value: string | undefined) {
  const { data: traditions } = useTraditionHierarchy();
  return traditions?.find((t) => t.value === value);
}

export function useSubTraditionsForMain(mainTradition: string | undefined) {
  const tradition = useMainTraditionByValue(mainTradition);
  return tradition?.subTraditions || [];
}

export function useAllSubTraditions() {
  const { data: traditions } = useTraditionHierarchy();
  if (!traditions) return [];

  const allSubs: { value: string; label: string }[] = [];
  traditions.forEach((main) => {
    if (main.value !== "mixed" && main.value !== "other") {
      main.subTraditions.forEach((sub) => {
        allSubs.push({
          value: sub.value,
          label: `${main.label} - ${sub.label}`,
        });
      });
    }
  });
  return allSubs;
}

export function useMainTraditionOptions() {
  const { data: traditions } = useTraditionHierarchy();
  if (!traditions) return [];

  return traditions.map((t) => ({
    value: t.value,
    label: t.label,
    description: t.description,
  }));
}
