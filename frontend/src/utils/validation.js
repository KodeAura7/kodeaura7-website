export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validateContact(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = 'Name is required.';
  if (!isEmail(values.email)) errors.email = 'A valid email is required.';
  if (!values.service.trim()) errors.service = 'Please share the service you need.';
  if (!values.message.trim()) errors.message = 'Project details are required.';
  return errors;
}

export function validateNewsletter(values) {
  return isEmail(values.email) ? {} : { email: 'A valid email is required.' };
}
