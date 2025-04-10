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
  const { leftFolder, rightFolder, recentFolders, setLeftFolder, setRightFolder, addRecentFolder } =
    useDiffStore();

  const currentFolder = side === 'left' ? leftFolder : rightFolder;
  const setFolder = side === 'left' ? setLeftFolder : setRightFolder;

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
          }
        }
      }
    },
    [setFolder, addRecentFolder],
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
      }
    } catch (error) {
      console.error('Failed to select folder:', error);
    }
  }, [setFolder, addRecentFolder]);

  return (
    <Card
      className={`p-4 ${isDragging ? 'border-primary' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Folder className="w-5 h-5" />
          <span className="font-medium">{side === 'left' ? '左侧文件夹' : '右侧文件夹'}</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="cursor-pointer">
              <History className="w-4 h-4 mr-2" />
              最近使用
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {recentFolders.map((folder) => (
              <DropdownMenuItem key={folder.path} onClick={() => setFolder(folder.path)}>
                {folder.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 truncate text-sm text-muted-foreground">
          {currentFolder || '未选择文件夹'}
        </div>
        <Button onClick={handleSelectFolder} size="sm" className="cursor-pointer">
          选择文件夹
        </Button>
      </div>
    </Card>
  );
}
