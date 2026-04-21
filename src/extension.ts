import * as vscode from 'vscode';
import { showKamehamehaAnimation } from './animationPanel';

let lastTriggerTime = 0;
const COOLDOWN_MS = 5000;

export function activate(context: vscode.ExtensionContext) {
  console.log('🐉 Goku Kamehameha extension activated!');

  // Manual trigger command
  const triggerCommand = vscode.commands.registerCommand('goku.triggerKamehameha', () => {
    triggerAnimation(context);
  });
  context.subscriptions.push(triggerCommand);

  // Listen for task completion (covers "Run Build Task", "Run Task", etc.)
  const taskListener = vscode.tasks.onDidEndTaskProcess((event) => {
    const config = vscode.workspace.getConfiguration('goku');
    if (!config.get<boolean>('enabled', true)) return;
    if (!config.get<boolean>('triggerOnTask', true)) return;

    if (event.exitCode === 0) {
      console.log(`🐉 Task "${event.execution.task.name}" succeeded! Kamehameha!`);
      triggerAnimation(context);
    }
  });
  context.subscriptions.push(taskListener);

  // Listen for debug session completion
  const debugListener = vscode.debug.onDidTerminateDebugSession((_session) => {
    const config = vscode.workspace.getConfiguration('goku');
    if (!config.get<boolean>('enabled', true)) return;
    if (!config.get<boolean>('triggerOnDebug', true)) return;

    console.log('🐉 Debug session ended! Kamehameha!');
    triggerAnimation(context);
  });
  context.subscriptions.push(debugListener);

  // Show activation message
  vscode.window.showInformationMessage('🐉 Goku is ready! Run code successfully to see the Kamehameha!');
}

function triggerAnimation(context: vscode.ExtensionContext) {
  const now = Date.now();
  if (now - lastTriggerTime < COOLDOWN_MS) {
    console.log('🐉 Kamehameha on cooldown, skipping...');
    return;
  }
  lastTriggerTime = now;

  const config = vscode.workspace.getConfiguration('goku');
  const duration = config.get<number>('animationDuration', 4500);
  const soundEnabled = config.get<boolean>('soundEnabled', true);

  showKamehamehaAnimation(context, duration, soundEnabled);
}

export function deactivate() {
  console.log('🐉 Goku Kamehameha extension deactivated.');
}
