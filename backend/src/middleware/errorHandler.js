export function notFound(_request, _response, next) {
  const error = new Error('Route not found.');
  error.status = 404;
  next(error);
}

export function errorHandler(error, _request, response, next) {
  void next;
  const status = error.status || 500;
  if (status >= 500) {
    console.error(error);
  }
  response.status(status).json({
    message: status >= 500 ? 'Internal server error.' : error.message
  });
}
