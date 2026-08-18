import type { WeddingConfig, Guest, StoryMilestone, ScheduleEvent, Accommodation, FAQ, RegistryItem, BridalPartyMember, GuestWish } from '../types/wedding';

export const initialConfig: WeddingConfig = {
  brideName: 'Abigail Rose Vance',
  brideShortName: 'Abby',
  groomName: 'Cameron Liam Nel',
  groomShortName: 'Cameron',
  weddingDate: '2027-06-19T15:30:00',
  tagline: 'Under the Outeniqua Mountains, two souls begin forever.',
  hashtag: '#CamAndAbbyWedding',
  quote: 'Whatever our souls are made of, his and mine are the same.',
  quoteAuthor: 'Emily Brontë',
  ceremonyVenue: {
    name: 'The ArendsRus Country Chapel',
    address: 'Koesterbos Road, Geelhoutboom',
    city: 'George, 6537, Western Cape, South Africa',
    time: '3:30 PM SAST',
    mapUrl: 'https://maps.google.com/?q=ArendsRus+Country+Lodge+George+South+Africa',
    description: 'An open-air rustic timber chapel framed by majestic Outeniqua Mountain views, blooming rose gardens, and indigenous fynbos valleys.'
  },
  receptionVenue: {
    name: 'The ArendsRus Barn Yard & Rose Gardens',
    address: 'Koesterbos Road, Geelhoutboom',
    city: 'George, 6537, Western Cape, South Africa',
    time: '5:00 PM – Late',
    mapUrl: 'https://maps.google.com/?q=ArendsRus+Country+Lodge+George+South+Africa',
    description: 'High wooden barn trusses, cascading crystal chandeliers, fairy-light canopies, and fine wine under the Garden Route stars.'
  },
  dressCode: {
    title: 'Formal Garden Elegance / South African Romance',
    description: 'We kindly invite our guests to celebrate in formal garden attire. Floor-length gowns, chic cocktail dresses, and tailored suits. Soft blush pink, rosewood, champagne gold, sage fynbos green, and navy are encouraged. Note: Evening mountain breezes can be cool, so a light wrap is recommended.',
    palette: ['#FCE7EE', '#F9D5E5', '#E3D5CA', '#D5E2D5', '#D4AF37', '#2C3E50']
  },
  adminPin: '1234',
  mealOptions: [
    {
      id: 'beef-lamb',
      name: 'Karoo Lamb Cutlet & Prime Beef Fillet',
      description: 'Flame-seared Karoo lamb cutlet and prime beef tenderloin with rosemary red wine jus, truffle potato dauphinoise, and charred baby vegetables.',
      icon: '🥩',
      tags: ['Chef Signature', 'Gluten-Free']
    },
    {
      id: 'fish',
      name: 'Pan-Seared Garden Route Kingklip',
      description: 'Fresh coastal kingklip fillet served with lemon-saffron velouté, crushed herbed new potatoes, and roasted tenderstem broccoli.',
      icon: '🐟',
      tags: ['Pescatarian', 'Gluten-Free']
    },
    {
      id: 'vegetarian',
      name: 'Wild Mushroom & Fynbos Truffle Risotto',
      description: 'Creamy arborio risotto infused with foraged forest mushrooms, white truffle oil, shaved mature parmesan, and crispy mountain sage.',
      icon: '🍄',
      tags: ['Vegetarian', 'Gluten-Free Available']
    },
    {
      id: 'vegan',
      name: 'Roasted Butternut & Walnut Wellington',
      description: 'Flaky golden pastry filled with caramelized butternut, garden spinach, toasted walnuts, and a rich cranberry Pinotage reduction.',
      icon: '🌱',
      tags: ['Vegan', 'Dairy-Free']
    }
  ]
};

