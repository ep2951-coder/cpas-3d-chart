/* exports.handler = async () => {
  const response = await fetch('https://ENDPOINT_IT_GIVES_YOU', {
    headers: {
      'Authorization': `Bearer ${process.env.CPAS_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  const data = await response.json();
  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(data)
  };
}; */
