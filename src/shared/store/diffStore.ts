import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FileDiff, FolderInfo, RecentFolder } from '../types/diff';

interface DiffState {
  // 选中的文件夹
  leftFolder: string | null;
  rightFolder: string | null;

  // 文件树结构
  leftTree: FolderInfo | null;
  rightTree: FolderInfo | null;

  // 当前选中的文件
  selectedFile: {
    left: string | null;
    right: string | null;
  };

  // 文件内容差异
  fileDiff: FileDiff | null;

  // 最近使用的文件夹
  recentFolders: RecentFolder[];

  // 文件过滤规则
  fileFilters: {
    include: string[];
    exclude: string[];
  };

  // Actions
  setLeftFolder: (path: string | null) => void;
  setRightFolder: (path: string | null) => void;
  setLeftTree: (tree: FolderInfo | null) => void;
  setRightTree: (tree: FolderInfo | null) => void;
  setSelectedFile: (side: 'left' | 'right', path: string | null) => void;
  setFileDiff: (diff: FileDiff | null) => void;
  addRecentFolder: (folder: RecentFolder) => void;
  setFileFilters: (filters: { include: string[]; exclude: string[] }) => void;
}

// 在文件树中查找指定路径的文件
const findFileInTree = (tree: FolderInfo | null, path: string): boolean => {
  if (!tree) return false;

  // 如果路径就是当前节点，找到了
  if (tree.path === path) return true;

  // 递归查找子节点
  if (tree.children) {
    for (const child of tree.children) {
      if (child.path === path) return true;
      if (child.type === 'dir' && 'children' in child) {
        const found = findFileInTree(child as FolderInfo, path);
        if (found) return true;
      }
    }
  }

  return false;
};

// 获取相对路径
const getRelativePath = (fullPath: string, basePath: string | null): string | null => {
  if (!basePath || !fullPath.startsWith(basePath)) return null;
  return fullPath.substring(basePath.length);
};

export const useDiffStore = create<DiffState>()(
  persist(
    (set, get) => ({
      // 初始状态
      leftFolder: null,
      rightFolder: null,
      leftTree: null,
      rightTree: null,
      selectedFile: {
        left: null,
        right: null,
      },
      fileDiff: null,
      recentFolders: [],
      fileFilters: {
        include: ['*'],
        exclude: [],
      },

      // Actions
      setLeftFolder: (path) => set({ leftFolder: path }),
      setRightFolder: (path) => set({ rightFolder: path }),
      setLeftTree: (tree) => set({ leftTree: tree }),
      setRightTree: (tree) => set({ rightTree: tree }),
      setSelectedFile: (side, path) => {
        const state = get();
        const otherSide = side === 'left' ? 'right' : 'left';

        // 首先更新当前侧的选中文件
        const newSelectedFile = {
          ...state.selectedFile,
          [side]: path,
        };

        // 如果没有选择文件，则直接更新状态
        if (!path) {
          set({ selectedFile: newSelectedFile });
          return;
        }

        // 获取两侧文件夹路径
        const currentFolder = side === 'left' ? state.leftFolder : state.rightFolder;
        const otherFolder = side === 'left' ? state.rightFolder : state.leftFolder;
        const otherTree = side === 'left' ? state.rightTree : state.leftTree;

        // 如果另一侧有文件夹和文件树
        if (otherFolder && otherTree && currentFolder) {
          // 获取当前文件的相对路径
          const relativePath = getRelativePath(path, currentFolder);

          if (relativePath) {
            // 尝试构建另一侧的完整路径
            const otherPath = otherFolder + relativePath;

            // 检查另一侧是否存在相同路径的文件
            const fileExists = findFileInTree(otherTree, otherPath);

            if (fileExists) {
              // 如果存在，则自动选择
              newSelectedFile[otherSide] = otherPath;
            }
          }
        }

        set({ selectedFile: newSelectedFile });
      },
      setFileDiff: (diff) => set({ fileDiff: diff }),
      addRecentFolder: (folder) =>
        set((state) => ({
          recentFolders: [
            folder,
            ...state.recentFolders.filter((f) => f.path !== folder.path),
          ].slice(0, 10), // 只保留最近10个
        })),
      setFileFilters: (filters) => set({ fileFilters: filters }),
    }),
    {
      name: 'diff-storage', // localStorage的key
      partialize: (state) => ({
        recentFolders: state.recentFolders,
        fileFilters: state.fileFilters,
      }), // 只持久化这些字段
    },
  ),
);