export const initialGuests: Guest[] = [
  {
    id: 'g-1',
    name: 'Eleanor Vance',
    email: 'eleanor.v@example.com',
    phone: '+27 (82) 234-5678',
    inviteCode: 'CA-VIP01',
    rsvpStatus: 'attending',
    partySize: 2,
    attendingCount: 2,
    dietaryRestrictions: ['Vegetarian'],
    dietaryDetails: 'No meat, dairy is fine',
    mealSelection: 'Wild Mushroom & Fynbos Truffle Risotto',
    songRequest: 'Can\'t Help Falling in Love - Elvis Presley',
    message: 'Cannot wait to see my sweet sister walk down the aisle at ArendsRus! So deeply happy for Cam and Abby 💕',
    tableNumber: 'Table 1 (Family VIP)',
    isPlusOneAllowed: true,
    companionNames: ['Marcus Vance'],
    respondedAt: '2026-08-10T14:20:00Z',
    checkedIn: false
  },
  {
    id: 'g-2',
    name: 'Julian Nel',
    email: 'julian.nel@example.com',
    phone: '+27 (83) 345-6789',
    inviteCode: 'CA-VIP02',
    rsvpStatus: 'attending',
    partySize: 2,
    attendingCount: 2,
    dietaryRestrictions: [],
    mealSelection: 'Karoo Lamb Cutlet & Prime Beef Fillet',
    songRequest: 'September - Earth, Wind & Fire',
    message: 'Proudest brother in the world! Ready to toast under the Outeniqua mountains to the best couple ever.',
    tableNumber: 'Table 1 (Family VIP)',
    isPlusOneAllowed: true,
    companionNames: ['Clara Nel'],
    respondedAt: '2026-08-12T09:45:00Z',
    checkedIn: false
  },
  {
    id: 'g-3',
    name: 'Charlotte & David Hayes',
    email: 'charlotte.hayes@example.com',
    phone: '+27 (71) 456-7890',
    inviteCode: 'CA-HAYES',
    rsvpStatus: 'attending',
    partySize: 2,
    attendingCount: 2,
    dietaryRestrictions: ['Gluten-Free'],
    dietaryDetails: 'Severe celiac for Charlotte',
    mealSelection: 'Pan-Seared Garden Route Kingklip',
    songRequest: 'L-O-V-E - Nat King Cole',
    message: 'Counting down the days! Looking forward to celebrating with you at ArendsRus.',
    tableNumber: 'Table 3 (Bridal Friends)',
    isPlusOneAllowed: true,
    companionNames: ['David Hayes'],
    respondedAt: '2026-08-14T18:10:00Z',
    checkedIn: false
  },
  {
    id: 'g-4',
    name: 'Oliver Sterling',
    email: 'oliver.sterling@example.com',
    phone: '+27 (82) 567-8901',
    inviteCode: 'CA-STERLING',
    rsvpStatus: 'pending',
    partySize: 2,
    attendingCount: 0,
    dietaryRestrictions: [],
    tableNumber: 'Table 4 (Groom Friends)',
    isPlusOneAllowed: true,
    companionNames: []
  },
  {
    id: 'g-5',
    name: 'Isabella & Thomas Laurent',
    email: 'isabella.laurent@example.com',
    phone: '+27 (84) 678-9012',
    inviteCode: 'CA-LAURENT',
    rsvpStatus: 'declined',
    partySize: 2,
    attendingCount: 0,
    dietaryRestrictions: [],
    message: 'Sending you both all our love and blessings from Cape Town! Have the most magical day at ArendsRus!',
    tableNumber: 'Unassigned',
    isPlusOneAllowed: true,
    companionNames: [],
    respondedAt: '2026-08-15T11:30:00Z'
  },
  {
    id: 'g-6',
    name: 'Genevieve Dupont',
    email: 'genevieve@example.com',
    inviteCode: 'CA-DUPONT',
    rsvpStatus: 'pending',
    partySize: 1,
    attendingCount: 0,
    dietaryRestrictions: [],
    isPlusOneAllowed: false,
    tableNumber: 'Table 5'
  }
];

export const initialStory: StoryMilestone[] = [
  {
    year: 'Spring 2021',
    title: 'The Serendipitous Encounter',
    description: 'A shared table at a quaint coffee roastery in the Garden Route. What began as a brief chat over flat whites turned into hours of captivating conversation and laughter.',
    location: 'Wilderness, Western Cape'
  },
  {
    year: 'Summer 2023',
    title: 'Exploring the Garden Route & Coast',
    description: 'From hiking through the Outeniqua mountain passes to sunset beach walks along Victoria Bay, every adventure drew us closer together.',
    location: 'George & Knysna'
  },
  {
    year: 'Winter 2024',
    title: 'Building Our Sanctuary',
    description: 'We made our cozy home together, adopting our golden retriever Biscuit, nurturing our garden, and hosting unforgettable braais with dear friends and family.',
    location: 'Western Cape'
  },
  {
    year: 'Spring 2025',
    title: 'The Proposal Under The Mountain Stars',
    description: 'Overlooking the rolling foothills at sunset with a King Protea bouquet, Cameron asked Abby to be his wife. With tears of pure happiness, she said forever.',
    location: 'Outeniqua Foothills'
  }
];

