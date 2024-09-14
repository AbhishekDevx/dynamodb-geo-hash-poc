export const lambdaResponse = (statusCode, body) => {
    const response = {
      statusCode,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "*",
      },
      body: JSON.stringify(body),
    };
    return response;
  };