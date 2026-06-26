import { useState } from 'react';

export function useForm(initialValues, validate, onSubmit) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setValues((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setStatus('loading');
    try {
      await onSubmit(values);
      setStatus('success');
      setValues(initialValues);
    } catch (error) {
      setStatus(error.message || 'error');
    }
  };

  return { values, errors, status, handleChange, handleSubmit };
}
