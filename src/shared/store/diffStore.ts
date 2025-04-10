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

export const useDiffStore = create<DiffState>()(
  persist(
    (set) => ({
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
      setSelectedFile: (side, path) =>
        set((state) => ({
          selectedFile: {
            ...state.selectedFile,
            [side]: path,
          },
        })),
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
