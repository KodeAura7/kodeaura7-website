import { subscribe } from '../services/newsletterService.js';

export async function postNewsletter(request, response) {
  const record = await subscribe(request.body);
  response.status(201).json({ message: 'Newsletter subscription saved.', data: record });
}
