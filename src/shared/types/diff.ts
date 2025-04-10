// 文件差异类型
export type DiffType = 'added' | 'removed' | 'modified' | 'unchanged';

// 基础节点接口
export interface BaseNode {
  path: string; // 路径
  name: string; // 名称
  type: 'file' | 'dir'; // 类型
  diffType?: DiffType; // 差异类型
}

// 文件信息接口
export interface FileInfo extends BaseNode {
  type: 'file';
  size?: number; // 文件大小
  modifiedTime?: Date; // 修改时间
}

// 文件夹信息接口
export interface FolderInfo extends BaseNode {
  type: 'dir';
  children: (FileInfo | FolderInfo)[]; // 子文件/文件夹
}

// 文件内容差异接口
export interface FileDiff {
  oldContent: string; // 旧文件内容
  newContent: string; // 新文件内容
  changes: Array<{
    value: string; // 变更内容
    type: DiffType; // 变更类型
  }>;
}

// 最近使用的文件夹记录
export interface RecentFolder {
  path: string;
  name: string;
  lastUsed: Date;
}
