import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import * as jsDiff from 'diff';
import { app, dialog, ipcMain } from 'electron';
import { DEFAULT_IGNORE_PATTERNS } from '../shared/constants/ignore';
import type { DiffType, FileDiff, FileInfo, FolderInfo } from '../shared/types/diff';

import { makeAppWithSingleInstanceLock } from 'lib/electron-app/factories/app/instance';
import { makeAppSetup } from 'lib/electron-app/factories/app/setup';
import { MainWindow } from './windows/main';

makeAppWithSingleInstanceLock(async () => {
  await app.whenReady();
  await makeAppSetup(MainWindow);
});

// 处理选择文件夹
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

/**
 * 检查路径是否应该被忽略
 * @param path 要检查的路径
 * @returns 是否应该被忽略
 */
function shouldIgnore(path: string): boolean {
  const name = path.split('/').pop() || path;
  return DEFAULT_IGNORE_PATTERNS.some((pattern) => {
    // 处理通配符
    if (pattern.includes('*')) {
      const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
      return regex.test(name);
    }
    return name === pattern;
  });
}

// 获取文件树
async function getFileTree(path: string): Promise<FileInfo | FolderInfo | null> {
  try {
    const stats = await stat(path);
    const name = path.split('/').pop() || path;

    if (stats.isFile()) {
      return {
        path,
        name,
        type: 'file',
        size: stats.size,
        modifiedTime: stats.mtime,
      };
    }

    const entries = await readdir(path, { withFileTypes: true });
    const children = await Promise.all(
      entries
        .filter((entry) => !shouldIgnore(join(path, entry.name)))
        .map(async (entry) => {
          try {
            const fullPath = join(path, entry.name);
            return await getFileTree(fullPath);
          } catch (error) {
            console.warn(`Failed to process ${entry.name}:`, error);
            return null;
          }
        }),
    );

    // 过滤掉处理失败的文件
    const validChildren = children.filter(
      (child): child is FileInfo | FolderInfo => child !== null,
    );

    return {
      path,
      name,
      type: 'dir',
      children: validChildren,
    };
  } catch (error) {
    console.error('Failed to get file tree:', error);
    return null;
  }
}

// 处理获取文件树请求
ipcMain.handle('get-file-tree', async (_, path: string, comparePath?: string) => {
  try {
    const tree = await getFileTree(path);
    if (!tree) {
      throw new Error('Failed to get file tree');
    }

    // 如果提供了比较路径，执行文件夹比较
    if (comparePath && tree.type === 'dir') {
      const compareTree = await getFileTree(comparePath);
      if (compareTree && compareTree.type === 'dir') {
        await compareDirectories(tree, compareTree);
      }
    }

    return tree;
  } catch (error) {
    console.error('Failed to get file tree:', error);
    return null;
  }
});

// 比较两个目录
async function compareDirectories(leftTree: FolderInfo, rightTree: FolderInfo) {
  // 创建右侧文件的映射，方便快速查找
  const rightMap = new Map<string, FileInfo | FolderInfo>();

  function buildPathMap(node: FileInfo | FolderInfo, basePath: string) {
    const relativePath = node.path.slice(basePath.length);
    rightMap.set(relativePath, node);

    if (node.type === 'dir') {
      for (const child of node.children) {
        buildPathMap(child, basePath);
      }
    }
  }

  buildPathMap(rightTree, rightTree.path);

  // 递归比较左侧树
  async function compare(node: FileInfo | FolderInfo, basePath: string) {
    const relativePath = node.path.slice(basePath.length);
    const rightNode = rightMap.get(relativePath);

    if (!rightNode) {
      // 右侧没有，标记为添加
      node.diffType = 'added';
    } else if (node.type === 'file' && rightNode.type === 'file') {
      // 两边都是文件，比较内容
      try {
        const leftContent = await readFile(node.path, 'utf-8');
        const rightContent = await readFile(rightNode.path, 'utf-8');

        if (leftContent !== rightContent) {
          node.diffType = 'modified';
        } else {
          node.diffType = 'unchanged';
        }
      } catch (error) {
        console.error('Error comparing files:', error);
        node.diffType = 'modified'; // 出错时保守地标记为修改
      }
    } else if (node.type === 'dir') {
      // 如果是目录，继续递归比较
      let hasChanges = false;

      for (const child of node.children) {
        await compare(child, basePath);

        // 如果任何子项有变更，父目录也标记为有变更
        if (child.diffType && child.diffType !== 'unchanged') {
          hasChanges = true;
        }
      }

      // 标记目录状态
      if (hasChanges) {
        node.diffType = 'modified';
      } else {
        node.diffType = 'unchanged';
      }

      // 检查右侧是否有额外的文件
      if (rightNode.type === 'dir') {
        for (const rightChild of rightNode.children) {
          const rightRelativePath = rightChild.path.slice(rightTree.path.length);
          const found = node.children.some(
            (leftChild) => leftChild.path.slice(basePath.length) === rightRelativePath,
          );

          if (!found) {
            // 创建一个标记为"已删除"的副本
            const deletedNode: any = { ...rightChild, diffType: 'removed' };
            if (deletedNode.type === 'dir') {
              // 递归将目录中的所有项标记为已删除
              markAsRemoved(deletedNode);
            }
            node.children.push(deletedNode);
          }
        }
      }
    }
  }

  function markAsRemoved(node: FileInfo | FolderInfo) {
    node.diffType = 'removed';
    if (node.type === 'dir') {
      for (const child of node.children) {
        markAsRemoved(child);
      }
    }
  }

  await compare(leftTree, leftTree.path);
}

// 处理获取文件diff
ipcMain.handle('get-file-diff', async (_, leftPath: string, rightPath: string) => {
  try {
    // 读取文件内容
    const leftContent = await readFile(leftPath, 'utf-8');
    const rightContent = await readFile(rightPath, 'utf-8');

    // 使用jsDiff计算差异
    const diffResult = jsDiff.diffLines(leftContent, rightContent);

    // 转换为我们的差异格式
    const changes = diffResult.map((part: jsDiff.Change) => ({
      value: part.value,
      type: part.added
        ? ('added' as DiffType)
        : part.removed
          ? ('removed' as DiffType)
          : ('unchanged' as DiffType),
    }));

    return {
      oldContent: leftContent,
      newContent: rightContent,
      changes,
    } as FileDiff;
  } catch (error) {
    console.error('Failed to get file diff:', error);
    return null;
  }
});
