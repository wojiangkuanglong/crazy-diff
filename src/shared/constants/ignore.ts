/**
 * 默认需要忽略的文件夹和文件
 */
export const DEFAULT_IGNORE_PATTERNS = [
  // 依赖文件夹
  'node_modules',
  '.pnpm-store',
  '.yarn',
  'bower_components',
  'jspm_packages',

  // 构建输出
  'dist',
  'build',
  'out',
  '.next',
  '.nuxt',
  '.output',
  'target',

  // 版本控制
  '.git',
  '.svn',
  '.hg',

  // 编辑器
  '.idea',
  '.vscode',
  '.vs',
  '*.swp',
  '*.swo',
  '.DS_Store',

  // 日志和缓存
  '*.log',
  'npm-debug.log*',
  'yarn-debug.log*',
  'yarn-error.log*',
  '.cache',
  '.temp',
  '.tmp',

  // 环境文件
  '.env',
  '.env.*',
  '.env.local',
  '.env.*.local',

  // 其他
  'coverage',
  '.nyc_output',
  '.eslintcache',
  '.stylelintcache',
  '.prettiercache',
];
