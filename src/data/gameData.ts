import { BusConfig, Driver, IndianRoute } from '../types/game';

export const INITIAL_BUSES: BusConfig[] = [
  {
    id: 'ksrtc_airavat',
    name: 'KSRTC Airavat Club Class',
    category: 'government',
    operator: 'Karnataka SRTC',
    state: 'Karnataka',
    price: 0, // default unlocked starter bus!
    unlocked: true,
    topSpeed: 120,
    acceleration: 85,
    braking: 88,
    handling: 86,
    fuelCapacity: 280,
    passengerCapacity: 45,
    primaryColor: '#334155', // metallic slate grey matching reference screenshot
    secondaryColor: '#B8860B', // royal gold stripe
    accentColor: '#0284C7', // sky blue trim
    liveryStyle: 'ksrtc',
    description: 'Iconic multi-axle luxury coach known across South Indian highways for unmatched highway cruising and plush air suspension.',
    features: ['Air Suspension', 'Multi-Axle Drive', 'Volvo D11C Engine', 'Executive Pushback Recliner Seats']
  },
  {
    id: 'tnstc_ultra',
    name: 'TNSTC Ultra Deluxe',
    category: 'government',
    operator: 'Tamil Nadu STC',
    state: 'Tamil Nadu',
    price: 15000,
    unlocked: false,
    topSpeed: 105,
    acceleration: 78,
    braking: 82,
    handling: 84,
    fuelCapacity: 240,
    passengerCapacity: 50,
    primaryColor: '#105B38', // rich forest green
    secondaryColor: '#FFFFFF', // crisp white
    accentColor: '#D97706', // gold trim
    liveryStyle: 'tnstc',
    description: 'High-speed workhorse of NH-44 and Tamil Nadu ghats. Revered for reliable non-stop express performance.',
    features: ['Ashok Leyland Chassis', 'Heavy Duty Leaf Springs', 'Pneumatic Power Brakes', 'Curtain Glazed Windows']
  },
  {
    id: 'msrtc_shivneri',
    name: 'MSRTC Shivneri Super AC',
    category: 'government',
    operator: 'Maharashtra SRTC',
    state: 'Maharashtra',
    price: 24000,
    unlocked: false,
    topSpeed: 125,
    acceleration: 90,
    braking: 92,
    handling: 88,
    fuelCapacity: 300,
    passengerCapacity: 43,
    primaryColor: '#4A154B', // regal purple
    secondaryColor: '#FFFFFF', // pearl white
    accentColor: '#F59E0B', // amber highlight
    liveryStyle: 'msrtc',
    description: 'The ruler of the Mumbai-Pune Expressway and Western Ghats. Top-tier luxury express transport.',
    features: ['Scania Metrolink Engine', 'Intarder Brake System', 'Dual-Zone Climate Control', 'Soundproof Cabin']
  },
  {
    id: 'private_sleeper',
    name: 'SRS Royal Rajputana Sleeper',
    category: 'private',
    operator: 'Private Luxury Fleet',
    state: 'National Intercity',
    price: 32000,
    unlocked: false,
    topSpeed: 130,
    acceleration: 92,
    braking: 85,
    handling: 82,
    fuelCapacity: 350,
    passengerCapacity: 36,
    primaryColor: '#DC2626', // crimson red
    secondaryColor: '#1F2937', // dark slate
    accentColor: '#FBBF24', // golden yellow roof
    liveryStyle: 'sleeper',
    description: 'High-deck 2+1 luxury sleeper coach with roof tarpaulin luggage rack, neon ambient lighting, and individual USB berths.',
    features: ['Upper & Lower Sleepers', 'Roof Luggage Grid', 'High-Output Turbocharger', 'Night LED Strip Glow']
  },
  {
    id: 'hrtc_snow_king',
    name: 'HRTC Himgaurav Snow King',
    category: 'government',
    operator: 'Himachal Roadways',
    state: 'Himachal Pradesh',
    price: 28000,
    unlocked: false,
    topSpeed: 95,
    acceleration: 88,
    braking: 96,
    handling: 95,
    fuelCapacity: 220,
    passengerCapacity: 38,
    primaryColor: '#0284C7', // mountain sky blue
    secondaryColor: '#E0F2FE', // snow white
    accentColor: '#B91C1C', // safety red guard
    liveryStyle: 'hrtc',
    description: 'Built specifically for steep hairpin ghats, Rohtang Pass snowstorms, and narrow Himalayan precipices.',
    features: ['4x4 Hill Traction', 'Anti-Skid Snow Chains', 'High-Torque Low-Gear Ratio', 'Reinforced Chassis']
  },
  {
    id: 'bmtc_vajra',
    name: 'BMTC Vajra Bangalore City',
    category: 'government',
    operator: 'Bangalore Metropolitan TC',
    state: 'Karnataka',
    price: 18000,
    unlocked: false,
    topSpeed: 100,
    acceleration: 80,
    braking: 90,
    handling: 90,
    fuelCapacity: 260,
    passengerCapacity: 52,
    primaryColor: '#B91C1C', // BMTC crimson red
    secondaryColor: '#FFFFFF', // white
    accentColor: '#1E293B', // dark grey bumper
    liveryStyle: 'bmtc',
    description: 'Bangalore city flagship low-floor Volvo AC coach. Excellent turn radius and urban maneuverability.',
    features: ['Low Floor Entry', 'Twin Wide Passenger Doors', 'Kneeling Suspension', 'Electronic Route Display']
  },
  {
    id: 'best_double_decker',
    name: 'BEST Mumbai Double Decker',
    category: 'special',
    operator: 'BEST Mumbai',
    state: 'Maharashtra',
    price: 45000,
    unlocked: false,
    topSpeed: 90,
    acceleration: 72,
    braking: 84,
    handling: 75,
    fuelCapacity: 320,
    passengerCapacity: 78,
    primaryColor: '#DC2626', // classic BEST red
    secondaryColor: '#FACC15', // yellow roof and stripes
    accentColor: '#18181B', // black wheel arches
    liveryStyle: 'best',
    description: 'The historic Mumbai heritage double-decker bus. Majestic dual levels with massive passenger capacity.',
    features: ['Double Deck Seating', 'Spiral Rear Staircase', 'Heritage Chrome Grille', 'Massive Capacity (78)']
  },
  {
    id: 'ev_smart_express',
    name: 'Bharat EV Smart City Coach',
    category: 'special',
    operator: 'Green India Transport',
    state: 'Pan-India',
    price: 55000,
    unlocked: false,
    topSpeed: 115,
    acceleration: 96,
    braking: 94,
    handling: 92,
    fuelCapacity: 380, // kWh equivalent
    passengerCapacity: 48,
    primaryColor: '#059669', // emerald green
    secondaryColor: '#E0E7FF', // electric blue
    accentColor: '#34D399', // bright mint
    liveryStyle: 'electric',
    description: '100% zero-emission electric powertrain with instant torque, regenerative braking, and silent smooth gliding.',
    features: ['Twin Electric Motors', 'Regenerative Braking', 'Zero Engine Noise', 'Ultra-Low Center of Mass']
  },
  {
    id: 'vintage_desi_starbus',
    name: 'Desi Tata Starbus (Horn OK Please)',
    category: 'special',
    operator: 'Rural State Express',
    state: 'Rajasthan & UP',
    price: 20000,
    unlocked: false,
    topSpeed: 95,
    acceleration: 75,
    braking: 80,
    handling: 80,
    fuelCapacity: 200,
    passengerCapacity: 55,
    primaryColor: '#EA580C', // vivid saffron orange
    secondaryColor: '#0284C7', // bright blue
    accentColor: '#EAB308', // yellow
    liveryStyle: 'vintage',
    description: 'The traditional colorful Indian road king with floral hand-painted body, "Horn OK Please" rear art, and hanging lemon-chilli amulet.',
    features: ['Custom Air Horns', 'Traditional Hand Art', 'Luggage Carrier with Ladder', 'Heavy Duty Bumper Guard']
  }
];

