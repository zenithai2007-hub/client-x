/* Client X — discovery dataset.
   SAMPLE DEMO DATA: these are bundled sample companies/people used only to
   demonstrate the Discover flow locally. They are NOT real search results,
   NOT live data, and no platform was queried to produce them. */

export type DiscoveryKind = "person" | "company";

export interface DiscoveryCandidate {
  id: string;
  name: string;
  type: DiscoveryKind;
  platform: string;
  industry: string;
  location: string;
  jobTitle: string;
  companySize: string;
  budget: string;
  services: string[];
  keywords: string[];
  contactStatus: string;
}

export const DISCOVERY_PLATFORMS = [
  "LinkedIn",
  "X",
  "Facebook",
  "Instagram",
  "Threads",
  "WhatsApp",
  "Upwork",
  "Fiverr",
  "Reddit",
  "Discord",
  "Telegram",
  "Google Business",
  "Google Maps",
  "Indeed",
] as const;

export const DISCOVERY_GOALS = [
  "Find potential clients",
  "Find businesses",
  "Find freelance projects",
  "Find partnership opportunities",
  "Find leads",
] as const;

export const discoveryCandidates: DiscoveryCandidate[] = [
  { id: "dc-01", name: "Amelia Hart", type: "person", platform: "LinkedIn", industry: "Retail", location: "London", jobTitle: "Founder", companySize: "1-10", budget: "$500-$2k", services: ["website", "branding"], keywords: ["boutique", "ecommerce", "candles"], contactStatus: "Not contacted" },
  { id: "dc-02", name: "Hart & Co. Boutique", type: "company", platform: "Google Business", industry: "Retail", location: "London", jobTitle: "", companySize: "1-10", budget: "$500-$2k", services: ["website", "seo"], keywords: ["boutique", "shop", "local"], contactStatus: "Not contacted" },
  { id: "dc-03", name: "Marcus Webb", type: "person", platform: "LinkedIn", industry: "SaaS", location: "Berlin", jobTitle: "CEO", companySize: "11-50", budget: "$2k-$5k", services: ["ai agent", "automation"], keywords: ["saas", "startup", "support"], contactStatus: "Not contacted" },
  { id: "dc-04", name: "Northbeam Fitness", type: "company", platform: "Instagram", industry: "Fitness", location: "Manchester", jobTitle: "", companySize: "11-50", budget: "$500-$2k", services: ["website", "booking"], keywords: ["gym", "fitness", "classes"], contactStatus: "Contacted" },
  { id: "dc-05", name: "Priya Nair", type: "person", platform: "Upwork", industry: "Marketing", location: "Amsterdam", jobTitle: "Marketing Manager", companySize: "51-200", budget: "$2k-$5k", services: ["automation", "chatbot"], keywords: ["agency", "campaigns", "leads"], contactStatus: "Not contacted" },
  { id: "dc-06", name: "Diego Fuentes", type: "person", platform: "X", industry: "Food & Beverage", location: "Madrid", jobTitle: "Owner", companySize: "1-10", budget: "Under $500", services: ["website", "menu"], keywords: ["restaurant", "cafe", "delivery"], contactStatus: "Not contacted" },
  { id: "dc-07", name: "Olive Branch Catering", type: "company", platform: "Google Maps", industry: "Food & Beverage", location: "Paris", jobTitle: "", companySize: "11-50", budget: "$500-$2k", services: ["website", "booking"], keywords: ["catering", "events", "food"], contactStatus: "Not contacted" },
  { id: "dc-08", name: "Sofia Lindqvist", type: "person", platform: "LinkedIn", industry: "Real Estate", location: "Stockholm", jobTitle: "Broker", companySize: "11-50", budget: "$2k-$5k", services: ["ai agent", "crm"], keywords: ["property", "listings", "leads"], contactStatus: "Replied" },
  { id: "dc-09", name: "Brightpath Clinics", type: "company", platform: "Google Business", industry: "Healthcare", location: "Dublin", jobTitle: "", companySize: "51-200", budget: "$5k+", services: ["chatbot", "booking"], keywords: ["clinic", "appointments", "patients"], contactStatus: "Not contacted" },
  { id: "dc-10", name: "Tom Becker", type: "person", platform: "Reddit", industry: "SaaS", location: "Berlin", jobTitle: "Indie Hacker", companySize: "1-10", budget: "Under $500", services: ["website", "landing page"], keywords: ["saas", "mvp", "launch"], contactStatus: "Not contacted" },
  { id: "dc-11", name: "Lena Fischer", type: "person", platform: "Fiverr", industry: "Design", location: "Munich", jobTitle: "Art Director", companySize: "1-10", budget: "$500-$2k", services: ["branding", "logo"], keywords: ["design", "brand", "freelance"], contactStatus: "Not contacted" },
  { id: "dc-12", name: "Craftline Interiors", type: "company", platform: "Instagram", industry: "Home Services", location: "Vienna", jobTitle: "", companySize: "11-50", budget: "$2k-$5k", services: ["website", "portfolio"], keywords: ["interiors", "renovation", "design"], contactStatus: "Contacted" },
  { id: "dc-13", name: "Omar Haddad", type: "person", platform: "LinkedIn", industry: "E-commerce", location: "Dubai", jobTitle: "Store Owner", companySize: "11-50", budget: "$2k-$5k", services: ["ai agent", "support"], keywords: ["shopify", "store", "customers"], contactStatus: "Not contacted" },
  { id: "dc-14", name: "Greenleaf Dental", type: "company", platform: "Google Maps", industry: "Healthcare", location: "Toronto", jobTitle: "", companySize: "1-10", budget: "$500-$2k", services: ["website", "booking"], keywords: ["dental", "clinic", "appointments"], contactStatus: "Not contacted" },
  { id: "dc-15", name: "Hana Kim", type: "person", platform: "Threads", industry: "Fashion", location: "Seoul", jobTitle: "Creator", companySize: "1-10", budget: "Under $500", services: ["branding", "social"], keywords: ["fashion", "creator", "brand"], contactStatus: "Not contacted" },
  { id: "dc-16", name: "Victor Rossi", type: "person", platform: "LinkedIn", industry: "Legal", location: "Rome", jobTitle: "Partner", companySize: "11-50", budget: "$5k+", services: ["automation", "intake"], keywords: ["law", "firm", "clients"], contactStatus: "Not contacted" },
  { id: "dc-17", name: "Summit Auto Detailing", type: "company", platform: "Facebook", industry: "Automotive", location: "Houston", jobTitle: "", companySize: "1-10", budget: "$500-$2k", services: ["website", "booking"], keywords: ["cars", "detailing", "local"], contactStatus: "Not contacted" },
  { id: "dc-18", name: "Grace Mbeki", type: "person", platform: "Indeed", industry: "Education", location: "Cape Town", jobTitle: "Operations Lead", companySize: "51-200", budget: "$2k-$5k", services: ["chatbot", "support"], keywords: ["school", "students", "support"], contactStatus: "Not contacted" },
  { id: "dc-19", name: "Nomad Travel Co.", type: "company", platform: "Instagram", industry: "Travel", location: "Lisbon", jobTitle: "", companySize: "11-50", budget: "$2k-$5k", services: ["ai agent", "booking"], keywords: ["travel", "tours", "booking"], contactStatus: "Not contacted" },
  { id: "dc-20", name: "Jonas Weber", type: "person", platform: "Discord", industry: "Gaming", location: "Hamburg", jobTitle: "Community Manager", companySize: "11-50", budget: "$500-$2k", services: ["automation", "moderation"], keywords: ["gaming", "community", "discord"], contactStatus: "Not contacted" },
  { id: "dc-21", name: "Aisha Bello", type: "person", platform: "WhatsApp", industry: "Beauty", location: "Lagos", jobTitle: "Salon Owner", companySize: "1-10", budget: "Under $500", services: ["booking", "website"], keywords: ["salon", "beauty", "appointments"], contactStatus: "Contacted" },
  { id: "dc-22", name: "PixelForge Studio", type: "company", platform: "Upwork", industry: "Design", location: "Warsaw", jobTitle: "", companySize: "11-50", budget: "$5k+", services: ["website", "branding"], keywords: ["studio", "design", "agency"], contactStatus: "Not contacted" },
  { id: "dc-23", name: "Elena Petrova", type: "person", platform: "Telegram", industry: "Finance", location: "Sofia", jobTitle: "Consultant", companySize: "1-10", budget: "$2k-$5k", services: ["ai agent", "automation"], keywords: ["finance", "consulting", "clients"], contactStatus: "Not contacted" },
  { id: "dc-24", name: "Harbor Legal Group", type: "company", platform: "LinkedIn", industry: "Legal", location: "New York", jobTitle: "", companySize: "51-200", budget: "$5k+", services: ["automation", "intake"], keywords: ["law", "firm", "intake"], contactStatus: "Not contacted" },
];
