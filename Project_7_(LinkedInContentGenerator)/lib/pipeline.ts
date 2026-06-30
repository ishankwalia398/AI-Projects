import { runAgent1TopicGenerator, runAgent2ContentWriter, getTodayDateString } from './agents';
import { excelManager } from './excelManager';

export interface PipelineState {
  isRunning: boolean;
  currentStep: string;
  lastRunTime?: string;
}

export const pipelineState: PipelineState = {
  isRunning: false,
  currentStep: 'Idle',
  lastRunTime: undefined,
};

export async function runPipeline(): Promise<void> {
  if (pipelineState.isRunning) {
    console.log('Pipeline is already running. Skip request.');
    return;
  }

  pipelineState.isRunning = true;
  pipelineState.lastRunTime = new Date().toISOString();

  const today = getTodayDateString();
  console.log(`Starting ContentForge pipeline for date: ${today}`);

  try {
    // Step 1: Topic Generator
    pipelineState.currentStep = 'Agent 1 - Generating Topic';
    console.log('Running Agent 1 (Topic Generator)...');
    await runAgent1TopicGenerator();

    // Step 2: Content Writer
    pipelineState.currentStep = 'Agent 2 - Writing Post';
    console.log('Running Agent 2 (Content Writer)...');
    await runAgent2ContentWriter();

    console.log('Pipeline execution successfully finished.');
    pipelineState.currentStep = 'Idle';
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    console.error('Pipeline run failed:', error);
    pipelineState.currentStep = `Error: ${errorMsg}`;

    // Mark row status as Error
    try {
      await excelManager.updateRow(
        today,
        {
          status: 'Error',
          errorLog: `Pipeline Error: ${errorMsg}`,
        },
        'Pipeline Orchestrator'
      );
    } catch (sheetErr) {
      console.error('Failed to update sheet with error log:', sheetErr);
    }
  } finally {
    pipelineState.isRunning = false;
  }
}
