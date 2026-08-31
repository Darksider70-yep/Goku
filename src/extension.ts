import * as vscode from 'vscode';
import { showKamehamehaAnimation } from './animationPanel';

/** Configuration constants */
const COOLDOWN_MS = 5000;
const DEFAULT_DURATION_MS = 4500;
const ACTIVATION_MESSAGE = '🐉 Goku is ready! Run code successfully to see the Kamehameha!';

let lastTriggerTime = 0;

/**
 * Activates the Goku Kamehameha extension.
 * Registers commands and event listeners for animation triggers.
 * @param context - VS Code extension context
 */
export function activate(context: vscode.ExtensionContext): void {
  console.log('🐉 Goku Kamehameha extension activated!');

  try {
    // Register manual trigger command
    const triggerCommand = vscode.commands.registerCommand('goku.triggerKamehameha', () => {
      triggerAnimation(context);
    });
    context.subscriptions.push(triggerCommand);

    // Listen for task completion
    const taskListener = vscode.tasks.onDidEndTaskProcess((event) => {
      handleTaskCompletion(context, event);
    });
    context.subscriptions.push(taskListener);

    // Listen for debug session completion
    const debugListener = vscode.debug.onDidTerminateDebugSession((_session) => {
      handleDebugSessionEnd(context);
    });
    context.subscriptions.push(debugListener);

    // Show activation message
    vscode.window.showInformationMessage(ACTIVATION_MESSAGE);
  } catch (error) {
    console.error('🐉 Error during extension activation:', error);
    vscode.window.showErrorMessage('Failed to activate Goku Kamehameha extension');
  }
}

/**
 * Handles task completion events.
 * @param context - VS Code extension context
 * @param event - Task process completion event
 */
function handleTaskCompletion(
  context: vscode.ExtensionContext,
  event: vscode.TaskProcessEndEvent
): void {
  const config = vscode.workspace.getConfiguration('goku');
  
  if (!config.get<boolean>('enabled', true)) {
    return;
  }
  
  if (!config.get<boolean>('triggerOnTask', true)) {
    return;
  }

  if (event.exitCode === 0) {
    console.log(`🐉 Task "${event.execution.task.name}" succeeded! Kamehameha!`);
    triggerAnimation(context);
  } else {
    console.log(`🐉 Task "${event.execution.task.name}" failed with exit code ${event.exitCode}`);
  }
}

/**
 * Handles debug session termination.
 * @param context - VS Code extension context
 */
function handleDebugSessionEnd(context: vscode.ExtensionContext): void {
  const config = vscode.workspace.getConfiguration('goku');
  
  if (!config.get<boolean>('enabled', true)) {
    return;
  }
  
  if (!config.get<boolean>('triggerOnDebug', true)) {
    return;
  }

  console.log('🐉 Debug session ended! Kamehameha!');
  triggerAnimation(context);
}

/**
 * Triggers the Kamehameha animation with cooldown protection.
 * @param context - VS Code extension context
 */
function triggerAnimation(context: vscode.ExtensionContext): void {
  const now = Date.now();
  if (now - lastTriggerTime < COOLDOWN_MS) {
    console.log('🐉 Kamehameha on cooldown for', (COOLDOWN_MS - (now - lastTriggerTime)) / 1000, 'seconds');
    return;
  }
  lastTriggerTime = now;

  try {
    const config = vscode.workspace.getConfiguration('goku');
    const duration = config.get<number>('animationDuration', DEFAULT_DURATION_MS);
    const soundEnabled = config.get<boolean>('soundEnabled', true);

    // Validate configuration
    if (duration < 1000 || duration > 10000) {
      console.warn(`🐉 Animation duration out of range: ${duration}ms. Using default.`);
      showKamehamehaAnimation(context, DEFAULT_DURATION_MS, soundEnabled);
    } else {
      showKamehamehaAnimation(context, duration, soundEnabled);
    }
  } catch (error) {
    console.error('🐉 Error triggering animation:', error);
  }
}

/**
 * Deactivates the extension.
 */
export function deactivate(): void {
  console.log('🐉 Goku Kamehameha extension deactivated.');
}
