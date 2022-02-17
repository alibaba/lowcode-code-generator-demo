export type GravityCode = {
  type: 'demo';
  modules: Record<
    string,
    {
      entry?: 1;
      packagejson?: 1;
      code: string;
      fpath: string;
    }
  >;
};
