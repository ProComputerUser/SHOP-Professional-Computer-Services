export const HELP_ADVICE_DATA = {
  title: 'Tech Advice, Buying Guides & System Diagnostics',
  tagline: 'Expert hardware curation, bespoke matchmaker tools, and verified buying strategies.',
  articles: [
    {
      id: 'art-1',
      title: 'DDR5 vs DDR4: Is the Latency Penalty Worth the Bandwidth Boost?',
      summary: 'A deep-dive benchmark on rendering pipelines and AAA titles under modern memory architectures.',
      category: 'Memory & Hardware',
      readTime: '6 min read'
    },
    {
      id: 'art-2',
      title: 'OLED vs Mini-LED Displays: Color Accuracy for Creative Studios',
      summary: 'Which panel technology offers the best true HDR color mastering without aggressive ABL dimming.',
      category: 'Display Technologies',
      readTime: '8 min read'
    },
    {
      id: 'art-3',
      title: 'Choosing the Right Enterprise Storage: PCIe 5.0 vs Enterprise U.2 SSDs',
      summary: 'How IOPS bottlenecks manifest in heavy virtualization tasks and relational databases.',
      category: 'Enterprise Storage',
      readTime: '5 min read'
    }
  ],
  faqs: [
    {
      q: 'Do you offer custom enterprise imaging and BIOS pre-configuration?',
      a: 'Yes, our enterprise deployments can include custom golden OS image loading, domain provisioning, and asset tag recording prior to dispatch.'
    },
    {
      q: 'What is the standard turnaround time for hardware diagnostic appointments?',
      a: 'Most standard field audits and express diagnostics are fulfilled within 24 to 48 business hours across supported service zones.'
    },
    {
      q: 'Can academic faculty and students combine educational discounts with bulk promotions?',
      a: 'Educational pricing is already tiered at maximum academic subvention rates; our sales consultants can provide bespoke composite proposals for multi-room orders.'
    }
  ]
};

export const BUSINESS_DATA = {
  title: 'Enterprise IT Fleet & B2B Volume Procurement',
  tagline: 'Hardware provisioning, dedicated SLA contracts, and commercial lease options for modern teams.',
  heroImage: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80',
  benefits: [
    { title: 'Tax-Exempt Volume Pricing', desc: 'Direct corporate discounts scaled with purchase volumes from 10 to 500+ units.' },
    { title: 'Advance Hardware Replacement', desc: 'Next-business-day hot-swap guarantee minimizing employee downtime.' },
    { title: 'Flexible Leasing & Net-30 Terms', desc: 'Dedicated corporate account manager with simplified purchase orders.' },
    { title: 'Custom OS Pre-Loading', desc: 'Zero-touch deployment with customized enterprise corporate software stacks.' }
  ]
};

export const SCHOOLS_DATA = {
  title: 'Academic Hardware Programs & Institutional Subventions',
  tagline: 'Empowering students, universities, and K-12 classrooms with certified digital learning infrastructure.',
  heroImage: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80',
  programs: [
    { title: 'Higher Education Student Pass', discount: '15% Off Hardware', eligibility: 'Enrolled students with verified .edu or academic email.' },
    { title: 'K-12 Class Pack Grant', discount: 'Up to 25% Off', eligibility: 'Primary and secondary institutions purchasing 15+ student devices.' },
    { title: 'Faculty Research Grant Support', discount: 'Custom Subvention', eligibility: 'Department researchers requiring high-performance computing hardware.' }
  ],
  educationLaptops: [
    {
      name: 'EduBook Pro 14 (Student Edition)',
      desc: 'Ruggedized chassis, spill-resistant keyboard, 12-hour battery life and fast NVMe storage.',
      price: 549
    },
    {
      name: 'CampusStation 15 Creator',
      desc: 'High color-accuracy display with discrete graphics for engineering, CAD, and multimedia coursework.',
      price: 899
    }
  ]
};

export const SERVICES_DATA = {
  title: 'Professional IT Engineering & Diagnostic Services',
  tagline: 'Hardware diagnostics, custom acoustic system assembly, Wi-Fi mesh planning, and secure data recovery.',
  heroImage: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=1200&q=80',
  offerings: [
    {
      id: 'srv-1',
      title: 'Premium Shield Warranty Plan',
      description: 'Comprehensive 3-year accidental damage, surge, and rapid dispatch coverage.',
      price: '$149 / device',
      popular: true
    },
    {
      id: 'srv-2',
      title: 'Acoustic Custom PC Building & Wiring',
      description: 'Precision component assembly, custom cable management, thermal compound tuning, and 24h stress test.',
      price: '$199',
      popular: false
    },
    {
      id: 'srv-3',
      title: 'Full Home / Office Wi-Fi Audit & Mesh Deployment',
      description: 'Spectrum analysis, dead-zone mapping, and gigabit access point physical deployment.',
      price: '$249',
      popular: false
    },
    {
      id: 'srv-4',
      title: 'Express Data Recovery & Security Sanctum',
      description: 'Forensic data extraction from damaged NVMe/HDD storage with cryptographically secure transfer.',
      price: 'From $129',
      popular: false
    }
  ],
  reviews: [
    { name: 'David M. (CTO, NexaCorp)', text: 'The enterprise deployment of 40 workstations was seamless and arrived on schedule.' },
    { name: 'Sarah K. (Senior Animator)', text: 'The custom workstation acoustic build is whisper quiet even under 100% render loads.' }
  ]
};
