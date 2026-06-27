import { getPageContent, setPageContent } from '../services/pageContentService.js';

export async function publicGetPage(req, res) {
  const content = await getPageContent(req.params.page);
  if (!content) return res.status(404).json({ message: 'Page not found.' });
  res.status(200).json(content);
}

export async function adminGetPage(req, res) {
  const content = await getPageContent(req.params.page);
  if (!content) return res.status(404).json({ message: 'Page not found.' });
  res.status(200).json(content);
}

export async function adminSetPage(req, res) {
  const ALLOWED = ['about', 'branding'];
  if (!ALLOWED.includes(req.params.page)) {
    return res.status(400).json({ message: 'Unknown page.' });
  }
  const result = await setPageContent(req.params.page, req.body);
  res.status(200).json(result);
}