export const initialSchedule: ScheduleEvent[] = [
  {
    time: '3:00 PM',
    title: 'Welcome Drinks & Live Acoustic Strings',
    location: 'ArendsRus Rose Courtyard',
    description: 'Arrive to chilled South African Cap Classique sparkling wine, artisanal cordials, and acoustic melodies amidst blooming roses.',
    icon: 'Sparkles',
    dressCode: 'Formal Garden Attire'
  },
  {
    time: '3:30 PM',
    title: 'The Marriage Ceremony',
    location: 'ArendsRus Country Chapel',
    description: 'The vows, the rings, and the celebration of love framed by sweeping Outeniqua Mountain panoramas.',
    icon: 'HeartHandshake'
  },
  {
    time: '4:30 PM',
    title: 'Sunset Cocktails & Canapés',
    location: 'The Mountain Lawn & Wooden Deck',
    description: 'Bespoke craft gin bar, local Garden Route wines, gourmet artisanal canapés, and golden hour lawn games.',
    icon: 'Wine'
  },
  {
    time: '6:00 PM',
    title: 'Banquet Dinner & Heartfelt Speeches',
    location: 'The ArendsRus Barn Yard Hall',
    description: 'A sumptuous three-course culinary feast, premier Western Cape wine pairings, and toasts to the new Mr & Mrs Nel.',
    icon: 'Utensils'
  },
  {
    time: '8:00 PM',
    title: 'Cake Cutting & First Dance',
    location: 'Barn Yard Center Floor',
    description: 'Sweet moments under glowing crystal chandeliers followed by opening the dance floor.',
    icon: 'Music'
  },
  {
    time: '11:30 PM',
    title: 'Midnight Sparkler Send-Off',
    location: 'Lodge Pine Walkway',
    description: 'Surround Cameron and Abby with golden sparklers as they head off into the night!',
    icon: 'Flame'
  }
];

export const initialAccommodations: Accommodation[] = [
  {
    name: 'ArendsRus Country Lodge Chalets & Cabins',
    address: 'Koesterbos Rd, Geelhoutboom, George',
    phone: '+27 (0)44 050 0256',
    bookingCode: 'CAM-ABBY-WEDDING',
    distance: 'On-site at wedding venue',
    link: 'https://arendsrus.co.za',
    rate: 'Special Wedding Guest Rates (Cabins & Chalets)'
  },
  {
    name: 'Fancourt Luxury Estate & Golf Resort',
    address: 'Montagu Street, Blanco, George',
    phone: '+27 (0)44 804 0000',
    bookingCode: 'NEL-VANCE-2027',
    distance: '10 mins from ArendsRus',
    link: 'https://fancourt.co.za',
    rate: '5-Star Luxury Room Block: from R2,450/night'
  },
  {
    name: 'Protea Hotel by Marriott King George',
    address: 'King George Drive, King George Park, George',
    phone: '+27 (0)44 874 7664',
    bookingCode: 'WEDDING2027',
    distance: '15 mins from ArendsRus',
    link: 'https://marriott.com',
    rate: 'Discounted Group Rate: from R1,250/night'
  }
];

