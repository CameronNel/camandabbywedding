import type { WeddingConfig, Guest, StoryMilestone, ScheduleEvent, Accommodation, FAQ, RegistryItem, BridalPartyMember, GuestWish } from '../types/wedding';

export const initialConfig: WeddingConfig = {
  brideName: 'Abigail Rose Vance',
  brideShortName: 'Abby',
  groomName: 'Cameron Liam Nel',
  groomShortName: 'Cameron',
  weddingDate: '2027-06-19T15:00:00',
  tagline: 'Two souls, one heart, a lifetime of adventures.',
  hashtag: '#CamAndAbbyWedding',
  quote: 'Whatever our souls are made of, his and mine are the same.',
  quoteAuthor: 'Emily Brontë',
  ceremonyVenue: {
    name: 'The Rosewood Botanical Conservatory',
    address: '428 Villa Magnifique Way',
    city: 'Napa Valley, CA 94558',
    time: '3:00 PM PST',
    mapUrl: 'https://maps.google.com/?q=Napa+Valley+California',
    description: 'An ethereal glass greenhouse surrounded by blooming English heritage roses and century-old olive groves.'
  },
  receptionVenue: {
    name: 'Château de Lumière Grand Ballroom & Lawn',
    address: '450 Villa Magnifique Way',
    city: 'Napa Valley, CA 94558',
    time: '5:00 PM – Midnight',
    mapUrl: 'https://maps.google.com/?q=Napa+Valley+California',
    description: 'Dining and dancing under a canopy of crystal chandeliers and twinkling starry skies.'
  },
  dressCode: {
    title: 'Formal Garden Elegance / Black Tie Optional',
    description: 'We kindly invite our guests to celebrate in formal garden attire. Floor-length gowns, cocktail dresses, and tailored suits or tuxedos. Pastel pinks, soft neutrals, sage, and champagne tones are warmly encouraged.',
    palette: ['#FCE7EE', '#F9D5E5', '#E3D5CA', '#D5E2D5', '#D4AF37', '#33272A']
  },
  adminPin: '1234',
  mealOptions: [
    {
      id: 'beef',
      name: 'Herb-Crusted Prime Filet Mignon',
      description: 'Served with truffled potato mousseline, charred baby asparagus, and rich red wine bordelaise sauce.',
      icon: '🥩',
      tags: ['Chef Special', 'Gluten-Free']
    },
    {
      id: 'fish',
      name: 'Pan-Seared Pacific King Salmon',
      description: 'Crispy skin salmon with sweet pea risotto, saffron champagne emulsion, and microgreens.',
      icon: '🐟',
      tags: ['Gluten-Free', 'Pescatarian']
    },
    {
      id: 'vegetarian',
      name: 'Wild Morel & Truffle Risotto',
      description: 'Creamy arborio rice with foraged forest mushrooms, white truffle oil, shaved aged parmesan, and crispy sage.',
      icon: '🍄',
      tags: ['Vegetarian', 'Gluten-Free Available']
    },
    {
      id: 'vegan',
      name: 'Roasted Butternut Squash Wellington',
      description: 'Flaky pastry filled with caramelized squash, wild spinach, walnuts, and cranberry reduction.',
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
    phone: '+1 (555) 234-5678',
    inviteCode: 'CA-VIP01',
    rsvpStatus: 'attending',
    partySize: 2,
    attendingCount: 2,
    dietaryRestrictions: ['Vegetarian'],
    dietaryDetails: 'No meat, dairy is fine',
    mealSelection: 'Wild Morel & Truffle Risotto',
    songRequest: 'Can\'t Help Falling in Love - Elvis Presley',
    message: 'Cannot wait to see my sweet sister walk down the aisle! So deeply happy for Cam and Abby 💕',
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
    phone: '+1 (555) 345-6789',
    inviteCode: 'CA-VIP02',
    rsvpStatus: 'attending',
    partySize: 2,
    attendingCount: 2,
    dietaryRestrictions: [],
    mealSelection: 'Herb-Crusted Prime Filet Mignon',
    songRequest: 'September - Earth, Wind & Fire',
    message: 'Proudest brother in the world! Ready to toast to the best couple ever.',
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
    phone: '+1 (555) 456-7890',
    inviteCode: 'CA-HAYES',
    rsvpStatus: 'attending',
    partySize: 2,
    attendingCount: 2,
    dietaryRestrictions: ['Gluten-Free'],
    dietaryDetails: 'Severe celiac for Charlotte',
    mealSelection: 'Pan-Seared Pacific King Salmon',
    songRequest: 'L-O-V-E - Nat King Cole',
    message: 'Counting down the days! Looking forward to celebrating with you in Napa.',
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
    phone: '+1 (555) 567-8901',
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
    phone: '+1 (555) 678-9012',
    inviteCode: 'CA-LAURENT',
    rsvpStatus: 'declined',
    partySize: 2,
    attendingCount: 0,
    dietaryRestrictions: [],
    message: 'Heartbroken we cannot make the trip overseas due to expected baby arrival, but sending you both all our love and blessings!',
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
    description: 'A shared table at a quaint bookstore café on a rainy afternoon. What began as a conversation over coffee turned into hours of uninterrupted laughter.',
    location: 'Florence, Italy'
  },
  {
    year: 'Winter 2022',
    title: 'The First Adventure Together',
    description: 'From hiking snow-capped mountain peaks to discovering hidden seaside spots, we realized every journey was infinitely sweeter together.',
    location: 'Swiss Alps & Paris'
  },
  {
    year: 'Autumn 2024',
    title: 'Building Our Home',
    description: 'We adopted our golden retriever, Biscuit, and moved into our first sunlit home filled with plants, record players, and endless home-cooked dinners.',
    location: 'California'
  },
  {
    year: 'Summer 2025',
    title: 'She Said Yes Under The Stars',
    description: 'Overlooking the caldera cliffs of Santorini at golden hour, Cameron got down on one knee with a vintage rose gold ring. With tears of joy, Abby said forever.',
    location: 'Oia, Santorini'
  }
];

export const initialSchedule: ScheduleEvent[] = [
  {
    time: '2:30 PM',
    title: 'Welcome Champagne & String Quartet',
    location: 'Conservatory Courtyard',
    description: 'Arrive to the soothing melodies of our live string quartet and a chilled glass of vintage rosé champagne.',
    icon: 'Sparkles',
    dressCode: 'Formal Garden Attire'
  },
  {
    time: '3:00 PM',
    title: 'The Marriage Ceremony',
    location: 'Rosewood Botanical Conservatory',
    description: 'The vows, the rings, and the declaration of eternal devotion amidst lush floral arches.',
    icon: 'HeartHandshake'
  },
  {
    time: '4:00 PM',
    title: 'Sunset Cocktail & Canapé Hour',
    location: 'The Grand Terrace & Olive Grove',
    description: 'Artisanal charcuterie, signature bride & groom cocktails, live jazz trio, and lawn games.',
    icon: 'Wine'
  },
  {
    time: '5:30 PM',
    title: 'Gourmet Dinner & Speeches',
    location: 'Château Grand Ballroom',
    description: 'A four-course culinary journey curated by Executive Chef Laurent, paired with world-class Napa wines.',
    icon: 'Utensils'
  },
  {
    time: '7:30 PM',
    title: 'Cake Cutting & First Dance',
    location: 'Main Dance Floor',
    description: 'Sweet moments, champagne toasts, and the beginning of our celebration under the chandelier canopy.',
    icon: 'Music'
  },
  {
    time: '11:00 PM',
    title: 'Grand Sparkler Send-Off',
    location: 'Château Front Gates',
    description: 'Light up the night as the newly married couple departs for their honeymoon voyage.',
    icon: 'Flame'
  }
];

export const initialAccommodations: Accommodation[] = [
  {
    name: 'The Meadowood Napa Valley Resort & Spa',
    address: '900 Meadowood Lane, St. Helena, CA',
    phone: '+1 (707) 555-0199',
    bookingCode: 'CAM-ABBY-2027',
    distance: '5 mins from venue',
    link: 'https://meadowood.com',
    rate: 'Special Room Block: $289/night'
  },
  {
    name: 'Harvest Inn Boutique Hotel',
    address: '1 Main Street, St. Helena, CA',
    phone: '+1 (707) 555-0144',
    bookingCode: 'NEL-VANCE',
    distance: '10 mins from venue',
    link: 'https://harvestinn.com',
    rate: 'Special Room Block: $219/night'
  },
  {
    name: 'Napa Valley Vintage Estate Inn',
    address: '6541 Washington St, Yountville, CA',
    phone: '+1 (707) 555-0182',
    bookingCode: 'WEDDING2027',
    distance: '15 mins from venue',
    link: 'https://vintageestate.com',
    rate: 'Special Room Block: $199/night'
  }
];

export const initialFaqs: FAQ[] = [
  {
    id: 'faq-1',
    category: 'Ceremony & Reception',
    question: 'What is the dress code?',
    answer: 'The dress code is Formal Garden Elegance / Black Tie Optional. Floor-length evening gowns, elegant midi dresses, or sharp suits and tuxedos. We encourage soft blush, rose, champagne, sage, or neutral hues.'
  },
  {
    id: 'faq-2',
    category: 'Ceremony & Reception',
    question: 'When should I RSVP by?',
    answer: 'Please submit your RSVP through this website by May 1st, 2027 so we can ensure our caterers and seating arrangements are perfectly prepared for you.'
  },
  {
    id: 'faq-3',
    category: 'Ceremony & Reception',
    question: 'Are children invited?',
    answer: 'While we adore your little ones, our ceremony and reception will be an adults-only celebration (with the exception of our immediate wedding party flower girls and ring bearers). We hope you enjoy this evening as a romantic night out!'
  },
  {
    id: 'faq-4',
    category: 'Travel & Stay',
    question: 'Is there parking or shuttle transportation?',
    answer: 'Complimentary valet parking is provided at the venue entrance. Additionally, luxury private shuttle buses will run continuous round-trips from the 3 partner hotels listed in our Travel section starting from 1:45 PM until midnight.'
  },
  {
    id: 'faq-5',
    category: 'Ceremony & Reception',
    question: 'Can I bring a Plus One?',
    answer: 'Due to venue capacity, we can only accommodate guests formally listed on your invitation. When you look up your RSVP, your allocated party size will appear automatically.'
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
    title: 'Amalfi Coast Honeymoon Adventure Fund',
    description: 'Help us create unforgettable memories on our dream Italian coastal getaway—from cliffside dinners in Positano to private Capri boat charters.',
    type: 'honeymoon',
    icon: 'Plane',
    goalAmount: 5000,
    currentAmount: 3450,
    accountDetails: 'Venmo: @Cameron-Nel | PayPal: cameron.abby.wedding@example.com'
  },
  {
    id: 'reg-2',
    title: 'Williams Sonoma Luxury Home & Kitchen',
    description: 'Classic copper cookware, French linen table runners, and artisanal espresso equipment for our shared culinary adventures.',
    type: 'registry',
    icon: 'Gift',
    link: 'https://www.williams-sonoma.com'
  },
  {
    id: 'reg-3',
    title: 'Crate & Barrel Dining & Entertaining',
    description: 'Fine bone china dinnerware, crystal glassware, and heirloom wine decanters to host dinner parties with our loved ones.',
    type: 'registry',
    icon: 'Wine',
    link: 'https://www.crateandbarrel.com'
  }
];

export const initialBridalParty: BridalPartyMember[] = [
  {
    id: 'bp-1',
    name: 'Eleanor Vance',
    role: 'Maid of Honor',
    relation: 'Sister of the Bride',
    bio: 'Abby\'s lifelong confidante, partner in crime, and the architect of unforgettable sister adventures.'
  },
  {
    id: 'bp-2',
    name: 'Julian Nel',
    role: 'Best Man',
    relation: 'Brother of the Groom',
    bio: 'Cameron\'s older brother, mentor, and fellow adventurer who has supported him since day one.'
  },
  {
    id: 'bp-3',
    name: 'Camilla Thorne',
    role: 'Bridesmaid',
    relation: 'College Best Friend',
    bio: 'Art director and curator who was there the night Abby first told her she met "the one".'
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
    message: 'Watching you two grow into such a beautiful, inspiring couple brings so much joy to our hearts. May your love deepen with every passing year! 🌸',
    date: '2026-08-10',
    likes: 14
  },
  {
    id: 'w-2',
    name: 'Liam & Maya Sterling',
    message: 'To the absolute dream team! We can\'t wait to dance the night away with you both in Napa. Wishing you a lifetime of laughter and adventures!',
    date: '2026-08-12',
    likes: 9
  },
  {
    id: 'w-3',
    name: 'Dr. Evelyn Ward',
    message: 'Congratulations Abby & Cameron! May your marriage be filled with endless patience, warm embraces, and boundless happiness.',
    date: '2026-08-14',
    likes: 11
  }
];
