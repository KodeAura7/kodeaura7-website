import {
  getPublicTestimonials,
  getMyTestimonials,
  submitTestimonial,
  updateMyTestimonial,
  deleteMyTestimonial,
  listAllTestimonials,
  setVisibility,
  updateOrder
} from '../services/testimonialsService.js';

export async function publicList(_request, response) {
  const items = await getPublicTestimonials();
  response.status(200).json(items);
}

// Returns array — 0 or 1 for customers, many for admins
export async function myTestimonials(request, response) {
  const items = await getMyTestimonials(request.user.sub);
  response.status(200).json(items);
}

export async function submit(request, response) {
  const item = await submitTestimonial(request.user.sub, request.body, request.user);
  response.status(201).json(item);
}

export async function updateOwn(request, response) {
  const item = await updateMyTestimonial(request.params.id, request.user.sub, request.body, request.user);
  response.status(200).json(item);
}

export async function deleteOwn(request, response) {
  await deleteMyTestimonial(request.params.id, request.user.sub);
  response.status(204).end();
}

export async function adminList(_request, response) {
  const items = await listAllTestimonials();
  response.status(200).json(items);
}

export async function updateVisibility(request, response) {
  const result = await setVisibility(request.params.id, request.body.visible, request.user.sub);
  response.status(200).json(result);
}

export async function updateSortOrder(request, response) {
  const result = await updateOrder(request.params.id, request.body.sort_order);
  response.status(200).json(result);
}