export const INITIAL_DRIVERS: Driver[] = [
  {
    id: 'raju_anna',
    name: 'Raju Anna',
    nativeState: 'Karnataka',
    experience: 22,
    rating: 4.8,
    price: 0, // starter driver
    unlocked: true,
    avatarColor: '#D97706',
    uniform: 'KSRTC Khaki Gold Epaulettes',
    specialAbility: 'Fuel Efficiency (+18% fuel conservation)',
    description: 'Legendary veteran driver of Bengaluru - Mangaluru ghats with calm composure and master gear shifting.'
  },
  {
    id: 'vikram_singh',
    name: 'Vikram Singh Rathore',
    nativeState: 'Rajasthan',
    experience: 18,
    rating: 4.9,
    price: 8000,
    unlocked: false,
    avatarColor: '#DC2626',
    uniform: 'Royal Safari Turban & Uniform',
    specialAbility: 'High Speed Stability (+15% top speed hold)',
    description: 'Master of desert crosswinds and long-haul overnight express corridors across Western India.'
  },
  {
    id: 'meera_nair',
    name: 'Meera Nair',
    nativeState: 'Kerala',
    experience: 12,
    rating: 4.9,
    price: 12000,
    unlocked: false,
    avatarColor: '#059669',
    uniform: 'Kerala KSRTC Green-Trim Uniform',
    specialAbility: 'Rain & Ghat Grip (+25% traction on wet hairpin bends)',
    description: 'Trained on the misty hairpin curves of Wayanad and Munnar. Unshakable safety record in monsoon downpours.'
  },
  {
    id: 'sukhwinder_sukhi',
    name: 'Sukhwinder "Sukhi" Paji',
    nativeState: 'Punjab',
    experience: 25,
    rating: 5.0,
    price: 18000,
    unlocked: false,
    avatarColor: '#2563EB',
    uniform: 'Blue Turban & Highway Vest',
    specialAbility: 'Passenger Comfort (+25% passenger satisfaction bonus)',
    description: 'GT Road champion with infectious warmth, smooth braking, and legendary roadside dhaba route knowledge.'
  },
  {
    id: 'ramesh_babu',
    name: 'Ramesh Babu',
    nativeState: 'Telangana & AP',
    experience: 15,
    rating: 4.7,
    price: 10000,
    unlocked: false,
    avatarColor: '#7C3AED',
    uniform: 'APSRTC Classic Blue',
    specialAbility: 'Fare Master (+30% bonus coins per trip)',
    description: 'Expert urban transit captain who keeps passenger queues moving fast and tickets flowing.'
  }
];

