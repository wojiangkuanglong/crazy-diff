import { ArrowLeft, ArrowRight, Maximize2, Minimize2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import ReactDiffViewer from 'react-diff-viewer-continued';
import { useDiffStore } from '../../../shared/store/diffStore';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

export function FileDiff() {
  const { selectedFile, fileDiff, setFileDiff } = useDiffStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    // 当选中的文件变化时，获取文件内容差异
    const fetchFileDiff = async () => {
      if (selectedFile.left && selectedFile.right) {
        setIsLoading(true);
        try {
          const diff = await window.electron.ipcRenderer.invoke(
            'get-file-diff',
            selectedFile.left,
            selectedFile.right,
          );
          setFileDiff(diff);
        } catch (error) {
          console.error('Failed to get file diff:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchFileDiff();
  }, [selectedFile, setFileDiff]);

  // 切换全屏模式
  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  // 只选择了左侧文件
  if (selectedFile.left && !selectedFile.right) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center text-muted-foreground">
          <div className="flex items-center mb-2">
            <span>已选择左侧文件</span>
            <ArrowRight className="h-4 w-4 mx-2" />
            <span className="text-primary">请选择右侧文件进行对比</span>
          </div>
          <div className="text-sm">{selectedFile.left.split('/').pop()}</div>
        </div>
      </Card>
    );
  }

  // 只选择了右侧文件
  if (!selectedFile.left && selectedFile.right) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center text-muted-foreground">
          <div className="flex items-center mb-2">
            <span className="text-primary">请选择左侧文件进行对比</span>
            <ArrowLeft className="h-4 w-4 mx-2" />
            <span>已选择右侧文件</span>
          </div>
          <div className="text-sm">{selectedFile.right.split('/').pop()}</div>
        </div>
      </Card>
    );
  }

  if (!selectedFile.left || !selectedFile.right) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="text-muted-foreground">文件比较区</div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="text-muted-foreground">加载中...</div>
      </Card>
    );
  }

  if (!fileDiff) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="text-muted-foreground">无法加载文件差异</div>
      </Card>
    );
  }

  // 使用ReactDiffViewer显示差异
  return (
    <Card
      className={`p-4 overflow-auto ${isFullScreen ? 'fixed inset-0 z-50 m-0 rounded-none' : 'h-full'}`}
      style={{ background: 'var(--background)' }}
    >
      <div className="mb-4 flex justify-between items-center text-sm">
        <div className="flex gap-2">
          <div className="text-muted-foreground">左侧:</div>
          <div className="truncate">{selectedFile.left}</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-2">
            <div className="text-muted-foreground">右侧:</div>
            <div className="truncate">{selectedFile.right}</div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullScreen}
            className="ml-2 active:scale-95 transition-transform cursor-pointer hover:bg-muted"
            title={isFullScreen ? '退出全屏' : '全屏显示'}
          >
            {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      <ReactDiffViewer
        oldValue={fileDiff.oldContent}
        newValue={fileDiff.newContent}
        disableWordDiff
        codeFoldMessageRenderer={() => (
          <span className="text-xs text-muted-foreground">展开/折叠</span>
        )}
        styles={{
          variables: {
            light: {
              diffViewerBackground: 'var(--background)',
              diffViewerColor: 'var(--foreground)',
              addedBackground: 'rgba(0, 255, 0, 0.1)',
              addedColor: 'var(--foreground)',
              removedBackground: 'rgba(255, 0, 0, 0.1)',
              removedColor: 'var(--foreground)',
              wordAddedBackground: 'rgba(0, 255, 0, 0.2)',
              wordRemovedBackground: 'rgba(255, 0, 0, 0.2)',
              gutterBackground: 'var(--background)',
              gutterColor: 'var(--foreground)',
            },
          },
          contentText: {
            fontFamily: 'monospace',
          },
        }}
      />
    </Card>
  );
}
