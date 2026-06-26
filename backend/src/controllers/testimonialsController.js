import {
  getPublicTestimonials,
  getUserTestimonial,
  listAllTestimonials,
  setVisibility,
  submitTestimonial,
  updateOrder
} from '../services/testimonialsService.js';

export async function publicList(_request, response) {
  const items = await getPublicTestimonials();
  response.status(200).json(items);
}

export async function myTestimonial(request, response) {
  const item = await getUserTestimonial(request.user.sub);
  response.status(200).json(item);
}

export async function submit(request, response) {
  const item = await submitTestimonial(request.user.sub, request.body);
  response.status(200).json(item);
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
