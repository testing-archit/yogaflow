
import { Moon, User, Trees, Battery, Brain, Activity, ShieldCheck, Heart } from 'lucide-react';
import { TimelinePhase, ClassSession, Instructor, PricingTier, YogaClass, Track, Asana, ResearchTopic } from './types';

export const LOGO_URL = "https://res.cloudinary.com/dvue1idmp/image/upload/v1767086031/yoga_flow_tjmk50.jpg";

export const HERO_METRICS = [
  { label: 'Flexibility', value: '30%', trend: 'up' as const },
  { label: 'Back Pain', value: '85%', trend: 'down' as const },
  { label: 'Core Strength', value: '3x', trend: 'up' as const },
];

export const MEDITATION_TRACKS: Track[] = [
  {
    id: 't1',
    title: 'Breath of the Himalayas',
    category: 'Healing',
    duration: '07:42',
    audioUrl: 'https://res.cloudinary.com/dvue1idmp/video/upload/v1767085946/soothing_1_qznnmr.wav',
    description: 'A calming atmospheric journey through high-altitude frequencies, perfect for deep pranayama and nervous system repair.',
    instructor: 'Yoga Flow Originals'
  },
  {
    id: 't2',
    title: 'Sacred Ganges Drift',
    category: 'Sleep',
    duration: '06:15',
    audioUrl: 'https://res.cloudinary.com/dvue1idmp/video/upload/v1767086116/soothing_2_vlrs5u.wav',
    description: 'Gentle rhythmic undulations mirroring the flow of the sacred river, designed to guide the mind into deep, restorative sleep.',
    instructor: 'Yoga Flow Originals'
  }
];

export const ASANAS: Asana[] = [
  {
    id: 'bakasana',
    sanskritName: 'Bakāsana',
    englishName: 'Crow Pose',
    category: 'Arm Balance',
    level: 'Intermediate',
    description: 'Bakāsana is a foundational arm-balance posture that builds strength, focus, and confidence. The body balances on the hands while the knees rest on the upper arms, cultivating both physical power and mental steadiness.',
    benefits: [
      'Strengthens arms, wrists, shoulders, and core',
      'Improves balance and body awareness',
      'Builds confidence and mental focus'
    ],
    howTo: [
      'Start in a squat',
      'Place palms firmly on the mat',
      'Lean forward, lifting feet off the ground',
      'Engage core and gaze forward'
    ],
    focusCue: 'Shift weight gradually. Trust your balance.',
    imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'adho-mukha',
    sanskritName: 'Adho Mukha Śvānāsana',
    englishName: 'Downward-Facing Dog',
    category: 'Inversion / Stretch',
    level: 'Beginner',
    description: 'Adho Mukha Śvānāsana is a grounding, full-body posture often used as a resting pose. It lengthens the spine, energizes the body, and calms the mind.',
    benefits: [
      'Stretches spine, hamstrings, calves, and shoulders',
      'Strengthens arms and legs',
      'Improves circulation and posture'
    ],
    howTo: [
      'Start on hands and knees',
      'Lift hips upward and back',
      'Press heels toward the floor',
      'Keep spine long and neck relaxed'
    ],
    focusCue: 'Breathe steadily and lengthen the spine.',
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'tadasana',
    sanskritName: 'Tāḍāsana',
    englishName: 'Mountain Pose',
    category: 'Standing / Foundation',
    level: 'Beginner',
    description: 'Tāḍāsana is the foundation of all standing postures. Though simple in appearance, it teaches alignment, stability, and mindful awareness of the body.',
    benefits: [
      'Improves posture and alignment',
      'Strengthens legs and core',
      'Enhances body awareness and balance'
    ],
    howTo: [
      'Stand tall with feet grounded',
      'Engage thighs and core',
      'Lengthen spine and relax shoulders',
      'Breathe evenly'
    ],
    focusCue: 'Stand steady like a mountain.',
    imageUrl: 'https://images.unsplash.com/photo-1599447421416-3414500d18a5?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'vrksasana',
    sanskritName: 'Vṛkṣāsana',
    englishName: 'Tree Pose',
    category: 'Balance',
    level: 'Beginner–Intermediate',
    description: 'Vṛkṣāsana cultivates balance, concentration, and inner calm. The posture mirrors the stability and grace of a tree rooted firmly in the earth.',
    benefits: [
      'Improves balance and coordination',
      'Strengthens legs and ankles',
      'Enhances focus and mental clarity'
    ],
    howTo: [
      'Stand on one leg',
      'Place foot on calf or thigh (avoid knee)',
      'Bring palms together at the chest',
      'Fix gaze on a steady point'
    ],
    focusCue: 'Root down, rise up.',
    imageUrl: 'https://images.unsplash.com/photo-1552196563-55cd4e45efb3?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'virabhadrasana',
    sanskritName: 'Vīrabhadrāsana',
    englishName: 'Warrior Pose',
    category: 'Standing / Strength',
    level: 'Beginner–Intermediate',
    description: 'Vīrabhadrāsana is a powerful standing posture that builds strength, stamina, and confidence. It represents inner strength with calm awareness.',
    benefits: [
      'Strengthens legs, hips, and arms',
      'Improves stability and endurance',
      'Boosts confidence and focus'
    ],
    howTo: [
      'Step one foot back',
      'Bend front knee',
      'Extend arms with steady gaze',
      'Keep chest open and strong'
    ],
    focusCue: 'Be strong, steady, and present.',
    imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=800'
  }
];

