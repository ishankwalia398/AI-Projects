export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('Next.js Server Boot: Initializing Cron Scheduler...');
    const { startScheduler } = await import('./lib/scheduler');
    startScheduler();
  }
}
