import './index.scss';

import { ILowCodePluginContext, init, plugins } from '@alilc/lowcode-engine';
import ComponentsPane from '@alilc/lowcode-plugin-components-pane';

import CodeGenPlugin from '../';

(async function main() {
  // plugin API 见 https://yuque.antfin.com/ali-lowcode/docs/cdukce
  await plugins.register(
    Object.assign(
      (ctx: ILowCodePluginContext) => {
        return {
          name: 'editor-init',
          async init() {
            // 加载物料包
            const assets = await import('./assets.json');
    
            // 设置物料描述
            ctx.material.setAssets(assets as any);
    
            // 加载 schema
            const schema = await import('./schema.json');
    
            // 加载 schema
            ctx.project.openDocument(schema as any);
          },
        };
      },
      { pluginName: 'editorInit' }
    )
  );

  await plugins.register(
    Object.assign(
      (ctx: ILowCodePluginContext) => {
        return {
          name: 'builtin-plugin-registry',
          async init() {
            const { skeleton, project } = ctx;
    
            // 注册组件面板
            const componentsPane = skeleton.add({
              area: 'leftArea',
              type: 'PanelDock',
              name: 'componentsPane',
              content: ComponentsPane,
              contentProps: {},
              props: {
                align: 'top',
                icon: 'zujianku',
                description: '组件库',
              },
            });
            componentsPane?.disable?.();
            project.onSimulatorRendererReady(() => {
              componentsPane?.enable?.();
            });
          },
        };
      },
      { pluginName: 'builtinPluginRegistry' }
    )
  );

  // 注册出码插件
  await plugins.register(CodeGenPlugin);

  // 初始化设计器
  init(document.getElementById('lce-container')!, {
    // designMode: 'live',
    // locale: 'zh-CN',
    enableCondition: true,
    enableCanvasLock: true,
    // 默认绑定变量
    supportVariableGlobally: true,
  });
})();

