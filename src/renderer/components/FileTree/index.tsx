import { ChevronDown, ChevronRight, File, Folder } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useDiffStore } from '../../../shared/store/diffStore';
import type { FileInfo, FolderInfo } from '../../../shared/types/diff';
import { cn } from '../../../shared/utils';

interface FileTreeProps {
  side: 'left' | 'right';
}

interface TreeNodeProps {
  node: FileInfo | FolderInfo;
  level: number;
  side: 'left' | 'right';
}

// 文件树节点组件
function TreeNode({ node, level, side }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { setSelectedFile } = useDiffStore();

  const handleClick = useCallback(() => {
    if (node.type === 'file') {
      setSelectedFile(side, node.path);
    } else {
      setIsExpanded(!isExpanded);
    }
  }, [node, side, isExpanded, setSelectedFile]);

  const getDiffColor = (diffType?: string) => {
    switch (diffType) {
      case 'added':
        return 'text-green-500';
      case 'removed':
        return 'text-red-500';
      case 'modified':
        return 'text-yellow-500';
      default:
        return 'text-foreground';
    }
  };

  return (
    <div>
      <div
        className={cn(
          'flex items-center py-1 px-2 hover:bg-accent cursor-pointer',
          getDiffColor(node.diffType),
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
      </div>
      {node.type === 'dir' && isExpanded && 'children' in node && (
        <div>
          {node.children.map((child) => (
            <TreeNode key={child.path} node={child} level={level + 1} side={side} />
          ))}
        </div>
      )}
    </div>
  );
}

// 文件树组件
export function FileTree({ side }: FileTreeProps) {
  const { leftTree, rightTree } = useDiffStore();
  const tree = side === 'left' ? leftTree : rightTree;

  if (!tree) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        请选择文件夹
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <TreeNode node={tree} level={0} side={side} />
    </div>
  );
}
