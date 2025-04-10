import {
  ChevronDown,
  ChevronRight,
  File,
  FileEdit,
  Folder,
  Loader2,
  Minus,
  Plus,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import type { FileInfo, FolderInfo } from '../../../shared/types/diff';
import { cn } from '../../../shared/utils';

interface FileTreeProps {
  side: 'left' | 'right';
  isLoading?: boolean;
  tree?: FolderInfo | null;
  selectedFile?: string | null;
  onFileSelect?: (path: string) => void;
}

interface TreeNodeProps {
  node: FileInfo | FolderInfo;
  level: number;
  side: 'left' | 'right';
  selectedFile?: string | null;
  onFileSelect?: (path: string) => void;
}

// 文件树节点组件
function TreeNode({ node, level, side, selectedFile, onFileSelect }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level === 0);

  // 判断当前节点是否被选中
  const isSelected = node.type === 'file' && selectedFile === node.path;

  const handleClick = useCallback(() => {
    if (node.type === 'file') {
      onFileSelect?.(node.path);
    } else {
      setIsExpanded(!isExpanded);
    }
  }, [node, isExpanded, onFileSelect]);

  const getDiffColor = (diffType?: string) => {
    switch (diffType) {
      case 'added':
        return 'text-green-500 font-medium';
      case 'removed':
        return 'text-red-500 font-medium';
      case 'modified':
        return 'text-yellow-500 font-medium';
      default:
        return 'text-foreground';
    }
  };

  const getDiffIcon = (diffType?: string) => {
    switch (diffType) {
      case 'added':
        return <Plus className="h-3 w-3 text-green-500 ml-1.5" />;
      case 'removed':
        return <Minus className="h-3 w-3 text-red-500 ml-1.5" />;
      case 'modified':
        return <FileEdit className="h-3 w-3 text-yellow-500 ml-1.5" />;
      default:
        return null;
    }
  };

  return (
    <div>
      <div
        className={cn(
          'flex items-center py-1 px-2 hover:bg-accent cursor-pointer',
          getDiffColor(node.diffType),
          isSelected && 'bg-primary-foreground border-l-2 border-primary font-medium',
        )}
        style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
        onClick={handleClick}
      >
        {node.type === 'dir' ? (
          isExpanded ? (
            <ChevronDown className="w-4 h-4 mr-1" />
          ) : (
            <ChevronRight className="w-4 h-4 mr-1" />
          )
        ) : (
          <div className="w-4 h-4 mr-1" />
        )}
        {node.type === 'dir' ? (
          <Folder className="w-4 h-4 mr-2" />
        ) : (
          <File className="w-4 h-4 mr-2" />
        )}
        <span className="truncate">{node.name}</span>
        {getDiffIcon(node.diffType)}
      </div>
      {node.type === 'dir' && isExpanded && 'children' in node && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              level={level + 1}
              side={side}
              selectedFile={selectedFile}
              onFileSelect={onFileSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// 文件树组件
export function FileTree({ side, isLoading, tree, selectedFile, onFileSelect }: FileTreeProps) {
  // 统计差异文件数量
  const countDiffFiles = (node: FolderInfo | FileInfo) => {
    const counts = {
      added: 0,
      removed: 0,
      modified: 0,
      total: 0,
    };

    if (node.diffType === 'added') counts.added++;
    if (node.diffType === 'removed') counts.removed++;
    if (node.diffType === 'modified') counts.modified++;

    counts.total++;

    if (node.type === 'dir' && 'children' in node) {
      for (const child of node.children) {
        const childCounts = countDiffFiles(child);
        counts.added += childCounts.added;
        counts.removed += childCounts.removed;
        counts.modified += childCounts.modified;
        counts.total += childCounts.total;
      }
    }

    return counts;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full flex-col gap-2 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span>加载文件夹内容...</span>
      </div>
    );
  }

  if (!tree) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        请选择文件夹
      </div>
    );
  }

  const diffCounts = countDiffFiles(tree);

  return (
    <div className="h-full flex flex-col">
      {side === 'right' && (
        <div className="bg-muted p-1 flex justify-between items-center text-xs">
          <div>总文件: {diffCounts.total}</div>
          <div className="flex gap-2">
            <span className="text-green-500">新增: {diffCounts.added}</span>
            <span className="text-red-500">删除: {diffCounts.removed}</span>
            <span className="text-yellow-500">修改: {diffCounts.modified}</span>
          </div>
        </div>
      )}
      <div className="overflow-auto flex-1">
        <TreeNode
          node={tree}
          level={0}
          side={side}
          selectedFile={selectedFile}
          onFileSelect={onFileSelect}
        />
      </div>
    </div>
  );
}