export const RESEARCH_TOPICS: ResearchTopic[] = [
  {
    id: 'anxiety',
    benefit: 'Anxiety Reduction',
    description: 'Yoga modulates the stress response systems by decreasing cortisol levels and increasing GABA levels in the brain.',
    papers: [
      { title: 'The Effect of Yoga on Anxiety and Depression: A Systematic Review', url: 'https://pubmed.ncbi.nlm.nih.gov/23476019/' },
      { title: 'Biological Mechanisms of Yoga for Anxiety Disorders', url: 'https://pubmed.ncbi.nlm.nih.gov/22421689/' }
    ]
  },
  {
    id: 'blood-pressure',
    benefit: 'Blood Pressure Reduction',
    description: 'Consistent Hatha yoga practice has been shown to significantly reduce systolic and diastolic blood pressure through parasympathetic activation.',
    papers: [
      { title: 'Impact of Yoga on Hypertension: A Meta-Analysis', url: 'https://pubmed.ncbi.nlm.nih.gov/24510008/' },
      { title: 'Yoga and Cardiovascular Health: Scientific Proof', url: 'https://pubmed.ncbi.nlm.nih.gov/30554031/' }
    ]
  },
  {
    id: 'back-pain',
    benefit: 'Chronic Back Pain Improvement',
    description: 'Specialized yoga sequences focusing on core stability and spinal mobility are as effective as physical therapy for chronic low back pain.',
    papers: [
      { title: 'Yoga vs Physiotherapy for Low Back Pain', url: 'https://pubmed.ncbi.nlm.nih.gov/28630956/' },
      { title: 'Long-term outcomes of Yoga for spinal health', url: 'https://pubmed.ncbi.nlm.nih.gov/23476019/' }
    ]
  },
  {
    id: 'sleep-quality',
    benefit: 'Sleep Quality Improvement',
    description: 'Yoga Nidra and Restorative practices improve melatonin secretion and decrease sleep latency in individuals with insomnia.',
    papers: [
      { title: 'Yoga for Insomnia in Older Adults', url: 'https://pubmed.ncbi.nlm.nih.gov/24036124/' },
      { title: 'Effect of Evening Yoga on Sleep Architecture', url: 'https://pubmed.ncbi.nlm.nih.gov/31343715/' }
    ]
  },
  {
    id: 'depression',
    benefit: 'Depression Symptom Reduction',
    description: 'Yoga serves as an effective adjunct therapy for Major Depressive Disorder by stabilizing heart rate variability.',
    papers: [
      { title: 'Antidepressant effects of Sudarshan Kriya', url: 'https://pubmed.ncbi.nlm.nih.gov/23831245/' },
      { title: 'Yoga and Neuroplasticity in Depression', url: 'https://pubmed.ncbi.nlm.nih.gov/30554031/' }
    ]
  }
];

export const PROBLEMS = [
  { text: 'Poor sleep & insomnia', icon: Moon },
  { text: 'Chronic stress & anxiety', icon: Brain },
  { text: 'Persistent back & neck pain', icon: Activity },
  { text: 'Weak posture from desk work', icon: User },
];

export const SOLUTIONS = [
  { text: 'Nervous system regulation', icon: Battery },
  { text: 'Pain-free functional strength', icon: ShieldCheck },
  { text: 'Sustainable daily habits', icon: Heart },
  { text: 'Calm, grounded confidence', icon: Trees },
];

