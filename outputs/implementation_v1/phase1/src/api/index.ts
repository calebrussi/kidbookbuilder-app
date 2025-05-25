import { app } from './server';

// Set the port
const PORT = process.env.PORT || 3000;

// Start the server
app.listen(PORT, () => {
  console.log(`Kid Book Builder API server is running on port ${PORT}`);
  console.log(`API documentation available at http://localhost:${PORT}/api/docs`);
}); 