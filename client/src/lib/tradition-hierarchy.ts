export interface SubTradition {
  value: string;
  label: string;
}

export interface MainTradition {
  value: string;
  label: string;
  description: string;
  subTraditions: SubTradition[];
}

export const TRADITION_HIERARCHY: MainTradition[] = [
  {
    value: "hindu",
    label: "Hindu",
    description: "Traditional Hindu wedding ceremonies",
    subTraditions: [
      { value: "punjabi_hindu", label: "North Indian (Punjabi, Delhi, UP)" },
      { value: "bengali_hindu", label: "East Indian (Bengali, Odia, Assamese)" },
      { value: "marathi", label: "West Indian (Marathi)" },
      { value: "rajasthani_marwari", label: "Rajasthani / Marwari" },
      { value: "kashmiri", label: "Kashmiri" },
      { value: "hindu_general", label: "General Hindu" },
    ],
  },
  {
    value: "south_indian",
    label: "South Indian",
    description: "South Indian wedding traditions",
    subTraditions: [
      { value: "telugu", label: "Telugu (Andhra / Telangana)" },
      { value: "tamil", label: "Tamil" },
      { value: "malayalee_hindu", label: "Malayalee (Kerala Hindu)" },
      { value: "kannadiga", label: "Kannadiga (Karnataka)" },
      { value: "south_indian_general", label: "General South Indian" },
    ],
  },
  {
    value: "muslim",
    label: "Muslim",
    description: "Islamic wedding traditions",
    subTraditions: [
      { value: "pakistani", label: "Pakistani / Urdu Speaking" },
      { value: "hyderabadi", label: "Hyderabadi" },
      { value: "ismaili", label: "Ismaili" },
      { value: "bohra", label: "Dawoodi Bohra" },
      { value: "bengali_muslim", label: "Bengali Muslim" },
      { value: "muslim_general", label: "General Muslim" },
    ],
  },
  {
    value: "sikh",
    label: "Sikh",
    description: "Anand Karaj ceremony at Gurdwara",
    subTraditions: [
      { value: "punjabi_sikh", label: "Traditional Punjabi Sikh" },
      { value: "non_punjabi_sikh", label: "Non-Punjabi Sikh" },
      { value: "sikh_general", label: "General Sikh" },
    ],
  },
  {
    value: "gujarati",
    label: "Gujarati",
    description: "Gujarati wedding customs with Garba",
    subTraditions: [
      { value: "gujarati_hindu", label: "Hindu Gujarati" },
      { value: "gujarati_jain", label: "Jain Gujarati" },
      { value: "kutchi", label: "Kutchi" },
    ],
  },
  {
    value: "christian",
    label: "Christian",
    description: "Indian Christian wedding traditions",
    subTraditions: [
      { value: "malayalee_christian", label: "Malayalee Christian (Syro-Malabar/Knanya)" },
      { value: "goan_catholic", label: "Goan / Mangalorean Catholic" },
      { value: "indian_christian_general", label: "General Indian Christian" },
    ],
  },
  {
    value: "jain",
    label: "Jain",
    description: "Jain wedding ceremonies",
    subTraditions: [
      { value: "shvetambara", label: "Shvetambara" },
      { value: "digambara", label: "Digambara" },
      { value: "jain_general", label: "General Jain" },
    ],
  },
  {
    value: "parsi",
    label: "Parsi",
    description: "Zoroastrian wedding traditions",
    subTraditions: [
      { value: "parsi_zoroastrian", label: "Parsi (Zoroastrian)" },
    ],
  },
  {
    value: "mixed",
    label: "Mixed / Fusion",
    description: "Blend of multiple cultural traditions",
    subTraditions: [], // Mixed allows multi-select from all traditions
  },
  {
    value: "other",
    label: "Other",
    description: "Custom or other tradition",
    subTraditions: [],
  },
];

export function getMainTraditionByValue(value: string): MainTradition | undefined {
  return TRADITION_HIERARCHY.find((t) => t.value === value);
}

export function getSubTraditionsForMain(mainTradition: string): SubTradition[] {
  const tradition = getMainTraditionByValue(mainTradition);
  return tradition?.subTraditions || [];
}

export function getAllSubTraditions(): SubTradition[] {
  const allSubs: SubTradition[] = [];
  TRADITION_HIERARCHY.forEach((main) => {
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

export function getMainTraditionOptions() {
  return TRADITION_HIERARCHY.map((t) => ({
    value: t.value,
    label: t.label,
    description: t.description,
  }));
}