export const TIMELINE_STEPS: TimelinePhase[] = [
  {
    month: 'Month 1',
    title: 'Sleep & Nervous System Reset',
    outcomes: [
      'Fall asleep 15–20 minutes faster',
      'Master Yoga Nidra & breathwork basics',
      'Establish consistent evening routines'
    ],
    icon: Moon,
    testimonial: {
      text: "I haven't slept through the night in years. By week 3, I was waking up refreshed.",
      author: "Sarah J., 34"
    },
    metrics: [
      { label: 'Deep Sleep', value: '+45%' },
      { label: 'Resting HR', value: '-8 bpm' }
    ]
  },
  {
    month: 'Month 3',
    title: 'Strength & Stability',
    outcomes: [
      'Pain-free range of motion',
      'Build a strong back & resilient joints',
      'Learn calm-on-demand tools'
    ],
    icon: User,
    testimonial: {
      text: "My lower back pain from sitting all day is completely gone. I feel strong.",
      author: "Arjun M., 41"
    },
    metrics: [
      { label: 'Back Pain', value: 'Zero' },
      { label: 'Plank Time', value: '2 min' }
    ]
  },
  {
    month: 'Month 6',
    title: 'Mastery & Confidence',
    outcomes: [
      'Consistently getting 7–8 hrs quality sleep',
      'Living without chronic tension or pain',
      'Self-practice confidence without guidance'
    ],
    icon: Trees,
    testimonial: {
      text: "This isn't just exercise. It changed how I handle pressure at work.",
      author: "Elena D., 29"
    },
    metrics: [
      { label: 'Stress Level', value: 'Low' },
      { label: 'Energy', value: 'All Day' }
    ]
  }
];

export const WEEKLY_SCHEDULE: ClassSession[] = [
  { day: 'Saturday', focus: 'Foundations & Form', duration: '45 min', intensity: 'Medium' },
  { day: 'Sunday', focus: 'Restorative & Nidra', duration: '60 min', intensity: 'Low' },
  { day: 'Tuesday', focus: 'Morning Mobility', duration: '20 min', intensity: 'Medium' },
  { day: 'Wednesday', focus: 'Strength & Core', duration: '30 min', intensity: 'High' },
];

export const LIVE_CLASSES: YogaClass[] = [
  {
    id: 'live-1',
    title: 'Sunrise Hatha Foundations',
    instructor: 'Pawan Deep Negi',
    level: 'Beginner',
    duration: '45 min',
    time: '06:30 AM',
    type: 'Hatha',
    focus: ['Alignment', 'Breath']
  },
  {
    id: 'live-2',
    title: 'Vinyasa Flow Mastery',
    instructor: 'Aradhna Uniyal',
    level: 'Intermediate',
    duration: '60 min',
    time: '08:00 AM',
    type: 'Vinyasa',
    focus: ['Strength', 'Mobility']
  },
  {
    id: 'live-3',
    title: 'Deep Tissue Release',
    instructor: 'Pawan Deep Negi',
    level: 'All',
    duration: '30 min',
    time: '05:30 PM',
    type: 'Mobility',
    focus: ['Recovery', 'Pain-Relief']
  },
  {
    id: 'live-4',
    title: 'Yoga Nidra for Sleep',
    instructor: 'Aradhna Uniyal',
    level: 'All',
    duration: '40 min',
    time: '09:00 PM',
    type: 'Meditation',
    focus: ['Sleep', 'Nervous System']
  }
];

export const RECORDED_CLASSES: YogaClass[] = [
  {
    id: 'rec-1',
    title: 'Introduction to Pranayama',
    instructor: 'Pawan Deep Negi',
    level: 'Beginner',
    duration: '20 min',
    type: 'Meditation',
    focus: ['Breath', 'Calm']
  },
  {
    id: 'rec-2',
    title: 'Core Stability Sequence',
    instructor: 'Aradhna Uniyal',
    level: 'Intermediate',
    duration: '35 min',
    type: 'Vinyasa',
    focus: ['Strength', 'Posture']
  },
  {
    id: 'rec-3',
    title: 'Morning Neck & Shoulder Care',
    instructor: 'Pawan Deep Negi',
    level: 'All',
    duration: '15 min',
    type: 'Mobility',
    focus: ['Desk-Workers', 'Pain-Relief']
  },
  {
    id: 'rec-4',
    title: 'Traditional Hatha Primary Series',
    instructor: 'Aradhna Uniyal',
    level: 'All',
    duration: '90 min',
    type: 'Hatha',
    focus: ['Tradition', 'Full-Body']
  },
  {
    id: 'rec-5',
    title: 'Meditation for High Pressure',
    instructor: 'Pawan Deep Negi',
    level: 'All',
    duration: '12 min',
    type: 'Meditation',
    focus: ['Focus', 'Stress']
  },
  {
    id: 'rec-6',
    title: 'Hip Opening Intensive',
    instructor: 'Aradhna Uniyal',
    level: 'Intermediate',
    duration: '45 min',
    type: 'Vinyasa',
    focus: ['Flexibility', 'Release']
  }
];