export const initialFaqs: FAQ[] = [
  {
    id: 'faq-1',
    category: 'Travel & Stay',
    question: 'Where is ArendsRus Country Lodge located?',
    answer: 'ArendsRus Country Lodge is situated on Koesterbos Road in Geelhoutboom, just 15 minutes from George Airport (GRJ) in the Western Cape, South Africa. It is set at the foot of the magnificent Outeniqua Mountains.'
  },
  {
    id: 'faq-2',
    category: 'Ceremony & Reception',
    question: 'What is the dress code?',
    answer: 'The dress code is Formal Garden Elegance / South African Romance. Floor-length gowns, chic cocktail dresses, and tailored suits. Soft blush pink, rosewood, champagne gold, sage fynbos green, and navy are encouraged. Note: Evening mountain breezes can be cool, so a light wrap is recommended.'
  },
  {
    id: 'faq-3',
    category: 'Ceremony & Reception',
    question: 'When should I RSVP by?',
    answer: 'Please submit your RSVP through this website by May 1st, 2027 so we can finalize our catering numbers and seating arrangements with ArendsRus.'
  },
  {
    id: 'faq-4',
    category: 'Travel & Stay',
    question: 'Is there parking and transport available?',
    answer: 'Yes! Complimentary secure parking is available on-site at ArendsRus Country Lodge. Shuttle transfers will also run between Fancourt / Protea Hotel and ArendsRus throughout the wedding day and night.'
  },
  {
    id: 'faq-5',
    category: 'Ceremony & Reception',
    question: 'Are children invited?',
    answer: 'While we love your little ones, our ceremony and reception will be an adults-only celebration (with the exception of our immediate wedding party flower girls and ring bearers).'
  },
  {
    id: 'faq-6',
    category: 'Gifts',
    question: 'Where are you registered?',
    answer: 'Your presence at our wedding is the greatest gift of all! If you wish to honor us with a gift, we have created a Honeymoon Adventure Fund and a curated home registry linked on this site.'
  }
];

export const initialRegistry: RegistryItem[] = [
  {
    id: 'reg-1',
    title: 'Honeymoon Safari & Coastal Getaway Fund',
    description: 'Help us create unforgettable honeymoon memories—from luxury bushveld safari game drives to private seaside dinners along the Garden Route.',
    type: 'honeymoon',
    icon: 'Plane',
    goalAmount: 50000,
    currentAmount: 36500,
    accountDetails: 'EFT: Capitec / FNB | Acc: 1548963214 | Branch: 470010 | Ref: CamAbby'
  },
  {
    id: 'reg-2',
    title: '@home Living & Dining Luxury Registry',
    description: 'Artisanal cookware, crystal wine glasses, and French linen tableware for our home entertaining.',
    type: 'registry',
    icon: 'Gift',
    link: 'https://www.home.co.za'
  },
  {
    id: 'reg-3',
    title: 'Yuppiechef Gourmet Kitchen & Braai',
    description: 'Cast iron cookware, craft braai equipment, and specialty coffee accessories for our weekend culinary adventures.',
    type: 'registry',
    icon: 'Wine',
    link: 'https://www.yuppiechef.com'
  }
];

export const initialBridalParty: BridalPartyMember[] = [
  {
    id: 'bp-1',
    name: 'Eleanor Vance',
    role: 'Maid of Honor',
    relation: 'Sister of the Bride',
    bio: 'Abby\'s lifelong confidante, sister, and the architect of unforgettable memories.'
  },
  {
    id: 'bp-2',
    name: 'Julian Nel',
    role: 'Best Man',
    relation: 'Brother of the Groom',
    bio: 'Cameron\'s older brother, mentor, and fellow adventurer who has supported him through every chapter of life.'
  },
  {
    id: 'bp-3',
    name: 'Camilla Thorne',
    role: 'Bridesmaid',
    relation: 'Close Friend',
    bio: 'Art director and curator who was there the night Abby first shared that Cameron was the one.'
  },
  {
    id: 'bp-4',
    name: 'Harrison Wells',
    role: 'Groomsman',
    relation: 'Childhood Friend',
    bio: 'High school soccer teammate and master of speeches guaranteed to bring both tears and roaring laughter.'
  }
];

export const initialWishes: GuestWish[] = [
  {
    id: 'w-1',
    name: 'Aunt Beatrice & Uncle Robert',
    message: 'Watching you two grow into such a beautiful, inspiring couple brings so much joy to our hearts. ArendsRus is going to be pure magic! 🌸',
    date: '2026-08-10',
    likes: 18
  },
  {
    id: 'w-2',
    name: 'Liam & Maya Sterling',
    message: 'To the absolute dream couple! We cannot wait to celebrate under the Outeniqua mountains with you both in George. Cheers to forever! 🥂',
    date: '2026-08-12',
    likes: 14
  },
  {
    id: 'w-3',
    name: 'Dr. Evelyn Ward',
    message: 'Congratulations Abby & Cameron! May your marriage be blessed with endless joy, deep laughter, and breathtaking adventures.',
    date: '2026-08-14',
    likes: 12
  }
];
