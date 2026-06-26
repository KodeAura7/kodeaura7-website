import { getMyContacts } from '../services/customerService.js';
import { getSubscriptionStatus, subscribe, unsubscribeByEmail } from '../services/newsletterService.js';

export async function myContacts(request, response) {
  const contacts = await getMyContacts(request.user.email);
  response.status(200).json(contacts);
}

export async function newsletterStatus(request, response) {
  const status = await getSubscriptionStatus(request.user.email);
  response.status(200).json(status);
}

export async function newsletterSubscribe(request, response) {
  await subscribe({ email: request.user.email });
  response.status(200).json({ subscribed: true });
}

export async function newsletterUnsubscribe(request, response) {
  await unsubscribeByEmail(request.user.email);
  response.status(200).json({ subscribed: false });
}