export const INDIAN_ROUTES: IndianRoute[] = [
  {
    id: 'route_bengaluru_mysuru',
    name: 'Bengaluru to Mysuru Expressway',
    region: 'South',
    originCity: 'Bengaluru',
    destinationCity: 'Mysuru',
    distanceKm: 145,
    terrain: 'highway',
    estimatedTimeMin: 8,
    tollCount: 2,
    defaultWeather: 'sunny',
    passengerDemand: 45,
    rewardCoins: 1250,
    scenicHighlights: ['10-Lane Access Controlled Highway', 'Channapatna Toy Town', 'Ramanagara Hill Boulders', 'Srirangapatna River Bridges']
  },
  {
    id: 'route_mumbai_pune',
    name: 'Mumbai - Pune Yashwantrao Chavan Expressway',
    region: 'West',
    originCity: 'Mumbai',
    destinationCity: 'Pune',
    distanceKm: 94,
    terrain: 'ghat',
    estimatedTimeMin: 7,
    tollCount: 2,
    defaultWeather: 'rainy',
    passengerDemand: 48,
    rewardCoins: 1500,
    scenicHighlights: ['Khandala Ghat Hairpins', 'Bhatan Mountain Tunnel', 'Lonavala Mist Valleys', 'Amrutanjan Point']
  },
  {
    id: 'route_delhi_manali',
    name: 'Delhi - Chandigarh - Manali Himalayan Highway',
    region: 'North',
    originCity: 'Delhi',
    destinationCity: 'Manali',
    distanceKm: 530,
    terrain: 'snow_mountain',
    estimatedTimeMin: 10,
    tollCount: 3,
    defaultWeather: 'snow',
    passengerDemand: 40,
    rewardCoins: 2400,
    scenicHighlights: ['Snow-Covered Pine Forests', 'Beas River Rapids', 'Kullu Apple Orchards', 'Rohtang Mountain Pass Vista']
  },
  {
    id: 'route_jaipur_udaipur',
    name: 'Jaipur to Udaipur Royal Desert Corridor',
    region: 'West',
    originCity: 'Jaipur',
    destinationCity: 'Udaipur',
    distanceKm: 395,
    terrain: 'desert',
    estimatedTimeMin: 8,
    tollCount: 3,
    defaultWeather: 'desert',
    passengerDemand: 42,
    rewardCoins: 1650,
    scenicHighlights: ['Aravalli Mountain Ridges', 'Ajmer Dargah Bypass', 'Golden Sand Dunes', 'Roadside Camel Herds']
  },
  {
    id: 'route_kochi_munnar',
    name: 'Kochi to Munnar Tea Garden Ghat Road',
    region: 'South',
    originCity: 'Kochi',
    destinationCity: 'Munnar',
    distanceKm: 130,
    terrain: 'ghat',
    estimatedTimeMin: 8,
    tollCount: 1,
    defaultWeather: 'heavy_rain',
    passengerDemand: 44,
    rewardCoins: 1800,
    scenicHighlights: ['Cheeyappara & Valara Waterfalls', 'Terraced Tea Plantations', 'Misty Pine Bends', 'Spice Country Groves']
  },
  {
    id: 'route_kolkata_digha',
    name: 'Kolkata to Digha Coastal Expressway',
    region: 'East',
    originCity: 'Kolkata',
    destinationCity: 'Digha Sea Beach',
    distanceKm: 185,
    terrain: 'coastal',
    estimatedTimeMin: 7,
    tollCount: 2,
    defaultWeather: 'rainy',
    passengerDemand: 50,
    rewardCoins: 1400,
    scenicHighlights: ['Hooghly River Bridges', 'Kolaghat Thermal Skyline', 'Coastal Coconut Groves', 'Casuarina Forest Coast']
  },
  {
    id: 'route_guwahati_shillong',
    name: 'Guwahati to Shillong (Scotland of the East)',
    region: 'Northeast',
    originCity: 'Guwahati',
    destinationCity: 'Shillong',
    distanceKm: 100,
    terrain: 'ghat',
    estimatedTimeMin: 7,
    tollCount: 1,
    defaultWeather: 'foggy',
    passengerDemand: 38,
    rewardCoins: 1750,
    scenicHighlights: ['Umiam Lake Viewpoint', 'Khasi Hills Cloud Banks', 'Barapani Dam Vista', 'Dense Rhododendron Hills']
  },
  {
    id: 'route_bhopal_indore',
    name: 'Bhopal to Indore Heart of India Corridor',
    region: 'Central',
    originCity: 'Bhopal',
    destinationCity: 'Indore',
    distanceKm: 195,
    terrain: 'village',
    estimatedTimeMin: 7,
    tollCount: 2,
    defaultWeather: 'sunny',
    passengerDemand: 46,
    rewardCoins: 1350,
    scenicHighlights: ['Malwa Plateau Farmlands', 'Dewas Chamunda Hill', 'Traditional Village Bazaars', 'Tractor & Ox Pastures']
  }
];

export const DAILY_BONUSES = [
  { day: 1, coins: 100, label: 'Day 1: 100 Coins' },
  { day: 2, coins: 200, label: 'Day 2: 200 Coins' },
  { day: 3, coins: 300, label: 'Day 3: 300 Coins' },
  { day: 4, coins: 500, label: 'Day 4: 500 Coins' },
  { day: 5, coins: 700, label: 'Day 5: 700 Coins' },
  { day: 6, coins: 1000, label: 'Day 6: 1000 Coins' },
  { day: 7, coins: 2500, label: 'Day 7: Mega 2500 Coins + Golden Horn!' }
];
