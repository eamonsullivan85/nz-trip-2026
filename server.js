// Minimal zero-dependency web server for the NZ Trip 2026 itinerary.
// Serves the self-contained index.html (images are embedded) on Railway's $PORT.
const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 3000;
const html = fs.readFileSync(path.join(__dirname, 'index.html'));

http.createServer((req, res) => {
  // Single self-contained page: serve it for any path.
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}).listen(port, () => console.log('NZ Trip 2026 itinerary running on port ' + port));
