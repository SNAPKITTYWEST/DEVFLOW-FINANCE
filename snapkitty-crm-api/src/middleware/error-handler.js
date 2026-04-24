function getStatusCode(error) {
  if (error.statusCode) {
    return error.statusCode;
  }

  if (error.code === "P2002") {
    return 409;
  }

  return 500;
}

function getMessage(error) {
  if (error.code === "P2002") {
    return "A record with the same unique value already exists.";
  }

  return error.message || "Internal server error.";
}

function notFoundHandler(req, res) {
  res.status(404).json({
    error: `Route ${req.method} ${req.originalUrl} was not found.`
  });
}

function errorHandler(error, req, res, next) {
  const statusCode = getStatusCode(error);

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json({
    error: getMessage(error),
    details: error.details || undefined
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
};
