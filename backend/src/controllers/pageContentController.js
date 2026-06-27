import { getPageContent, getPageHistory, setPageContent } from '../services/pageContentService.js';

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
  const userId = req.user?.id ?? null;
  const userName = req.user?.name ?? req.user?.email ?? null;
  const result = await setPageContent(req.params.page, req.body, userId, userName);
  res.status(200).json(result);
}

export async function adminGetPageHistory(req, res) {
  const ALLOWED = ['about', 'branding'];
  if (!ALLOWED.includes(req.params.page)) {
    return res.status(400).json({ message: 'Unknown page.' });
  }
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  const history = await getPageHistory(req.params.page, limit);
  res.status(200).json(history);
}
