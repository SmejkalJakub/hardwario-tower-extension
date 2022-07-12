/* eslint-disable import/no-unresolved */
import * as vscode from 'vscode';

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i += 1) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export default class ConsoleWebViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'harwdario.tower.views.console';

  private view?: vscode.WebviewView;

  constructor(
          private readonly extensionUri: vscode.Uri,
  ) { }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this.view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [
        this.extensionUri,
      ],
    };

    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((data) => {
      switch (data.type) {
        case 'colorSelected':
        {
          vscode.window.activeTextEditor?.insertSnippet(new vscode.SnippetString(`#${data.value}`));
          break;
        }
        case 'serialData':
        {
          vscode.window.activeTextEditor?.insertSnippet(new vscode.SnippetString(`${data.message}`));
          break;
        }
        default:
        {
          break;
        }
      }
    });
  }

  public addSerialData(data) {
    if (this.view) {
      this.view.show?.(true); // `show` is not implemented in 1.49 but is for 1.50 insiders
      this.view.webview.postMessage({ type: 'serialData', message: data });
    }
  }

  public addColor() {
    if (this.view) {
      this.view.show?.(true); // `show` is not implemented in 1.49 but is for 1.50 insiders
      this.view.webview.postMessage({ type: 'addColor' });
    }
  }

  public clearColors() {
    if (this.view) {
      this.view.webview.postMessage({ type: 'clearColors' });
    }
  }

  private getHtmlForWebview(webview: vscode.Webview) {
    // Get the local path to main script run in the webview,
    // then convert it to a uri we can use in the webview.
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'main.js'));

    // Do the same for the stylesheet.
    const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'reset.css'));
    const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'vscode.css'));
    const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'main.css'));

    // Use a nonce to only allow a specific script to be run.
    const nonce = getNonce();

    return `<!DOCTYPE html>
              <html lang="en">
              <head>
                  <meta charset="UTF-8">
                  <!--
                      Use a content security policy to only allow loading images from https or from our extension directory,
                      and only allow scripts that have a specific nonce.
                  -->
                  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <link href="${styleResetUri}" rel="stylesheet">
                  <link href="${styleVSCodeUri}" rel="stylesheet">
                  <link href="${styleMainUri}" rel="stylesheet">
                  
                  <title>Cat Colors</title>
              </head>
              <body>
                  <ul class="color-list">
                  </ul>
                  <button class="add-color-button">Add Color</button>
                  <script nonce="${nonce}" src="${scriptUri}"></script>
              </body>
              </html>`;
  }
}
