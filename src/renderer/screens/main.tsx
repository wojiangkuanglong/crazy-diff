import { useEffect, useState } from 'react';

import {} from 'renderer/components/ui/alert';
import { useDiffStore } from '../../shared/store/diffStore';
import { FileDiff } from '../components/FileDiff';
import { FileTree } from '../components/FileTree';
import { FolderSelector } from '../components/FolderSelector';

const { App } = window;

export function MainScreen() {
  const [isLeftLoading, setIsLeftLoading] = useState(false);
  const [isRightLoading, setIsRightLoading] = useState(false);
  const { leftTree, rightTree } = useDiffStore();

  useEffect(() => {
    App.sayHelloFromBridge();
  }, []);

  // 监听树状态变化，更新加载状态
  useEffect(() => {
    if (leftTree) {
      setIsLeftLoading(false);
    }
  }, [leftTree]);

  useEffect(() => {
    if (rightTree) {
      setIsRightLoading(false);
    }
  }, [rightTree]);

  // 当开始获取左侧文件树时设置加载状态
  const handleLeftFolderLoading = (loading: boolean) => {
    setIsLeftLoading(loading);
  };

  // 当开始获取右侧文件树时设置加载状态
  const handleRightFolderLoading = (loading: boolean) => {
    setIsRightLoading(loading);
  };

  return (
    <main className="flex flex-col h-screen p-4 gap-4">
      {/* 文件夹选择区域 - 减小高度 */}
      <div className="flex gap-4 flex-shrink-0">
        <div className="flex-1">
          <FolderSelector side="left" onLoadingChange={handleLeftFolderLoading} />
        </div>
        <div className="flex-1">
          <FolderSelector side="right" onLoadingChange={handleRightFolderLoading} />
        </div>
      </div>

      {/* 文件浏览和对比区域 - 增加高度 */}
      <div className="flex flex-col flex-1 min-h-0 gap-4">
        {/* 文件树对比区域 - 调整比例 */}
        <div className="flex gap-4 h-2/5 min-h-0">
          <div className="flex-1 border rounded-lg overflow-hidden">
            <FileTree side="left" isLoading={isLeftLoading} />
          </div>
          <div className="flex-1 border rounded-lg overflow-hidden">
            <FileTree side="right" isLoading={isRightLoading} />
          </div>
        </div>

        {/* 文件内容差异显示区域 - 增加比例 */}
        <div className="flex-1 min-h-0 h-3/5">
          <FileDiff />
        </div>
      </div>
    </main>
  );
}
