const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

class FolderStructureProvider {
    constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
    }

    getTreeItem(element) {
        return element;
    }

    getChildren(element) {
        if (!this.workspaceRoot) {
            vscode.window.showInformationMessage('No folder opened');
            return Promise.resolve([]);
        }

        if (element) {
            return this.getFolderContents(element.path);
        } else {
            return this.getFolderContents(this.workspaceRoot);
        }
    }

    getFolderContents(folderPath) {
        return new Promise(resolve => {
            fs.readdir(folderPath, { withFileTypes: true }, (err, files) => {
                if (err) {
                    resolve([]);
                    return;
                }

                const treeItems = files.map(file => {
                    const filePath = path.join(folderPath, file.name);
                    const treeItem = new vscode.TreeItem(
                        file.name,
                        file.isDirectory() ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
                    );
                    treeItem.path = filePath;
                    treeItem.iconPath = file.isDirectory() 
                        ? new vscode.ThemeIcon("folder")
                        : new vscode.ThemeIcon("file");
                    return treeItem;
                });

                resolve(treeItems);
            });
        });
    }
}

module.exports = FolderStructureProvider;