export const BUSINESS_NAME = "GARAGE NYUMBANI";
export const PHONE_NUMBER = "+255700000000";
export const WHATSAPP_NUMBER = "255700000000";
export const BUSINESS_LOCATION = "MPENDAE, ZANZIBAR";
export const FACEBOOK_URL = "https://facebook.com/garagenyumbani";
export const INSTAGRAM_URL = "https://instagram.com/garagenyumbani";
export const GOOGLE_MAPS_EMBED_URL = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3986.4!2d39.2083!3d-6.1659!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sMpendae%2C+Zanzibar!5e0!3m2!1sen!2stz!4v1";

export const MECHANICS: string[] = [
  "Juma Bakari",
  "Said Hamad",
  "Ali Khamis",
  "Mwinyi Hassan",
  "Suleiman Rashid",
];

export interface ServiceItem {
  id: string;
  titleSw: string;
  titleEn: string;
  descriptionSw: string;
  descriptionEn: string;
  icon: string;
  price: number;
  imageUrl: string;
  fallbackBg: string;
}

export const SERVICES: ServiceItem[] = [
  {
    id: 'scheduled-maintenance',
    titleSw: 'SERVICE YA KAWAIDA (PERIODIC)',
    titleEn: 'SCHEDULED PERIODIC MAINTENANCE',
    descriptionSw: 'Huduma muhimu ya kila baada ya kilomita 3,000. Inajumuisha kubadilisha oil (engine oil), filter ya oil, kusafisha filter ya hewa, na ukaguzi wa pointi 25. Tunakagua maji ya radiator, hali ya betri, brake fluid, na presha ya matairi ili kuzuia uharibifu mkubwa wa engine na kuongeza maisha ya gari lako.',
    descriptionEn: 'Essential maintenance every 5,000km. Includes premium engine oil change, oil filter replacement, air filter cleaning, and a comprehensive 25-point health check. We inspect radiator coolant, battery health, brake fluid levels, and tire pressure to prevent major engine failures and extend your vehicle\'s lifespan.',
    icon: '📅',
    price: 45000,
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=640&auto=format&fit=crop',
    fallbackBg: 'linear-gradient(135deg, #1a1a2e, #16213e)',
  },
  {
    id: 'engine-performance',
    titleSw: 'UTENDAJI NA MATENGENEZO YA ENGINE',
    titleEn: 'ENGINE PERFORMANCE & OVERHAUL',
    descriptionSw: 'Uchunguzi wa kina na matengenezo ya engine ili kurejesha nguvu na ufanisi wa mafuta. Inajumuisha kusafisha injector, kubadilisha spark plugs, kusafisha throttle body, na kurekebisha milio ya valve. Huduma hii huondoa "hesitation" wakati wa kuongeza mwendo na kupunguza matumizi makubwa ya mafuta.',
    descriptionEn: 'Deep engine diagnostics and repairs to restore power and fuel efficiency. Includes fuel injector sonic cleaning, spark plug replacement, throttle body servicing, and valve adjustments. This service eliminates acceleration hesitation, stabilizes rough idling, and significantly improves fuel economy.',
    icon: '⚙️',
    price: 150000,
    imageUrl: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=640&auto=format&fit=crop',
    fallbackBg: 'linear-gradient(135deg, #2d1b69, #11998e)',
  },
  {
    id: 'engine-noise-diagnosis',
    titleSw: 'UCHUNGUZI WA MILIO NA KNOCKING',
    titleEn: 'ENGINE NOISE & KNOCKING DIAGNOSIS',
    descriptionSw: 'Ukaguzi wa kitaalamu wa milio isiyo ya kawaida kama "knocking", "clicking", au "grinding". Tunatumia stethoskopu ya kimekanika na vifaa vya kisasa kutambua kama tatizo ni piston pins, bearings, au timing chain. Utambuzi wa mapema huokoa gharama kubwa za kubadilisha engine nzima.',
    descriptionEn: 'Professional investigation of unusual engine sounds like knocking, clicking, or grinding. We use mechanical stethoscopes and advanced diagnostic tools to identify issues with piston pins, rod bearings, or timing chains. Early detection prevents catastrophic engine failure and saves you from the cost of a full engine replacement.',
    icon: '🔊',
    price: 35000,
    imageUrl: 'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=640&auto=format&fit=crop',
    fallbackBg: 'linear-gradient(135deg, #1e3c72, #2a5298)',
  },
  {
    id: 'tire-recovery',
    titleSw: 'HUDUMA YA MATAIRI NA PANJA',
    titleEn: 'TIRE MAINTENANCE & RECOVERY',
    descriptionSw: 'Huduma ya dharura ya matairi popote ulipo. Inajumuisha kuziba panja kwa kutumia "plug" au "patch", kubadilisha tairi la akiba (spare), na ukaguzi wa hali ya "tread". Tunahakikisha matairi yako yana usalama wa kutosha kwa safari ndefu na kuzuia kupasuka kwa tairi barabarani.',
    descriptionEn: 'Emergency roadside tire assistance. Includes professional puncture repairs (plug or patch), spare tire installation, and tread depth safety inspections. We ensure your tires are in optimal condition for safe travel, preventing dangerous blowouts and improving vehicle handling.',
    icon: '🛞',
    price: 25000,
    imageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=640&auto=format&fit=crop',
    fallbackBg: 'linear-gradient(135deg, #232526, #414345)',
  },
  {
    id: 'brake-systems',
    titleSw: 'MIFUMO YA BREKI NA USALAMA',
    titleEn: 'BRAKE & SAFETY SYSTEMS',
    descriptionSw: 'Matengenezo kamili ya mfumo wa breki kwa usalama wako. Inajumuisha kuweka brake pads mpya, kusafisha na "resurfacing" ya diski, ukaguzi wa ABS, na kubadilisha brake fluid. Breki imara hupunguza umbali wa kusimama na kuzuia ajali, hasa wakati wa mvua au dharura.',
    descriptionEn: 'Complete brake system maintenance for maximum safety. Includes brake pad replacement, rotor resurfacing, ABS sensor diagnostics, and hydraulic fluid flushing. Reliable brakes significantly reduce stopping distances and prevent accidents, especially during emergencies or wet road conditions.',
    icon: '🛑',
    price: 55000,
    imageUrl: 'https://images.unsplash.com/photo-1558618047-3c8c76b9c2f3?w=640&auto=format&fit=crop',
    fallbackBg: 'linear-gradient(135deg, #c0392b, #96281b)',
  },
  {
    id: 'suspension-steering',
    titleSw: 'URARI NA MIFUMO YA SHOCK UPS',
    titleEn: 'SUSPENSION & STEERING TUNING',
    descriptionSw: 'Kurekebisha milio ya chini ya gari na kuboresha "comfort". Inajumuisha kubadilisha shock absorbers, bush za suspension, ball joints, na rack ends. Huduma hii huimarisha urari wa usukani, kuzuia tairi kuliwa upande mmoja, na kufanya gari liwe tulivu kwenye mashimo.',
    descriptionEn: 'Eliminating undercarriage noises and restoring ride comfort. Includes replacement of worn shock absorbers, suspension bushings, ball joints, and steering rack ends. This service improves steering stability, prevents uneven tire wear, and ensures a smooth, controlled ride over rough terrain.',
    icon: '🎢',
    price: 75000,
    imageUrl: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=640&auto=format&fit=crop',
    fallbackBg: 'linear-gradient(135deg, #134e5e, #71b280)',
  },
  {
    id: 'climate-control',
    titleSw: 'HUDUMA YA AC NA MIFUMO YA BARIDI',
    titleEn: 'CLIMATE CONTROL & AC SERVICE',
    descriptionSw: 'Kuhakikisha hewa safi na baridi ndani ya gari lako. Inajumuisha kujaza gesi ya AC (R134a), kutafuta uvujaji (leak detection), kusafisha condenser, na kubadilisha cabin filter. Pia tunakagua mfumo wa kupoza engine (radiator & fans) ili kuzuia gari kuchemsha (overheating).',
    descriptionEn: 'Ensuring fresh, cold air inside your cabin. Includes AC gas recharging (R134a), vacuum leak detection, condenser cleaning, and cabin air filter replacement. We also inspect the engine cooling system (radiator and fans) to prevent overheating during hot weather or heavy traffic.',
    icon: '❄️',
    price: 85000,
    imageUrl: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=640&auto=format&fit=crop',
    fallbackBg: 'linear-gradient(135deg, #0f2027, #203a43)',
  },
  {
    id: 'electrical-diagnostics',
    titleSw: 'UCHUNGUZI WA MIFUMO YA UMEME',
    titleEn: 'ELECTRICAL & COMPUTER DIAGNOSTICS',
    descriptionSw: 'Uchunguzi wa kisasa kwa kutumia "OBD2 Scanner" kutambua matatizo ya "Check Engine". Inajumuisha kurekebisha matatizo ya wiring, alternator, starter motor, na mifumo ya taa. Tunatambua hitilafu za kielektroniki zinazoweza kusababisha gari kushindwa kuwaka au kuzima ghafla.',
    descriptionEn: 'Advanced computer scanning using OBD2 tools to decode "Check Engine" lights. Includes expert repairs for wiring faults, alternator testing, starter motor servicing, and lighting systems. We pinpoint electronic glitches that cause starting issues or sudden engine stalls.',
    icon: '⚡',
    price: 45000,
    imageUrl: 'https://images.unsplash.com/photo-1526726538690-5cbf956ae2fd?w=640&auto=format&fit=crop',
    fallbackBg: 'linear-gradient(135deg, #f7971e, #8b4513)',
  },
  {
    id: 'other-specialist',
    titleSw: 'HUDUMA NYINGINE ZA KITAALAMU',
    titleEn: 'OTHER SPECIALIST SERVICES',
    descriptionSw: 'Je, gari lako lina tatizo la kipekee? Kuanzia matatizo ya gearbox, uvujaji wa oil, hadi ushauri wa kununua gari. Waeleze mafundi wetu bingwa wakusaidie kwa matatizo yoyote magumu ya kiufundi yanayohitaji utaalamu wa hali ya juu.',
    descriptionEn: 'Does your vehicle have a unique issue? From transmission (gearbox) repairs and oil leak fixes to pre-purchase inspections. Tell our master technicians about any complex mechanical or electronic problems that require specialized expertise.',
    icon: '✨',
    price: 0,
    imageUrl: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=640&auto=format&fit=crop',
    fallbackBg: 'linear-gradient(135deg, #2c3e50, #3498db)',
  }
];

