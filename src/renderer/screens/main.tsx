import { useEffect } from 'react';

import {} from 'renderer/components/ui/alert';
import { FileDiff } from '../components/FileDiff';
import { FileTree } from '../components/FileTree';
import { FolderSelector } from '../components/FolderSelector';

const { App } = window;

export function MainScreen() {
  useEffect(() => {
    App.sayHelloFromBridge();
  }, []);

  return (
    <main className="flex flex-col h-screen p-4 gap-4">
      {/* 文件夹选择区域 - 减小高度 */}
      <div className="flex gap-4 flex-shrink-0">
        <div className="flex-1">
          <FolderSelector side="left" />
        </div>
        <div className="flex-1">
          <FolderSelector side="right" />
        </div>
      </div>

      {/* 文件浏览和对比区域 - 增加高度 */}
      <div className="flex flex-col flex-1 min-h-0 gap-4">
        {/* 文件树对比区域 - 调整比例 */}
        <div className="flex gap-4 h-2/5 min-h-0">
          <div className="flex-1 border rounded-lg overflow-hidden">
            <FileTree side="left" />
          </div>
          <div className="flex-1 border rounded-lg overflow-hidden">
            <FileTree side="right" />
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
