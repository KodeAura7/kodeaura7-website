import { getMyContacts } from '../services/customerService.js';

export async function myContacts(request, response) {
  const contacts = await getMyContacts(request.user.email);
  response.status(200).json(contacts);
}
