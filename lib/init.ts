
// Initialize application on startup
import { restoreAllSessions } from './whatsapp';

let initialized = false;

export async function initializeApp() {
  if (initialized) {
    return;
  }

  console.log('[Init] Initializing application...');
  
  try {
    // Restore WhatsApp sessions
    await restoreAllSessions();
    
    initialized = true;
    console.log('[Init] Application initialized successfully');
  } catch (error) {
    console.error('[Init] Error initializing application:', error);
  }
}

// Auto-initialize when module is imported
if (typeof window === 'undefined') {
  // Only run on server side
  initializeApp().catch(console.error);
}
