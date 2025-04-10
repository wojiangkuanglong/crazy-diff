import { Folder, History } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useDiffStore } from '../../../shared/store/diffStore';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface FolderSelectorProps {
  side: 'left' | 'right';
}

export function FolderSelector({ side }: FolderSelectorProps) {
  const [isDragging, setIsDragging] = useState(false);
  const {
    leftFolder,
    rightFolder,
    recentFolders,
    setLeftFolder,
    setRightFolder,
    addRecentFolder,
    setLeftTree,
    setRightTree,
  } = useDiffStore();

  const currentFolder = side === 'left' ? leftFolder : rightFolder;
  const setFolder = side === 'left' ? setLeftFolder : setRightFolder;
  const setTree = side === 'left' ? setLeftTree : setRightTree;

  // 获取文件树
  const getFileTree = useCallback(
    async (path: string) => {
      try {
        // 获取另一侧的文件夹路径用于比较
        const comparePath = side === 'left' ? rightFolder : leftFolder;
        const tree = await window.electron.ipcRenderer.invoke('get-file-tree', path, comparePath);
        if (tree) {
          setTree(tree);
        }
      } catch (error) {
        console.error('Failed to get file tree:', error);
      }
    },
    [setTree, side, leftFolder, rightFolder],
  );

  // 处理拖拽事件
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const items = e.dataTransfer.items;
      if (items.length > 0) {
        const item = items[0];
        if (item.kind === 'file') {
          const entry = item.webkitGetAsEntry();
          if (entry?.isDirectory) {
            const path = entry.fullPath;
            setFolder(path);
            addRecentFolder({
              path,
              name: entry.name,
              lastUsed: new Date(),
            });
            await getFileTree(path);
          }
        }
      }
    },
    [setFolder, addRecentFolder, getFileTree],
  );

  // 处理文件夹选择
  const handleSelectFolder = useCallback(async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke('select-folder');
      if (result) {
        setFolder(result);
        addRecentFolder({
          path: result,
          name: result.split('/').pop() || result,
          lastUsed: new Date(),
        });
        await getFileTree(result);
      }
    } catch (error) {
      console.error('Failed to select folder:', error);
    }
  }, [setFolder, addRecentFolder, getFileTree]);

  return (
    <Card
      className={`p-2 ${isDragging ? 'border-primary' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          <Folder className="w-4 h-4" />
          <span className="text-sm font-medium">
            {side === 'left' ? '左侧文件夹' : '右侧文件夹'}
          </span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="cursor-pointer h-7 px-2 text-xs">
              <History className="w-3 h-3 mr-1" />
              最近
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {recentFolders.map((folder) => (
              <DropdownMenuItem
                key={folder.path}
                onClick={async () => {
                  setFolder(folder.path);
                  await getFileTree(folder.path);
                }}
                className="truncate"
                title={folder.path}
              >
                <div className="flex flex-col">
                  <span className="truncate text-xs">{folder.path}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(folder.lastUsed).toLocaleString()}
                  </span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-1">
        <div className="flex-1 truncate text-xs text-muted-foreground">
          {currentFolder || '未选择文件夹'}
        </div>
        <Button onClick={handleSelectFolder} size="sm" className="cursor-pointer h-7 px-2 text-xs">
          选择
        </Button>
      </div>
    </Card>
  );
}
