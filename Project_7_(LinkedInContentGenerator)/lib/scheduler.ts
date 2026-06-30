import cron, { ScheduledTask } from 'node-cron';
import { runPipeline } from './pipeline';

let schedulerJob: ScheduledTask | null = null;
let isInitialized = false;

export function startScheduler() {
  if (isInitialized) {
    console.log('Scheduler already initialized.');
    return;
  }
  isInitialized = true;
  console.log('Starting daily 09:00 AM Cron Scheduler...');

  // '0 9 * * *' fires at 9:00 AM every day
  schedulerJob = cron.schedule('0 9 * * *', async () => {
    console.log('Cron triggered: starting scheduled content forge pipeline.');
    try {
      await runPipeline();
    } catch (error) {
      console.error('Error running content pipeline in cron job:', error);
    }
  });

  console.log('Cron scheduler successfully registered.');
}

/**
 * Calculates the next cron run time (daily at 9:00 AM)
 */
export function getNextRunTime(): string {
  const now = new Date();
  const nextRun = new Date();
  nextRun.setHours(9, 0, 0, 0);

  // If we already passed 9 AM today, the next run is tomorrow at 9 AM
  if (now.getTime() >= nextRun.getTime()) {
    nextRun.setDate(nextRun.getDate() + 1);
  }

  return nextRun.toISOString();
}
export function getCronSchedule(): string {
  return '0 9 * * *';
}
export function isSchedulerRunning(): boolean {
  return isInitialized && schedulerJob !== null;
}
