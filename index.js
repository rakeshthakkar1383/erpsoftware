const http = require('http');

const PORT = process.env.PORT || 4000;

const requestHandler = (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('ERP Software starter app is running.');
};

const server = http.createServer(requestHandler);

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
