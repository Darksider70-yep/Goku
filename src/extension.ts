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

    // Code Runner and many language extensions execute through the integrated
    // terminal rather than the VS Code Task API. Watch successful, code-like
    // terminal commands so those runs can trigger the animation too.
    const terminalListener = vscode.window.onDidEndTerminalShellExecution((event) => {
      handleTerminalCommandEnd(context, event);
    });
    context.subscriptions.push(terminalListener);

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
 * Handles successful executions in the integrated terminal. Shell integration
 * provides the exit code, allowing this to behave like the task trigger while
 * also supporting Code Runner and language-specific run commands.
 */
function handleTerminalCommandEnd(
  context: vscode.ExtensionContext,
  event: vscode.TerminalShellExecutionEndEvent
): void {
  const config = vscode.workspace.getConfiguration('goku');

  if (!config.get<boolean>('enabled', true)) {
    return;
  }

  if (!config.get<boolean>('triggerOnTerminal', true)) {
    return;
  }

  // An undefined exit code means the terminal could not verify success.
  if (event.exitCode !== 0) {
    return;
  }

  const commandLine = event.execution.commandLine.value;
  if (!isCodeExecutionCommand(commandLine)) {
    return;
  }

  console.log(`🐉 Terminal command succeeded: ${commandLine}`);
  triggerAnimation(context);
}

/**
 * Limits terminal triggers to common program, run, test, and build commands
 * so routine commands such as cd, dir, or git status do not fire the effect.
 */
function isCodeExecutionCommand(commandLine: string): boolean {
  const command = commandLine.trim();
  if (!command) {
    return false;
  }

  // Package-management commands are successful terminal operations, but they
  // are not code execution and would make the extension overly noisy.
  if (/\b(?:npm|pnpm|yarn)\s+(?:install|i|add|remove|uninstall|update|list|outdated)\b/i.test(command)) {
    return false;
  }

  return /(?:^|[\s;&|\\/])(?:node|nodejs|npm|npx|pnpm|yarn|bun|deno|python|python3|py|java|go|cargo|dotnet|ruby|php)(?:\.exe)?(?:\s|$)/i.test(command);
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
