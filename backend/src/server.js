const app = require('./app');

const port = process.env.PORT || 3001;

async function startServer() {
  try {
    app.listen(port, () => {
      console.log(`Backend running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start backend:', error.message);
    process.exit(1);
  }
}

startServer();