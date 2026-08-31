import * as vscode from 'vscode';
import { getAnimationHtml } from './animationHtml';

/** Track the currently active animation panel */
let currentPanel: vscode.WebviewPanel | undefined;

/** Timeout handle for auto-closing the panel */
let closeTimeout: NodeJS.Timeout | undefined;

/**
 * Displays the Goku Kamehameha animation in a webview panel.
 * Handles panel lifecycle, cleanup, and messaging.
 * 
 * @param context - VS Code extension context
 * @param duration - Animation duration in milliseconds (1000-10000 recommended)
 * @param soundEnabled - Whether to enable audio effects
 * @throws Logs errors without throwing (graceful degradation)
 */
export function showKamehamehaAnimation(
  context: vscode.ExtensionContext,
  duration: number,
  soundEnabled: boolean
): void {
  try {
    // Validate parameters
    if (duration < 100) {
      console.warn('🐉 Animation duration too short, using minimum 1000ms');
      duration = 1000;
    }
    if (duration > 10000) {
      console.warn('🐉 Animation duration too long, capping at 10000ms');
      duration = 10000;
    }

    // Dispose existing panel to prevent stacking
    if (currentPanel) {
      try {
        currentPanel.dispose();
      } catch (error) {
        console.warn('🐉 Error disposing previous panel:', error);
      }
    }

    // Allow the webview to load the bundled anime character artwork.
    const assetRoot = vscode.Uri.joinPath(context.extensionUri, 'assets');

    // Create new webview panel
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
        localResourceRoots: [assetRoot],
      }
    );

    // Set HTML content with animation
    const characterUri = currentPanel.webview.asWebviewUri(
      vscode.Uri.joinPath(assetRoot, 'anime-energy-warrior-v1.png')
    ).toString();
    currentPanel.webview.html = getAnimationHtml(duration, soundEnabled, characterUri);

    // Auto-close after animation completes
    setupAutoClose(duration);

    // Handle panel disposal
    currentPanel.onDidDispose(() => {
      if (closeTimeout) {
        clearTimeout(closeTimeout);
      }
      currentPanel = undefined;
    });

    // Listen for animation completion messages from webview
    currentPanel.webview.onDidReceiveMessage((message) => {
      if (message.command === 'animationComplete') {
        closePanel();
      }
    });
  } catch (error) {
    console.error('🐉 Error showing Kamehameha animation:', error);
  }
}

/**
 * Sets up auto-close timeout for the animation panel.
 * @param duration - Animation duration in milliseconds
 */
function setupAutoClose(duration: number): void {
  // Clear existing timeout if any
  if (closeTimeout) {
    clearTimeout(closeTimeout);
  }

  // Set new timeout to close after animation + buffer
  closeTimeout = setTimeout(() => {
    closePanel();
  }, duration + 500);
}

/**
 * Closes the current animation panel if it exists.
 */
function closePanel(): void {
  if (currentPanel) {
    try {
      currentPanel.dispose();
    } catch (error) {
      console.warn('🐉 Error closing animation panel:', error);
    }
    currentPanel = undefined;
  }
}
