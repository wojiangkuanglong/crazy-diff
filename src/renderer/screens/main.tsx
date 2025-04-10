import { memo, useCallback, useEffect, useState } from 'react';

import { useDiffStore } from '../../shared/store/diffStore';
import { FileDiff } from '../components/FileDiff';
import { FileTree } from '../components/FileTree';
import { FolderSelector } from '../components/FolderSelector';

const { App } = window;

/**
 * 主屏幕组件 - 应用的主界面
 * @returns {JSX.Element} 渲染的主屏幕
 */
export const MainScreen = memo(function MainScreen() {
  // 状态管理
  const [isLeftLoading, setIsLeftLoading] = useState(false);
  const [isRightLoading, setIsRightLoading] = useState(false);
  const { leftTree, rightTree, selectedFile, setSelectedFile } = useDiffStore();

  // 初始化应用
  useEffect(() => {
    App.sayHelloFromBridge();
  }, []);

  // 监听树状态变化，自动更新加载状态
  useEffect(() => {
    if (leftTree) setIsLeftLoading(false);
  }, [leftTree]);

  useEffect(() => {
    if (rightTree) setIsRightLoading(false);
  }, [rightTree]);

  // 选择文件处理函数
  const handleFileSelect = useCallback(
    (side: 'left' | 'right') => (path: string) => {
      // 使用 setTimeout 确保状态重置后再设置新状态
      setSelectedFile(side, null);
      setTimeout(() => setSelectedFile(side, path), 0);
    },
    [setSelectedFile],
  );

  return (
    <main className="flex flex-col h-screen p-4 gap-4 relative">
      {/* 文件夹选择区域 */}
      <div className="flex gap-4 flex-shrink-0">
        <div className="flex-1">
          <FolderSelector side="left" />
        </div>
        <div className="flex-1">
          <FolderSelector side="right" />
        </div>
      </div>

      {/* 文件浏览和对比区域 */}
      <div className="flex flex-col flex-1 min-h-0 gap-4">
        {/* 文件树对比区域 */}
        {!leftTree && !rightTree ? (
          <></>
        ) : (
          <div className="flex gap-4 h-2/5 min-h-0">
            <div className="flex-1 border rounded-lg overflow-hidden">
              <FileTree
                side="left"
                tree={leftTree}
                isLoading={isLeftLoading}
                selectedFile={selectedFile.left}
                onFileSelect={handleFileSelect('left')}
              />
            </div>
            <div className="flex-1 border rounded-lg overflow-hidden">
              <FileTree
                side="right"
                tree={rightTree}
                isLoading={isRightLoading}
                selectedFile={selectedFile.right}
                onFileSelect={handleFileSelect('right')}
              />
            </div>
          </div>
        )}

        {/* 文件内容差异显示区域 */}
        <div className="flex-1 min-h-0 h-3/5">
          <FileDiff />
        </div>
      </div>
    </main>
  );
});
