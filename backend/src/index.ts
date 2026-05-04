import { createServer } from './app';

const port = process.env.PORT || 4000;

const server = createServer();

server.listen(port, () => {
  console.log(`🚀 Backend listening on http://localhost:${port}`);
});
