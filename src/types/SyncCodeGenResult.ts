export type SyncCodeGenResult = {
  type: 'SYNC_RESULT';
  sourceFiles: Array<{
    pathName: string;
    content: string;
  }>;
};
