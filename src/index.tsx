import * as CodeGenerator from '@alilc/lowcode-code-generator/standalone-loader';
import type { ILowCodePluginContext } from '@alilc/lowcode-engine';

import { CodeGenActionBtn } from './components/CodeGenActionBtn';

export interface ICodeGenPlugin {
  generateCode: typeof CodeGenerator.generateCode;
}

export type CodeGenPluginOptions = {
  /** 是否要禁用出码的动作按钮(默认: 否) */
  disableCodeGenActionBtn?: boolean;
};

export default (ctx: ILowCodePluginContext, options?: CodeGenPluginOptions) => {
  return {
    // 插件名，注册环境下唯一
    name: 'codeGenerator',
    // 依赖的插件（插件名数组）
    dep: [],
    // 插件对外暴露的数据和方法
    exports() {
      return {
        generateCode: CodeGenerator.generateCode,
      };
    },
    // 插件的初始化函数，在引擎初始化之后会立刻调用
    async init() {
      try {
        if (!options?.disableCodeGenActionBtn) {
          ctx.skeleton.add({
            type: 'Custom',
            name: 'code-generator',
            area: 'topArea',
            props: {
              align: 'right',
              width: 100,
            },
            content: CodeGenActionBtn,
            contentProps: { ctx },
          });
        }



        // 提前初始化下，这样后面用的时候更快
        CodeGenerator.init();
      } catch (e) {
        console.error('[plugin-code-geneator] failed to init: ', e);
        throw e;
      }
    },
  };
};
