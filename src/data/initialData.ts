import type { WeddingConfig, Guest, StoryMilestone, ScheduleEvent, Accommodation, FAQ, RegistryItem, BridalPartyMember, GuestWish } from '../types/wedding';

export const initialConfig: WeddingConfig = {
  brideName: 'Abby',
  brideShortName: 'Abby',
  groomName: 'Cameron Nel',
  groomShortName: 'Cam',
  weddingDate: '2027-01-04T15:30:00',
  tagline: 'From late-night gaming lobbies to forever under the Outeniqua Mountains.',
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
    name: 'Brumilda',
    email: 'brumilda@example.com',
    phone: '+27 (82) 111-2222',
    inviteCode: 'CA-BRUMILDA',
    rsvpStatus: 'attending',
    partySize: 2,
    attendingCount: 2,
    dietaryRestrictions: [],
    mealSelection: 'Karoo Lamb Cutlet & Prime Beef Fillet',
    songRequest: 'Dancing Queen - ABBA',
    message: 'Cannot wait for the biggest celebration of the year! So happy for you Cam & Abby! 💕',
    tableNumber: 'Table 1 (Bridal Party & VIP)',
    isPlusOneAllowed: true,
    companionNames: ['Plus One'],
    respondedAt: '2026-08-10T14:20:00Z',
    checkedIn: false
  },
  {
    id: 'g-2',
    name: 'Roy',
    email: 'roy@example.com',
    phone: '+27 (83) 333-4444',
    inviteCode: 'CA-ROY',
    rsvpStatus: 'attending',
    partySize: 2,
    attendingCount: 2,
    dietaryRestrictions: [],
    mealSelection: 'Karoo Lamb Cutlet & Prime Beef Fillet',
    songRequest: 'September - Earth, Wind & Fire',
    message: 'Best man speech is ready! Ready to raise a glass to Cam and Abby at ArendsRus.',
    tableNumber: 'Table 1 (Bridal Party & VIP)',
    isPlusOneAllowed: true,
    companionNames: ['Plus One'],
    respondedAt: '2026-08-12T09:45:00Z',
    checkedIn: false
  },
  {
    id: 'g-3',
    name: 'Janke',
    email: 'janke@example.com',
    phone: '+27 (71) 555-6666',
    inviteCode: 'CA-JANKE',
    rsvpStatus: 'attending',
    partySize: 2,
    attendingCount: 2,
    dietaryRestrictions: ['Vegetarian'],
    mealSelection: 'Wild Mushroom & Fynbos Truffle Risotto',
    tableNumber: 'Table 1 (Bridal Party & VIP)',
    isPlusOneAllowed: true,
    companionNames: ['Plus One']
  },
  {
    id: 'g-4',
    name: 'Ethan',
    email: 'ethan@example.com',
    phone: '+27 (72) 777-8888',
    inviteCode: 'CA-ETHAN',
    rsvpStatus: 'attending',
    partySize: 2,
    attendingCount: 2,
    dietaryRestrictions: [],
    mealSelection: 'Pan-Seared Garden Route Kingklip',
    tableNumber: 'Table 1 (Bridal Party & VIP)',
    isPlusOneAllowed: true,
    companionNames: ['Plus One']
  }
];

