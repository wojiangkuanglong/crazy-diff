import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FileDiff, FolderInfo, RecentFolder } from '../types/diff';

/**
 * 差异比较状态接口
 * @interface DiffState
 */
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

/**
 * 在文件树中查找指定路径的文件
 * @param {FolderInfo|null} tree - 文件树结构
 * @param {string} path - 要查找的文件路径
 * @returns {boolean} 是否找到文件
 */
const findFileInTree = (tree: FolderInfo | null, path: string): boolean => {
  if (!tree) return false;

  // 如果路径就是当前节点，找到了
  if (tree.path === path) return true;

  // 递归查找子节点
  if (tree.children) {
    for (const child of tree.children) {
      // 如果是文件且路径匹配
      if (child.type === 'file' && child.path === path) {
        return true;
      }

      // 如果是文件夹，递归查找
      if (child.type === 'dir') {
        const found = findFileInTree(child as FolderInfo, path);
        if (found) return true;
      }
    }
  }

  return false;
};

/**
 * 获取相对路径
 * @param {string} fullPath - 完整文件路径
 * @param {string|null} basePath - 基础路径
 * @returns {string|null} 相对路径，如果无法获取则返回null
 */
const getRelativePath = (fullPath: string, basePath: string | null): string | null => {
  if (!basePath || !fullPath.startsWith(basePath)) return null;

  // 确保路径以斜杠结尾，以处理子目录文件
  let normalizedBasePath = basePath;
  if (!normalizedBasePath.endsWith('/')) {
    normalizedBasePath += '/';
  }

  if (!fullPath.startsWith(normalizedBasePath)) return null;

  return fullPath.substring(normalizedBasePath.length);
};

/**
 * 创建Zustand存储，管理文件差异比较状态
 */
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
      /**
       * 设置左侧文件夹
       * @param {string|null} path - 文件夹路径
       */
      setLeftFolder: (path) =>
        set((state) => {
          // 如果右侧没有选择文件夹，则自动选择相同的文件夹
          if (path && !state.rightFolder) {
            return {
              leftFolder: path,
              rightFolder: path,
            };
          }
          return { leftFolder: path };
        }),

      /**
       * 设置右侧文件夹
       * @param {string|null} path - 文件夹路径
       */
      setRightFolder: (path) =>
        set((state) => {
          // 如果左侧没有选择文件夹，则自动选择相同的文件夹
          if (path && !state.leftFolder) {
            return {
              leftFolder: path,
              rightFolder: path,
            };
          }
          return { rightFolder: path };
        }),

      /**
       * 设置左侧文件树
       * @param {FolderInfo|null} tree - 文件树结构
       */
      setLeftTree: (tree) => set({ leftTree: tree }),

      /**
       * 设置右侧文件树
       * @param {FolderInfo|null} tree - 文件树结构
       */
      setRightTree: (tree) => set({ rightTree: tree }),

      /**
       * 设置选中文件并自动查找另一侧的对应文件
       * @param {('left'|'right')} side - 文件所在的侧边
       * @param {string|null} path - 文件路径
       */
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
            const otherPath = `${otherFolder}/${relativePath}`;

            // 打印调试信息
            console.log('寻找对应文件:', {
              currentFile: path,
              relativePath,
              otherPath,
            });

            // 检查另一侧是否存在相同路径的文件
            const fileExists = findFileInTree(otherTree, otherPath);

            if (fileExists) {
              // 如果存在，则自动选择
              newSelectedFile[otherSide] = otherPath;
              console.log('找到对应文件:', otherPath);
            } else {
              console.log('未找到对应文件');
            }
          }
        }

        set({ selectedFile: newSelectedFile });
      },

      /**
       * 设置文件差异
       * @param {FileDiff|null} diff - 文件差异数据
       */
      setFileDiff: (diff) => set({ fileDiff: diff }),

      /**
       * 添加最近使用的文件夹
       * @param {RecentFolder} folder - 文件夹信息
       */
      addRecentFolder: (folder) =>
        set((state) => ({
          recentFolders: [
            folder,
            ...state.recentFolders.filter((f) => f.path !== folder.path),
          ].slice(0, 10), // 只保留最近10个
        })),

      /**
       * 设置文件过滤规则
       * @param {Object} filters - 过滤规则
       * @param {string[]} filters.include - 包含的文件模式
       * @param {string[]} filters.exclude - 排除的文件模式
       */
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
