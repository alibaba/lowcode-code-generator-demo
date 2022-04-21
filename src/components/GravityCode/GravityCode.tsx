export type GravityCode = {
  type: string;
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
