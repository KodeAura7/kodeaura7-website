INSERT INTO page_content (page, content) VALUES ('branding', '{
  "name": "KodeAura7",
  "tagline": "We Build the Digital Future.",
  "logos": {
    "header": {"url": "", "alt": "KodeAura7"},
    "footer": {"url": "", "alt": "KodeAura7"},
    "universal": {"url": "", "alt": "KodeAura7"}
  },
  "colors": {
    "primary": "#6366F1",
    "secondary": "#06B6D4",
    "accent": "#8B5CF6"
  }
}') ON CONFLICT (page) DO NOTHING;
