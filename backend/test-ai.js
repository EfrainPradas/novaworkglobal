import http from 'http';

const options = {
  hostname: 'localhost',
  port: 5001,
  path: '/api/ai/generate-accomplishments',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer dummy'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('BODY:', data);
  });
});

req.on('error', (e) => console.error('Error:', e.message));

req.write(JSON.stringify({
  challenge: 'Some very long string explaining challenge',
  result: 'Some very long string explaining the result attained'
}));

req.end();
