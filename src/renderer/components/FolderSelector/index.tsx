import { Folder, History, Loader2 } from 'lucide-react';
import { memo, useCallback, useState } from 'react';
import { useDiffStore } from '../../../shared/store/diffStore';
import type { RecentFolder } from '../../../shared/types/diff';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

/**
 * 文件夹选择器的属性接口
 * @interface FolderSelectorProps
 * @property {('left'|'right')} side - 选择器的位置（左侧或右侧）
 */
interface FolderSelectorProps {
  side: 'left' | 'right';
}

/**
 * 文件夹选择器组件 - 用于选择文件夹和显示最近使用的文件夹
 * @param {FolderSelectorProps} props - 组件属性
 * @returns {JSX.Element} 渲染的文件夹选择器组件
 */
export const FolderSelector = memo(function FolderSelector({ side }: FolderSelectorProps) {
  // 状态和存储
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

  // 根据当前选择的side确定相应的值和操作函数
  const currentFolder = side === 'left' ? leftFolder : rightFolder;
  const setFolder = side === 'left' ? setLeftFolder : setRightFolder;
  const setTree = side === 'left' ? setLeftTree : setRightTree;
  const comparePath = side === 'left' ? rightFolder : leftFolder;

  /**
   * 获取文件树
   * @param {string} path - 文件夹路径
   * @returns {Promise<void>}
   */
  const getFileTree = useCallback(
    async (path: string) => {
      try {
        setIsLoading(true);
        const tree = await window.electron.ipcRenderer.invoke('get-file-tree', path, comparePath);
        setTree(tree);
      } catch (error) {
        console.error('获取文件树失败:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [setTree, comparePath],
  );

  /**
   * 处理文件夹选择
   * @returns {Promise<void>}
   */
  const handleSelectFolder = useCallback(async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke('select-folder');
      if (result) {
        // 设置当前侧的文件夹
        setFolder(result);

        // 添加到最近使用的文件夹列表
        addRecentFolder({
          path: result,
          name: result.split('/').pop() || result,
          lastUsed: new Date(),
        });

        // 获取当前侧的文件树
        await getFileTree(result);
      }
    } catch (error) {
      console.error('选择文件夹失败:', error);
    }
  }, [setFolder, addRecentFolder, getFileTree]);

  /**
   * 处理从最近文件夹列表中选择文件夹
   * @param {string} path - 选择的文件夹路径
   * @returns {Promise<void>}
   */
  const handleRecentFolderSelect = useCallback(
    async (path: string) => {
      // 设置当前侧的文件夹
      setFolder(path);

      // 获取当前侧的文件树
      await getFileTree(path);
    },
    [setFolder, getFileTree],
  );

  /**
   * 渲染最近使用的文件夹项
   * @param {RecentFolder} folder - 文件夹信息
   * @returns {JSX.Element} 文件夹项组件
   */
  const renderRecentFolderItem = (folder: RecentFolder) => (
    <DropdownMenuItem
      key={folder.path}
      onClick={() => handleRecentFolderSelect(folder.path)}
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
  );

  return (
    <Card className="p-2">
      {/* 标题栏和最近使用按钮 */}
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
          <DropdownMenuContent>{recentFolders.map(renderRecentFolderItem)}</DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 文件夹路径和选择按钮 */}
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
});
