// lib/init.ts
import { backgroundWorker } from './background-worker';

// Initialize background processes
if (typeof window === 'undefined') { // Only on server
  backgroundWorker.start();
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('Shutting down background worker...');
    backgroundWorker.stop();
  });
  
  process.on('SIGINT', () => {
    console.log('Shutting down background worker...');
    backgroundWorker.stop();
  });
}

export { backgroundWorker };
