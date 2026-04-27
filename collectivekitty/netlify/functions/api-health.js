exports.handler = async () => {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify({
      status: "ok",
      version: "2.2.0",
      timestamp: new Date().toISOString(),
      service: "Bifrost Core"
    })
  };
};