export const FAQ_ITEMS = [
  {
    id: 1,
    qSw: "UNATOA HUDUMA MAENEO GANI?",
    aSw: "TUNATOA HUDUMA ZETU ZANZIBAR NZIMA, HASA MAENEO YA MJINI NA VIUNGU VYAKE. KWA MAENEO YA MBALI ZAIDI, TUNAWEZA KUTOZA GHARAMA NDOGO YA USAFIRI.",
    qEn: "WHICH AREAS DO YOU SERVE?",
    aEn: "WE PROVIDE SERVICES ACROSS ALL OF ZANZIBAR, PRIMARILY IN URBAN AREAS AND SURROUNDINGS. FOR DISTANT LOCATIONS, A SMALL TRANSPORT FEE MAY APPLY."
  },
  {
    id: 2,
    qSw: "MALIPO YANAFANYIKAJE?",
    aSw: "MALIPO YANAFANYIKA BAADA YA HUDUMA KUKAMILIKA. TUNAKUBALI TASLIMU (CASH) AU KWA NJIA YA MITANDAO YA SIMU (M-PESA, TIGO PESA, EZY PESA).",
    qEn: "HOW DO I MAKE PAYMENTS?",
    aEn: "PAYMENTS ARE MADE AFTER THE SERVICE IS COMPLETED. WE ACCEPT CASH OR MOBILE MONEY TRANSFERS (M-PESA, TIGO PESA, EZY PESA)."
  },
  {
    id: 3,
    qSw: "INACHUKUA MUDA GANI FUNDI KUFIKA?",
    aSw: "KWA HUDUMA ZA DHARURA, TUNALENGA KUFIKA NDANI YA DAKIKA 30 HADI 60 KUTEGEMEA NA HALI YA FOLENI NA ENEO ULIPO.",
    qEn: "HOW LONG DOES IT TAKE FOR A MECHANIC TO ARRIVE?",
    aEn: "FOR EMERGENCIES, WE AIM TO ARRIVE WITHIN 30 TO 60 MINUTES DEPENDING ON TRAFFIC AND YOUR EXACT LOCATION."
  },
  {
    id: 4,
    qSw: "JE, KUNA DHAMANA (WARRANTY) YA KAZI?",
    aSw: "NDIO! KAZI ZETU ZOTE ZINA DHAMANA. IKIWA TATIZO LITAREJEA NDANI YA MUDA MFANO WA WIKI MBILI BAADA YA MATENGENEZO, TUNALIREKEBISHA BILA MALIPO YA ZIADA.",
    qEn: "IS THERE A WARRANTY ON THE WORK?",
    aEn: "YES! ALL OUR WORK COMES WITH A WARRANTY. IF THE SAME PROBLEM PERSISTS WITHIN TWO WEEKS AFTER REPAIR, WE FIX IT AT NO EXTRA COST."
  }
];
