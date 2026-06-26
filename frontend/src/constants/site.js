export const site = {
  name: 'KodeAura7',
  email: 'info@kodeaura7.in',
  location: 'Dehradun, Uttarakhand, India',
productionUrl: 'https://kodeaura7.in',
stagingUrl: 'https://staging.kodeaura7.in'
};

export const navLinks = [
  { label: 'Services', to: '/services' },
  { label: 'Portfolio', to: '/portfolio' },
  { label: 'About', to: '/about' }
];

export const services = [
  {
    id: 'web-dev',
    num: '01',
    name: 'Web Development',
    icon: 'solar:code-square-linear',
    accent: '#6366F1',
    light: '#A5B4FC',
    desc: 'Fast, scalable, beautifully engineered web applications — from marketing sites to SaaS dashboards.',
    p1: 'We build fast, scalable, and beautifully designed web applications using modern technology stacks. Every project starts with understanding your users and ends with a product that converts visitors into customers.',
    p2: 'Whether you need a marketing site, a SaaS dashboard, or a full e-commerce platform, our engineering team delivers pixel-perfect results with SEO and performance baked in.',
    features: [
      'Full-Stack Web Applications',
      'Responsive & Mobile-First Design',
      'SEO Optimisation & Core Web Vitals',
      'Progressive Web Apps (PWA)',
      'Headless CMS Integrations',
      'Performance Audits & Refactoring'
    ],
    shortFeatures: ['Full-stack applications', 'SEO & Core Web Vitals', 'Mobile-first responsive design'],
    metrics: [
      { value: '50ms', label: 'Avg Load' },
      { value: '100', label: 'Lighthouse' },
      { value: '5x ROI', label: 'Returns' }
    ]
  },
  {
    id: 'salesforce',
    num: '02',
    name: 'Salesforce CRM',
    icon: 'solar:database-linear',
    accent: '#06B6D4',
    light: '#67E8F9',
    desc: 'Certified Salesforce implementation, customisation, and automation tailored to your exact processes.',
    p1: 'We implement and customise Salesforce to match your exact business processes. From Experience Cloud portals to custom Apex development and automated workflows, we turn Salesforce into your most powerful business tool.',
    p2: 'Our certified Salesforce specialists have delivered CRM systems for legal, financial, and professional services firms — handling everything from setup to ongoing optimisation.',
    features: [
      'Salesforce Experience Cloud Portals',
      'Custom APEX & LWC Development',
      'Sales Cloud & Service Cloud Setup',
      'Automated Flows & Process Builder',
      'Third-Party Integrations & APIs',
      'CRM Audits & Health Checks'
    ],
    shortFeatures: ['Experience Cloud portals', 'Custom Apex & LWC', 'Automated flows & integrations'],
    metrics: [
      { value: '3x Faster', label: 'Pipeline' },
      { value: '60%', label: 'Less Manual' },
      { value: '40% More', label: 'Conversion' }
    ]
  },
  {
    id: 'uiux',
    num: '03',
    name: 'UI/UX Design',
    icon: 'solar:pallete-2-linear',
    accent: '#F43F5E',
    light: '#FDA4AF',
    desc: 'Research-led interfaces that are intuitive, accessible, and built to convert visitors into customers.',
    p1: "Great design isn't just how something looks — it's how it works. We design interfaces that are intuitive, accessible, and built to convert. Every decision we make is grounded in user research and validated through testing.",
    p2: 'From early wireframes to a complete design system, we create the visual foundation your product needs to stand out in competitive markets.',
    features: [
      'User Research & Journey Mapping',
      'Wireframing & Interactive Prototyping',
      'Scalable Design Systems',
      'Accessibility (WCAG) Compliance',
      'Brand Identity & Visual Language',
      'Usability Testing & Iteration'
    ],
    shortFeatures: ['User research & journeys', 'Scalable design systems', 'Prototyping & usability testing'],
    metrics: [
      { value: '2x Higher', label: 'Conversion' },
      { value: '45% Lower', label: 'Bounce Rate' },
      { value: 'NPS 90+', label: 'Satisfaction' }
    ]
  },
  {
    id: 'ads',
    num: '04',
    name: 'Meta & Google Ads',
    icon: 'solar:graph-up-linear',
    accent: '#F59E0B',
    light: '#FCD34D',
    desc: 'Data-driven advertising across Google, Performance Max, and Meta — every rupee tracked and optimised.',
    p1: 'We manage data-driven advertising campaigns across Google Search, Performance Max, Meta (Facebook & Instagram), and beyond. Every rupee of your ad spend is tracked, tested, and optimised for maximum return.',
    p2: "Our campaigns aren't set-and-forget — they're actively managed, A/B tested, and continually refined as we gather conversion data specific to your audience.",
    features: [
      'Google Search & Performance Max',
      'Meta (Facebook & Instagram) Ads',
      'Social Media Retargeting',
      'Conversion Rate Optimisation',
      'Monthly Performance Reporting',
      'Landing Page Strategy & Design'
    ],
    shortFeatures: ['Search & Performance Max', 'Meta & Instagram campaigns', 'Conversion optimisation'],
    metrics: [
      { value: '4x ROAS', label: 'Average' },
      { value: '35% Lower', label: 'CPC' },
      { value: '50L+', label: 'Managed Spend' }
    ]
  }
];

export const tech = [
  { label: 'HTML5', icon: 'solar:code-square-linear' },
  { label: 'CSS3', icon: 'solar:document-text-linear' },
  { label: 'Tailwind CSS', icon: 'solar:wind-linear' },
  { label: 'JavaScript', icon: 'solar:programming-linear' },
  { label: 'Salesforce', icon: 'solar:cloud-linear' },
  { label: 'AWS', icon: 'solar:server-linear' },
  { label: 'Figma', icon: 'solar:pen-new-square-linear' },
  { label: 'React', icon: 'solar:atom-linear' }
];
