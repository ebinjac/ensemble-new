// lib/background-worker.ts
import { processEmailQueue } from './email-queue-processor';

class BackgroundWorker {
  private interval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private consecutiveErrors = 0;
  private maxConsecutiveErrors = 5;

  start() {
    if (this.isRunning) return;
    
    console.log('🚀 [WORKER] Starting background email worker...');
    this.isRunning = true;
    this.consecutiveErrors = 0;
    
    // Process queue every 2 minutes
    this.interval = setInterval(async () => {
      try {
        await this.processQueue();
        this.consecutiveErrors = 0; // Reset on success
      } catch (error) {
        this.consecutiveErrors++;
        console.error(`❌ [WORKER] Background worker error (${this.consecutiveErrors}/${this.maxConsecutiveErrors}):`, error);
        
        // Stop worker if too many consecutive errors
        if (this.consecutiveErrors >= this.maxConsecutiveErrors) {
          console.error(`❌ [WORKER] Too many consecutive errors, stopping worker`);
          this.stop();
        }
      }
    }, 2 * 60 * 1000); // 2 minutes
    
    // Also process immediately on start
    setTimeout(() => this.processQueue(), 5000); // Wait 5 seconds after app start
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    console.log('⏹️ [WORKER] Background email worker stopped');
  }

  private async processQueue() {
    try {
      console.log('🔄 [WORKER] Worker triggering queue processing...');
      await processEmailQueue();
      console.log('✅ [WORKER] Queue processing completed successfully');
    } catch (error) {
      console.error('❌ [WORKER] Queue processing failed:', error);
      throw error; // Re-throw to trigger consecutive error counting
    }
  }

  isWorkerRunning() {
    return this.isRunning;
  }

  getStats() {
    return {
      isRunning: this.isRunning,
      consecutiveErrors: this.consecutiveErrors,
      maxConsecutiveErrors: this.maxConsecutiveErrors
    };
  }
}

export const backgroundWorker = new BackgroundWorker();
