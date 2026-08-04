CREATE TABLE IF NOT EXISTS page_content (
  page VARCHAR(50) PRIMARY KEY,
  content JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO page_content (page, content) VALUES ('about', '{
  "hero": {
    "eyebrow": "About KodeAura7",
    "title": "We Engineer",
    "gradient": "Digital Growth",
    "description": "KodeAura7 is a full-service digital technology agency, India. We partner with businesses to design, build, and scale their digital infrastructure."
  },
  "story": {
    "subtitle": "Our Story",
    "title": "Built From Passion. Driven by Purpose.",
    "paragraphs": [
      "KodeAura7 was founded with one conviction - that great technology should be accessible to every ambitious business, not just the Fortune 500.",
      "Today, we are a team of developers, designers, CRM specialists, and digital marketers who obsess over the details that turn a good product into a great one.",
      "Our edge is our breadth. We think in systems - how your website, your CRM, your ads, and your automations work together to create compounding growth."
    ],
    "stats": [
      {"value": "8+", "label": "DIGITAL SERVICES"},
      {"value": "100%", "label": "CUSTOM SOLUTIONS"},
      {"value": "24/7", "label": "DEDICATED SUPPORT"}
    ]
  },
  "values": {
    "title": "What Drives Us",
    "subtitle": "Four principles we refuse to compromise on.",
    "items": [
      {"title": "Craft Over Speed", "icon": "solar:palette-linear", "accent": "#6366F1", "desc": "We do not ship fast and fix later. Every pixel and every line of code is intentional."},
      {"title": "Transparent Partnership", "icon": "solar:hand-shake-linear", "accent": "#06B6D4", "desc": "No black boxes. You get weekly updates, clear timelines, and honest communication."},
      {"title": "Systems Thinking", "icon": "solar:cpu-bolt-linear", "accent": "#8B5CF6", "desc": "We design every solution to work as part of your wider growth ecosystem."},
      {"title": "Results, Not Deliverables", "icon": "solar:graph-up-linear", "accent": "#F59E0B", "desc": "Our success metric is your ROI - not the number of pages or features shipped."}
    ]
  },
  "tech": {
    "title": "Our Technology Stack",
    "subtitle": "Built with tools that scale.",
    "items": [
      {"label": "HTML5", "icon": "solar:code-square-linear"},
      {"label": "CSS3", "icon": "solar:document-text-linear"},
      {"label": "Tailwind CSS", "icon": "solar:wind-linear"},
      {"label": "JavaScript", "icon": "solar:programming-linear"},
      {"label": "Salesforce", "icon": "solar:cloud-linear"},
      {"label": "AWS", "icon": "solar:server-linear"},
      {"label": "Figma", "icon": "solar:pen-new-square-linear"},
      {"label": "React", "icon": "solar:atom-linear"}
    ]
  },
  "cta": {
    "title": "Ready to build something extraordinary?",
    "body": "Book a free strategy session. No commitment."
  }
}') ON CONFLICT (page) DO NOTHING;
