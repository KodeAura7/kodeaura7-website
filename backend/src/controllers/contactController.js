import { createContactMessage } from '../services/contactService.js';

export async function postContact(request, response) {
  const record = await createContactMessage(request.body);
  response.status(201).json({ message: 'Contact request received.', data: record });
}
