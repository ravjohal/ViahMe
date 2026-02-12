export const METRO_CITY_MAP: Record<string, string[]> = {
  "San Francisco Bay Area": ["San Jose", "San Francisco", "Oakland", "Fremont", "Sunnyvale", "Mountain View", "Palo Alto", "Santa Clara", "Hayward", "Milpitas", "Dublin", "Livermore", "San Ramon", "Campbell", "Tracy", "Lathrop", "Newark", "Union City", "Cupertino", "Redwood City", "San Mateo", "Daly City", "South San Francisco", "Pleasanton", "Walnut Creek", "Concord", "Antioch", "San Leandro", "Vallejo", "Berkeley", "Richmond", "El Sobrante", "Manteca", "Stockton", "Modesto", "Northern California"],
  "Sacramento": ["Sacramento", "Roseville", "Elk Grove", "Folsom", "Rancho Cordova", "Davis", "Woodland", "Yuba City", "Marysville", "Citrus Heights", "Rocklin", "Lincoln"],
  "Fresno": ["Fresno", "Clovis", "Selma", "Visalia", "Hanford", "Madera", "Central Valley", "Lodi", "Merced", "Turlock"],
  "Los Angeles": ["Los Angeles", "Anaheim", "Buena Park", "Artesia", "Fullerton", "Riverside", "North Hollywood", "Pacoima", "Jurupa Valley", "Walnut", "Cerritos", "Downey", "Long Beach", "Pasadena", "Glendale", "Burbank", "Torrance", "Irvine", "Santa Ana", "Ontario", "Pomona", "Corona", "Moreno Valley", "Fontana", "Rancho Cucamonga", "San Bernardino", "Orange County", "Southern California"],
  "Vancouver": ["Vancouver", "Surrey", "Burnaby", "Langley", "Abbotsford", "Delta", "New Westminster", "Coquitlam", "Port Coquitlam", "Port Moody", "Maple Ridge", "Mission", "North Vancouver", "West Vancouver", "White Rock", "Chilliwack", "Kelowna", "Kamloops", "Vernon", "Pemberton", "Newton", "Lower Mainland"],
  "Toronto": ["Toronto", "Brampton", "Mississauga", "Hamilton", "Markham", "Vaughan", "Oakville", "Burlington", "Milton", "Ajax", "Pickering", "Whitby", "Oshawa", "Scarborough", "Etobicoke", "North York"],
  "New York City": ["New York", "Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island", "Jersey City", "Edison", "Perth Amboy", "Hoboken", "Newark", "Morrisville", "Long Island", "Woodside", "Jackson Heights", "Floral Park"],
  "Chicago": ["Chicago", "Schaumburg", "Naperville", "Aurora", "Elgin", "Joliet", "Bolingbrook"],
  "Seattle": ["Seattle", "Bellevue", "Redmond", "Kirkland", "Renton", "Kent", "Tacoma", "Everett", "Bothell", "Woodinville"],
  "Dallas": ["Dallas", "Fort Worth", "Plano", "Irving", "Frisco", "Arlington", "Garland", "Richardson", "McKinney", "Carrollton"],
  "Houston": ["Houston", "Sugar Land", "Katy", "The Woodlands", "Pearland", "League City", "Missouri City", "Stafford"],
  "Boston": ["Boston", "Cambridge", "Somerville", "Brookline", "Framingham", "Waltham", "Quincy"],
  "Washington DC": ["Washington DC", "Arlington", "Alexandria", "Fairfax", "Reston", "Bethesda", "Silver Spring", "Rockville", "McLean"],
  "Atlanta": ["Atlanta", "Decatur", "Marietta", "Roswell", "Alpharetta", "Johns Creek", "Lawrenceville", "Norcross"],
  "Philadelphia": ["Philadelphia", "Cherry Hill", "King of Prussia", "Plymouth Meeting", "Conshohocken"],
  "Detroit": ["Detroit", "Dearborn", "Troy", "Novi", "Farmington Hills", "Canton", "Ann Arbor"],
  "Phoenix": ["Phoenix", "Scottsdale", "Tempe", "Mesa", "Chandler", "Gilbert"],
  "Miami": ["Miami", "Fort Lauderdale", "Hollywood", "Coral Gables", "Hialeah"],
};

export function detectMetroFromLocation(location: string): string | null {
  if (!location) return null;
  const loc = location.toLowerCase();
  for (const [metroName, cities] of Object.entries(METRO_CITY_MAP)) {
    for (const city of cities) {
      if (loc.includes(city.toLowerCase())) return metroName;
    }
  }
  if (loc.includes(", bc") || loc.includes("british columbia")) return "Vancouver";
  if (loc.includes(", on") || loc.includes("ontario")) return "Toronto";
  return null;
}

export function extractCityFromLocation(location: string): string | null {
  if (!location) return null;
  const match = location.match(/^([^,]+)/);
  if (match) {
    const city = match[1].trim();
    if (/^\d/.test(city)) {
      const parts = location.split(",");
      if (parts.length >= 2) return parts[parts.length - 2].trim().replace(/\s+\w{2,3}\s+\w{3}\s+\w{3}$/, '').trim();
    }
    return city;
  }
  return null;
}
