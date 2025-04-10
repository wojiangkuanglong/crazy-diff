import { Folder, History, Loader2 } from 'lucide-react';
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
  onLoadingChange?: (loading: boolean) => void;
}

export function FolderSelector({ side, onLoadingChange }: FolderSelectorProps) {
  const [isLoading, setIsLoading] = useState(false);
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

  // 设置加载状态并通知父组件
  const setLoading = useCallback(
    (loading: boolean) => {
      setIsLoading(loading);
      if (onLoadingChange) {
        onLoadingChange(loading);
      }
    },
    [onLoadingChange],
  );

  // 获取文件树
  const getFileTree = useCallback(
    async (path: string) => {
      try {
        setLoading(true);
        // 获取另一侧的文件夹路径用于比较
        const comparePath = side === 'left' ? rightFolder : leftFolder;
        const tree = await window.electron.ipcRenderer.invoke('get-file-tree', path, comparePath);
        if (tree) {
          setTree(tree);
        }
      } catch (error) {
        console.error('Failed to get file tree:', error);
      } finally {
        setLoading(false);
      }
    },
    [setTree, side, leftFolder, rightFolder, setLoading],
  );

  // 处理文件夹选择
  const handleSelectFolder = useCallback(async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke('select-folder');
      if (result) {
        // 设置当前侧的文件夹
        setFolder(result);

        // 添加最近使用的文件夹
        addRecentFolder({
          path: result,
          name: result.split('/').pop() || result,
          lastUsed: new Date(),
        });

        // 获取当前侧的文件树
        await getFileTree(result);

        // 如果另一侧没有选择文件夹，则自动选择相同的文件夹
        const otherFolder = side === 'left' ? rightFolder : leftFolder;
        const otherSetFolder = side === 'left' ? setRightFolder : setLeftFolder;
        const otherSetTree = side === 'left' ? setRightTree : setLeftTree;

        if (!otherFolder) {
          otherSetFolder(result);
          await window.electron.ipcRenderer.invoke('get-file-tree', result, result).then((tree) => {
            if (tree) {
              otherSetTree(tree);
            }
          });
        }
      }
    } catch (error) {
      console.error('Failed to select folder:', error);
    }
  }, [
    setFolder,
    addRecentFolder,
    getFileTree,
    side,
    rightFolder,
    leftFolder,
    setRightFolder,
    setLeftFolder,
    setRightTree,
    setLeftTree,
  ]);

  return (
    <Card className="p-2">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          <Folder className="w-4 h-4" />
          <span className="text-sm font-medium">{side === 'left' ? '文件夹1' : '文件夹2'}</span>
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
                  // 设置当前侧的文件夹
                  setFolder(folder.path);

                  // 获取当前侧的文件树
                  await getFileTree(folder.path);

                  // 如果另一侧没有选择文件夹，则自动选择相同的文件夹
                  const otherFolder = side === 'left' ? rightFolder : leftFolder;
                  const otherSetFolder = side === 'left' ? setRightFolder : setLeftFolder;
                  const otherSetTree = side === 'left' ? setRightTree : setLeftTree;

                  if (!otherFolder) {
                    otherSetFolder(folder.path);
                    await window.electron.ipcRenderer
                      .invoke('get-file-tree', folder.path, folder.path)
                      .then((tree) => {
                        if (tree) {
                          otherSetTree(tree);
                        }
                      });
                  }
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
          {isLoading && (
            <span className="ml-1 inline-flex items-center">
              <Loader2 className="w-3 h-3 animate-spin mr-1" />
              加载中...
            </span>
          )}
        </div>
        <Button
          onClick={handleSelectFolder}
          size="sm"
          className="cursor-pointer h-7 px-2 text-xs"
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : '选择'}
        </Button>
      </div>
    </Card>
  );
}
