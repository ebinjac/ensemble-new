// ✅ New: Request/Response logging
export function logAuthEvent(event: string, details: any) {
    const logData = {
      timestamp: new Date().toISOString(),
      event,
      ...details
    };
  
    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AUTH] ${event}:`, logData);
    }
  
    // In production, you might want to send to a logging service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to logging service
      // sendToLoggingService(logData);
    }
  }
  
  export function logAuthError(event: string, error: Error, context?: any) {
    logAuthEvent(`${event}_ERROR`, {
      error: error.message,
      stack: error.stack,
      ...context
    });
  }
  