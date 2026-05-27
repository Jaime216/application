const app = require('./app');
const { connectMongo } = require('./mongoose');

const port = process.env.PORT || 3001;

async function startServer() {
  try {
    try {
      await connectMongo();
    } catch (mongoErr) {
      console.warn('Warning: could not connect to MongoDB, continuing without DB:', mongoErr.message);
    }

    app.listen(port, () => {
      console.log(`Backend running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start backend:', error.message);
    process.exit(1);
  }
}

startServer();