const vscode = require('vscode');
const FolderStructureProvider = require('./src/FolderStructureProvider');
const path = require('path');
const fs = require('fs');

function activate(context) {
    console.log('Congratulations, your extension "structuresnatch" is now active!');

    const workspaceRoot = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
        ? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;

    if (!workspaceRoot) {
        vscode.window.showInformationMessage('No folder opened');
        return;
    }

    const folderStructureProvider = new FolderStructureProvider(workspaceRoot);
    vscode.window.registerTreeDataProvider('folderStructure', folderStructureProvider);

    let panel;

    const disposable = vscode.commands.registerCommand('structuresnatch.snatch', function () {
        if (panel) {
            panel.reveal();
        } else {
            panel = vscode.window.createWebviewPanel(
                'structuresnatch',
                'StructureSnatch Your Codebase',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );

            panel.webview.html = getWebviewContent();

            panel.webview.onDidReceiveMessage(
                message => {
                    switch (message.command) {
                        case 'snatchStructure':
                            snatchStructure(workspaceRoot);
                            return;
                    }
                },
                undefined,
                context.subscriptions
            );

            panel.onDidDispose(
                () => {
                    panel = undefined;
                },
                null,
                context.subscriptions
            );
        }

        updateWebviewInfo(panel, workspaceRoot);
    });

    context.subscriptions.push(disposable);
}

function getWebviewContent(extensionPath) {
    try {
        const htmlPath = path.join(extensionPath, 'src', 'webview.html');
        const htmlContent = fs.readFileSync(htmlPath, 'utf8');
        return htmlContent;
    } catch (error) {
        console.error('Error reading webview content:', error);
        return '';
    }
}
function updateWebviewInfo(panel, workspaceRoot) {
    const codebaseName = path.basename(workspaceRoot);
    const folderCount = countFolders(workspaceRoot);

    panel.webview.postMessage({
        command: 'updateInfo',
        codebaseName: codebaseName,
        folderCount: folderCount
    });
}

function countFolders(dir) {
    let count = 0;
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
        if (item.isDirectory()) {
            count++;
            count += countFolders(path.join(dir, item.name));
        }
    }
    
    return count;
}

function snatchStructure(workspaceRoot) {
    const outputPath = path.join(workspaceRoot, 'folder_structure.txt');
    const structure = getFolderStructure(workspaceRoot);
    
    fs.writeFile(outputPath, structure, (err) => {
        if (err) {
            vscode.window.showErrorMessage('Failed to save folder structure');
        } else {
            vscode.window.showInformationMessage('Folder structure saved to folder_structure.txt');
        }
    });
}

function getFolderStructure(dir, prefix = '') {
    let result = '';
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
        if (item.isDirectory()) {
            result += `${prefix}${item.name}/\n`;
            result += getFolderStructure(path.join(dir, item.name), prefix + '    ');
        } else {
            result += `${prefix}├── ${item.name}\n`;
        }
    }
    
    return result;
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
}