export const INSTRUCTORS: Instructor[] = [
  {
    id: 'pawan-negi',
    name: 'Pawan Deep Negi',
    role: 'Lead Yoga Instructor & Head of Yogic Curriculum',
    lineage: 'Rishikesh (Dehradun), India',
    bio: 'Pawan is a dedicated yoga trainer from Rishikesh passionate about helping people improve overall wellness and quality of life. He creates personalized yoga practices that support strength, mobility, breath awareness, and mindful living for teens, adults, and seniors.',
    contact: {
      phone: '+91 844 577 2880',
      email: 'pawanraj.negi85@gmail.com'
    },
    specialties: ['Hatha & Ashtanga Yoga', 'Vinyasa / Power Flow', 'Breath Awareness', 'Adjustment & Alignment', 'Mantra & Meditation', 'Strength & Mobility'],
    education: [
      'MA in Yoga — Uttarakhand Sanskrit University',
      'Bachelor of Science in Education',
      'Certified Yoga Instructor & TTC Trainer'
    ],
    experience: [
      '2023–Present: Adishakti Yogashala & Rama School of Yoga',
      '2021–2023: Rishikesh Yoga Flow, Siddhi Yoga & Triguna Yoga',
      '2019–2021: Freelance Yoga Trainer'
    ]
  },
  {
    id: 'aradhna-uniyal',
    name: 'Aradhna Uniyal',
    role: 'Content Creator & Visual Wellness Curator',
    lineage: 'Rishikesh, Uttarakhand, India',
    bio: 'Aradhna is a seasoned yoga practitioner rooted in the yogic traditions of Rishikesh. With over a decade of personal practice and deep cultural experience, she brings thoughtful insight and grounded guidance to each session, helping learners grow in strength, calm, and well-being.',
    contact: {
      phone: '+91 989 742 5945',
      email: 'uniylaradhna7@gmail.com'
    },
    social: {
      instagram: '@aradhnayoga',
      youtube: '@Aradhnayoga'
    },
    specialties: ['Traditional Hatha Yoga', 'Ashtanga Vinyasa', 'Yoga for Well-Being', 'Yogic Lifestyle Integration', 'Breath & Mind Awareness', 'Hindi & English Support'],
    education: [
      'B.A. in Yoga (ongoing) — Uttarakhand Sanskrit University',
      'Senior Secondary — DSB International Public School'
    ],
    achievements: [
      '2nd place — State Level Yogasana Championship',
      '300-hour Yoga TTC team member',
      '10+ years of yoga practice'
    ]
  }
];

export const PRICING_TIERS_INR: PricingTier[] = [
  {
    name: 'Monthly Subscription',
    price: '₹999',
    frequency: '/month',
    features: [
      'Access to all live classes',
      'Weekly community check-ins',
      'Cancel anytime',
      
    ],
    isRecommended: false,
    buttonText: 'Subscribe Now'
  },
  {
    name: 'Full Course (6 Months)',
    price: '₹4,499',
    frequency: 'one-time',
    features: [
      'Everything in Monthly',

      'Priority support',
      'Save ₹1,495 (25% off)'
    ],
    isRecommended: true,
    buttonText: 'Enroll Now'
  }
];

export const PRICING_TIERS_USD: PricingTier[] = [
  {
    name: 'Monthly Subscription',
    price: '$49',
    frequency: '/month',
    features: [
      'Access to all live classes',
      'Weekly community check-ins',
      'Cancel anytime',
   
    ],
    isRecommended: false,
    buttonText: 'Subscribe Now'
  },
  {
    name: 'Full Course (6 Months)',
    price: '$219',
    frequency: 'one-time',
    features: [
      'Everything in Monthly',
     
      'Personalized adjustment plan',
      'Priority support',
      'Save $45 (15% off)'
    ],
    isRecommended: true,
    buttonText: 'Enroll Now'
  }
];

// Default to INR for backward compatibility
export const PRICING_TIERS = PRICING_TIERS_INR;