export const initialStory: StoryMilestone[] = [
  {
    year: '2021',
    title: 'GG to Real Life — How We Met',
    description: 'What started as late-night gaming sessions and teaming up in Discord voice chats quickly became the absolute highlight of every day. Shared victories and constant banter laid the foundation for something extraordinary.',
    location: 'Online Gaming & Discord'
  },
  {
    year: '2022',
    title: 'From Avatars to In-Person Chemistry',
    description: 'We finally met face-to-face at a work event. The instant spark, natural ease, and contagious laughter proved that what we had built online was even more magical in the real world.',
    location: 'Work Event'
  },
  {
    year: '2023',
    title: 'The Coffee Date That Lasted All Day',
    description: 'Our first dedicated coffee shop date quickly turned into hours of captivating conversation and endless smiles over flat whites. Leaving that café, we both knew we had found our person.',
    location: 'Coffee Roastery'
  },
  {
    year: '2024',
    title: 'Building Our Sanctuary with Anne & Sage',
    description: 'We made our cozy home together and welcomed our two precious cats, Anne and Sage. Our home became filled with love, playful antics, purrs, and hosting unforgettable braais.',
    location: 'Western Cape'
  },
  {
    year: '2025',
    title: 'The Proposal on the Golf Course',
    description: 'Against the peaceful scenic greens of the golf course, Cam dropped down on one knee and asked Abby to be his wife. Through joyful tears and laughter, she said forever!',
    location: 'Golf Course Fairway'
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
    description: 'Surround Cam and Abby with golden sparklers as they head off into the night!',
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
    bookingCode: 'CAM-ABBY-2027',
    distance: '10 mins from ArendsRus',
    link: 'https://fancourt.co.za',
    rate: '5-Star Luxury Room Block: from R2,450/night'
  },
  {
    name: 'Protea Hotel by Marriott King George',
    address: 'King George Drive, King George Park, George',
    phone: '+27 (0)44 874 7664',
    bookingCode: 'CAM-ABBY-2027',
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
    answer: 'Please submit your RSVP through this website by December 1st, 2026 so we can finalize our catering numbers and seating arrangements with ArendsRus.'
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
    answer: 'Your presence at our wedding is the greatest gift of all! If you wish to honor us with a gift, our wishlist and Honeymoon Adventure Fund are available on this site.'
  }
];

export const initialRegistry: RegistryItem[] = [
  {
    id: 'reg-1',
    title: 'Honeymoon in Europe Fund',
    description: 'Help us create unforgettable honeymoon memories across Europe—from quaint Parisian bistros and Italian gelaterias to scenic alpine trains and romantic sunsets.',
    type: 'honeymoon',
    icon: 'Plane',
    goalAmount: 50000,
    currentAmount: 36500,
    accountDetails: 'EFT: Capitec / FNB | Acc: 1548963214 | Branch: 470010 | Ref: CamAbby'
  },
  {
    id: 'reg-2',
    title: 'Small Gifts & Home Registry',
    description: 'Specialty coffee roasters, cozy home accents, crystal glassware, and luxury French linen for our home entertaining.',
    type: 'registry',
    icon: 'Gift',
    link: 'https://www.home.co.za'
  },
  {
    id: 'reg-3',
    title: 'Yuppiechef Gourmet Kitchen & Braai',
    description: 'Cast iron cookware, craft braai equipment, artisanal spices, and specialty kitchen accessories for our weekend culinary adventures.',
    type: 'registry',
    icon: 'Wine',
    link: 'https://www.yuppiechef.com'
  }
];

export const initialBridalParty: BridalPartyMember[] = [
  {
    id: 'bp-1',
    name: 'Brumilda',
    role: 'Maid of Honor',
    relation: 'Best Friend of the Bride',
    bio: 'Abby\'s dearest confidante, sister-at-heart, and the architect of unforgettable memories.'
  },
  {
    id: 'bp-2',
    name: 'Roy',
    role: 'Best Man',
    relation: 'Best Friend & Brother of the Groom',
    bio: 'Cam\'s trusted right-hand man, gaming duo partner, and fellow adventurer through all of life\'s chapters.'
  },
  {
    id: 'bp-3',
    name: 'Janke',
    role: 'Bridesmaid',
    relation: 'Close Friend of the Bride',
    bio: 'Brings boundless positive energy, warmth, and laughter to every single celebration.'
  },
  {
    id: 'bp-4',
    name: 'Ethan',
    role: 'Groomsman',
    relation: 'Close Friend of the Groom',
    bio: 'Longtime friend and raid teammate who is always ready with great banter, loyalty, and support.'
  }
];

export const initialWishes: GuestWish[] = [
  {
    id: 'w-1',
    name: 'Brumilda & Roy',
    message: 'To the absolute dream couple! We cannot wait to celebrate under the Outeniqua mountains with you both in George. Cheers to forever! 🥂',
    date: '2026-08-10',
    likes: 24
  },
  {
    id: 'w-2',
    name: 'Janke & Ethan',
    message: 'From gaming lobbies to wedding bells! So proud and excited to stand by you two at ArendsRus. 💕',
    date: '2026-08-12',
    likes: 19
  }
];
