import * as vscode from 'vscode';
import { getAnimationHtml } from './animationHtml';

let currentPanel: vscode.WebviewPanel | undefined;

export function showKamehamehaAnimation(
  context: vscode.ExtensionContext,
  duration: number,
  soundEnabled: boolean
) {
  // Don't stack panels
  if (currentPanel) {
    currentPanel.dispose();
  }

  currentPanel = vscode.window.createWebviewPanel(
    'gokuKamehameha',
    '⚡ KAMEHAMEHA! ⚡',
    {
      viewColumn: vscode.ViewColumn.Active,
      preserveFocus: false,
    },
    {
      enableScripts: true,
      retainContextWhenHidden: false,
    }
  );

  currentPanel.webview.html = getAnimationHtml(duration, soundEnabled);

  // Auto-close after animation
  const timeout = setTimeout(() => {
    if (currentPanel) {
      currentPanel.dispose();
    }
  }, duration + 500);

  currentPanel.onDidDispose(() => {
    clearTimeout(timeout);
    currentPanel = undefined;
  });

  // Listen for messages from webview
  currentPanel.webview.onDidReceiveMessage((message) => {
    if (message.command === 'animationComplete') {
      if (currentPanel) {
        currentPanel.dispose();
      }
    }
  });
}
