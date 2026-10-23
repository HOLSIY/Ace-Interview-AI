import {
  CandidateInfo,
  JobInfo,
  InterviewerInfo,
  InterviewType,
  InterviewGoal,
  InterviewIntelligenceProfile,
} from '../types/interview';

export interface PresetProfile {
  id: string;
  label: string;
  roleBadge: string;
  candidate: CandidateInfo;
  interviewer: InterviewerInfo;
  job: JobInfo;
  interviewType: InterviewType;
  interviewGoal: InterviewGoal;
  sampleQuestions: string[];
  mockAnalysis: InterviewIntelligenceProfile;
}

export const PRESET_PROFILES: PresetProfile[] = [
  {
    id: 'fullstack-fintech',
    label: 'Full-Stack Engineer @ PayFlow',
    roleBadge: 'Mid/Senior Full-Stack • Technical Round',
    interviewer: {
      name: 'Marcus Vance',
      role: 'Senior Staff Backend Engineer',
      department: 'Payments & Settlement Infrastructure',
      stage: 'Technical interview',
      professionalBioOrProfile:
        'Focuses on distributed transaction consensus, PostgreSQL concurrency locking, and webhook idempotency. Values direct technical precision, architecture trade-offs, and honesty about scale limitations.',
    },
    candidate: {
      name: 'Alex Rivera',
      rawResume: `Alex Rivera - Full-Stack Software Engineer (3.5 years exp)
Education: B.S. in Computer Science, University of Washington (2021)
Skills: TypeScript, JavaScript, React, Node.js, Express, PostgreSQL, Redis, Docker, REST APIs, GraphQL, Tailwind CSS, Jest, AWS (S3, ECS, RDS).
Work History:
- Software Engineer at LedgerScale (2023 - Present): Engineered real-time transaction reconciliation dashboard in React + Vite, cutting audit time by 40%. Implemented idempotent webhooks and PostgreSQL transaction locking to prevent duplicate payouts.
- Junior Full-Stack Developer at NexaBytes (2021 - 2023): Built customer onboarding workflows, integrated Stripe Elements, implemented JWT auth with refresh token rotation.
Projects:
- MicroLedger: Open-source double-entry bookkeeping engine in TypeScript & Postgres with ACID compliance.
- DevVault: Developer secret rotation CLI tool with AES-256 GCM encryption.
Certifications: AWS Certified Developer Associate.
Languages: English (Fluent), Spanish (Conversational).`,
      education: 'B.S. in Computer Science, University of Washington',
      degree: 'B.S. in Computer Science',
      university: 'University of Washington',
      experience: '3.5 years building transaction dashboards, payment webhooks, and idempotent banking integrations with React & Node.js.',
      internships: 'Software Engineering Intern at CodeCraft (Summer 2020)',
      projects: 'MicroLedger (double-entry bookkeeping engine with Postgres), DevVault (CLI secret manager).',
      skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Redis', 'Docker', 'REST APIs', 'AWS', 'Jest'],
      programmingLanguages: ['TypeScript', 'JavaScript', 'SQL'],
      frameworks: ['React', 'Node.js', 'Express', 'Tailwind CSS'],
      databases: ['PostgreSQL', 'Redis'],
      tools: ['Docker', 'AWS (S3, ECS, RDS)', 'Git', 'Jest'],
      certifications: 'AWS Certified Developer Associate',
      achievements: 'Open source author of MicroLedger (200+ GitHub stars); lowered audit reconciliation time by 40%.',
      languages: 'English (Fluent), Spanish (Conversational)',
    },
    job: {
      title: 'Full-Stack Software Engineer',
      company: 'PayFlow Technologies',
      companyWebsite: 'https://payflow.io',
      companyInfo: 'PayFlow provides next-generation multi-currency payment orchestration and settlement APIs for global digital marketplaces.',
      department: 'Core Settlement Engineering',
      industry: 'Financial Technology / Payments',
      location: 'San Francisco, CA / Remote',
      description: `We are looking for a Full-Stack Software Engineer to build and scale our merchant settlement platform.
Responsibilities:
- Build resilient customer-facing interfaces in React and TypeScript.
- Architect high-availability backend microservices handling millions of transaction events per day.
- Collaborate with compliance and security teams to maintain PCI-DSS compliance.
- Optimize database queries and caching layers in PostgreSQL and Redis.
Requirements:
- 3+ years experience with modern TypeScript/JavaScript, React, and Node.js.
- Solid understanding of relational database concurrency, transactions, and RESTful APIs.
- Experience with distributed system reliability, idempotency, and cloud infrastructure (AWS/GCP).`,
      technologies: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Redis', 'AWS', 'REST APIs', 'Docker'],
      level: 'Mid-Level',
    },
    interviewType: 'Technical',
    interviewGoal: 'Technical questions',
    sampleQuestions: [
      'Can you tell me about yourself and your experience with payment or transaction systems?',
      'How do you handle idempotency when receiving webhooks from payment providers?',
      'Tell me about a time you optimized a slow query or database bottleneck in PostgreSQL.',
      'Have you worked directly with Kubernetes clusters in production?',
      'Why did you choose PostgreSQL over a NoSQL database for your ledger project?',
    ],
    mockAnalysis: {
      candidateSummary: {
        verifiedStrengths: [
          '3.5 years verified hands-on with Node.js, React, and PostgreSQL',
          'Deep practical experience with idempotent webhooks and PostgreSQL transaction locking',
          'Authored MicroLedger double-entry bookkeeping engine with ACID transactions',
        ],
        verifiedLimitations: [
          'No direct hands-on Kubernetes orchestration experience in production',
          'Has not managed enterprise multi-region database replication clusters',
        ],
        evidenceAnchors: [
          'LedgerScale transaction reconciliation system (reduced audit time 40%)',
          'MicroLedger double-entry ledger project with constraint-based idempotency',
        ],
      },
      interviewerPerspective: {
        roleCategory: 'Technical',
        focusPriorities: [
          'Database concurrency and ACID transaction guarantees',
          'Handling duplicate requests and race conditions in financial webhooks',
          'Code clarity, architectural tradeoffs, and performance profiling',
        ],
        likelyEvaluationMindset:
          'Marcus is a senior backend architect who listens for concrete technical implementation and honesty about scale limits. He values candidates who admit when they have not used a tool like Kubernetes rather than bluster.',
      },
      companyUnderstanding: {
        coreNeeds: [
          'Zero-data-loss settlement pipelines',
          'Scalable merchant reconciliation dashboards',
          'High uptime under bursty payment events',
        ],
        industryContext: 'Fintech API orchestration and merchant payout settlements',
        cultureValues: 'High reliability, defensive coding, proactive monitoring',
      },
      positionExpectations: [
        'Build reliable Node.js services with PostgreSQL/Redis caching',
        'Create responsive React interfaces for merchant onboarding',
        'Defend API boundaries with strict input validation and idempotency keys',
      ],
      precompactedContext: `Alex Rivera: 3.5y verified full-stack dev (TS, React, Node.js, Postgres, Redis, AWS). Built reconciliation tools at LedgerScale; created MicroLedger (double-entry ACID bookkeeping). Verified strengths: Idempotent webhooks, Postgres transaction isolation, payment flows. Real gaps: No production Kubernetes clusters; emphasize Docker/ECS depth and honest willingness to ramp up. Interviewer Marcus Vance (Senior Staff Backend Engineer): cares deeply about concurrency, failure modes, and technical precision. Target: PayFlow (merchant settlement orchestration).`,
    },
  },
  {
    id: 'frontend-consumer',
    label: 'Senior Frontend Engineer @ Pulse Interactive',
    roleBadge: 'Senior Frontend • Hiring Manager Round',
    interviewer: {
      name: 'Elena Rostova',
      role: 'Engineering Manager',
      department: 'Consumer Product Experience',
      stage: 'Manager interview',
      professionalBioOrProfile:
        'Focuses on team velocity, design-engineering collaboration, cross-functional ownership, and mentoring. Evaluates candidates on empathy, communication, pragmatic problem solving, and product quality.',
    },
    candidate: {
      name: 'Maya Chen',
      rawResume: `Maya Chen - Senior Frontend Engineer (4 years exp)
Education: B.A. in Computer Science & Interactive Media, UC Davis (2020)
Skills: React, Next.js, TypeScript, Tailwind CSS, Web Performance, Core Web Vitals, State Management (Zustand), Accessibility (a11y), Framer Motion, Jest.
Work History:
- Frontend Engineer at Loomis Digital (2022 - Present): Redesigned core customer shopping experience, driving a 28% uplift in checkout conversion and lowering LCP from 2.8s to 1.1s. Implemented comprehensive design system in Tailwind and Storybook.
- UI Developer at PixelSpark (2020 - 2022): Built interactive dashboards, accessible data tables, and micro-animations for consumer SaaS applications.
Projects:
- FastGrid: Lightweight virtualized table component for rendering 100k+ rows at 60fps.
- PaletteSync: Collaborative color palette generator for UI designers.`,
      education: 'B.A. in Computer Science & Interactive Media, UC Davis',
      degree: 'B.A. in Computer Science & Interactive Media',
      university: 'UC Davis',
      experience: '4 years specialized in user interface engineering, design systems, and frontend performance optimization.',
      projects: 'FastGrid (virtualized 60fps data grid), PaletteSync (collaborative design tool).',
      skills: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Web Performance', 'Zustand', 'Core Web Vitals', 'Accessibility'],
      programmingLanguages: ['TypeScript', 'JavaScript', 'HTML/CSS'],
      frameworks: ['React', 'Next.js', 'Tailwind CSS'],
      databases: ['Local Storage / IndexedDB'],
      tools: ['Storybook', 'Git', 'Jest', 'Playwright', 'Framer Motion'],
      achievements: 'Decreased LCP from 2.8s to 1.1s boosting checkout conversion by 28%. Creator of FastGrid (60fps virtualization).',
      languages: 'English (Fluent), Mandarin (Conversational)',
    },
    job: {
      title: 'Senior Frontend Engineer',
      company: 'Pulse Interactive',
      companyWebsite: 'https://pulseinteractive.app',
      companyInfo: 'Pulse Interactive builds consumer wellness apps with millions of active daily users worldwide.',
      department: 'Web Experience & Core Apps',
      industry: 'Consumer Technology / Digital Health',
      location: 'New York, NY / Remote',
      description: `We are looking for a Senior Frontend Engineer who cares deeply about smooth animations, lightning-fast render performance, and intuitive user experiences.
Key Requirements:
- Deep mastery of modern React, TypeScript, and state management.
- Proven track record optimizing Core Web Vitals and client-side rendering bottlenecks.
- Passion for polished UI and accessibility best practices.`,
      technologies: ['React', 'TypeScript', 'Tailwind CSS', 'Next.js', 'Web Performance'],
      level: 'Senior',
    },
    interviewType: 'Manager',
    interviewGoal: 'Behavioral questions',
    sampleQuestions: [
      'Tell me about a time you had a technical disagreement with a designer or product manager.',
      'How do you approach mentoring junior engineers on your team?',
      'Tell me about your approach to diagnosing and fixing a frontend performance issue.',
      'Why are you looking to leave your current role and join Pulse Interactive?',
    ],
    mockAnalysis: {
      candidateSummary: {
        verifiedStrengths: [
          '4 years verified frontend specialization (React, Next.js, TypeScript, Tailwind)',
          'Proven measurable business impact (lowered LCP from 2.8s to 1.1s, boosting checkout by 28%)',
          'Created FastGrid virtualized component demonstrating deep rendering optimization',
        ],
        verifiedLimitations: [
          'No native mobile iOS/Android Swift/Kotlin development experience',
          'Has not managed direct engineering reports or authored backend distributed microservices',
        ],
        evidenceAnchors: [
          'Checkout redesign at Loomis Digital with 28% conversion uplift',
          'FastGrid open-source virtualized 60fps grid',
        ],
      },
      interviewerPerspective: {
        roleCategory: 'Manager/Leadership',
        focusPriorities: [
          'Constructive conflict resolution with designers and product managers',
          'Pragmatic balance between code perfection and user shipping speed',
          'Empathy, communication, ownership, and positive team dynamics',
        ],
        likelyEvaluationMindset:
          'Elena is an engineering manager evaluating team fit, ownership, and communication clarity. She wants to see how Maya handles real-world compromises and collaborates across disciplines.',
      },
      companyUnderstanding: {
        coreNeeds: [
          'Ultra-smooth, accessible mobile web interfaces',
          'Rapid feature iteration with high UX polish',
          'Strong frontend leadership to set standards for junior developers',
        ],
        industryContext: 'High-retention consumer digital wellness platforms',
        cultureValues: 'User delight, empathy, collaborative cross-functional ownership',
      },
      positionExpectations: [
        'Lead core web performance and Core Web Vitals optimization',
        'Partner closely with Figma designers to build reusable component tokens',
        'Ensure 60fps animations and accessible markup across all devices',
      ],
      precompactedContext: `Maya Chen: 4y frontend specialist (React, Next.js, TS, Tailwind, Core Web Vitals, a11y). Improved LCP to 1.1s at Loomis Digital (28% conversion boost); created FastGrid (60fps virtualization). Real strengths: Deep UI responsiveness, performance profiling, design systems. Real gaps: No backend microservices or native mobile Swift/Kotlin; emphasize high-fidelity web apps and clean API contracts. Interviewer Elena Rostova (Engineering Manager): values team communication, conflict resolution, ownership, and user empathy. Target: Pulse Interactive (consumer wellness app).`,
    },
  },
];
