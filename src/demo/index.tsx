import './index.scss';

import React from 'react';
import { ILowCodePluginContext, init, plugins } from '@alilc/lowcode-engine';
import ComponentsPane from '@alilc/lowcode-plugin-components-pane';
import Inject, { injectAssets } from '@alilc/lowcode-plugin-inject';

import CodeGenPlugin from '../';

const preference = new Map();
preference.set('DataSourcePane', {
  importPlugins: [],
  dataSourceTypes: [
    {
      type: 'fetch',
    },
    {
      type: 'jsonp',
    },
  ],
});

(async function main() {
  await plugins.register(Inject);

  // plugin API 见 https://yuque.antfin.com/ali-lowcode/docs/cdukce
  await plugins.register(
    Object.assign(
      (ctx: ILowCodePluginContext) => {
        return {
          name: 'editor-init',
          async init() {
            // 加载物料包
            const assets = await fetchJSON('/assets.json');

            // 设置物料描述
            ctx.material.setAssets(await injectAssets(assets));

            // 加载 schema
            const schema = await fetchJSON('/schema.json');

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

            // 注册 logo 面板
            skeleton.add({
              area: 'topArea',
              type: 'Widget',
              name: 'logo',
              content: (
                <div className="editor-logo">
                  <img width="137" height="26" src="https://img.alicdn.com/imgextra/i4/O1CN013w2bmQ25WAIha4Hx9_!!6000000007533-55-tps-137-26.svg" />
                  <strong style={{ lineHeight: '26px', fontSize: '20px', verticalAlign: '6px', marginLeft: '4px' }}>出码示例</strong>
                </div>
              ),
              props: {
                align: 'left',
              },
            });
          },
        };
      },
      { pluginName: 'builtinPluginRegistry' }
    )
  );

  // 注册出码插件
  await plugins.register(CodeGenPlugin);

  // 设置内置 setter 和事件绑定、插件绑定面板
  const setterRegistry = (ctx: ILowCodePluginContext) => {
    const { setterMap, pluginMap } = (window as any).AliLowCodeEngineExt;
    return {
      name: 'ext-setters-registry',
      async init() {
        const { setters, skeleton } = ctx;
        // 注册setterMap
        setters.registerSetter(setterMap);
        // 注册插件
        // 注册事件绑定面板
        skeleton.add({
          area: 'centerArea',
          type: 'Widget',
          content: pluginMap.EventBindDialog,
          name: 'eventBindDialog',
          props: {},
        });

        // 注册变量绑定面板
        skeleton.add({
          area: 'centerArea',
          type: 'Widget',
          content: pluginMap.VariableBindDialog,
          name: 'variableBindDialog',
          props: {},
        });
      },
    };
  };
  setterRegistry.pluginName = 'setterRegistry';
  await plugins.register(setterRegistry);

  // 初始化设计器
  init(
    document.getElementById('lce-container')!,
    {
      // designMode: 'live',
      // locale: 'zh-CN',
      enableCondition: true,
      enableCanvasLock: true,
      // 默认绑定变量
      supportVariableGlobally: true,
      // simulatorUrl 在当 engine-core.js 同一个路径下时是不需要配置的！！！
      // 这里因为用的是 unpkg，在不同 npm 包，engine-core.js 和 react-simulator-renderer.js 是不同路径
      simulatorUrl: [
        'https://alifd.alicdn.com/npm/@alilc/lowcode-react-simulator-renderer@beta/dist/css/react-simulator-renderer.css',
        'https://alifd.alicdn.com/npm/@alilc/lowcode-react-simulator-renderer@beta/dist/js/react-simulator-renderer.js',
      ],
    },
    preference
  );
})();

async function fetchJSON(url: string) {
  const res = await fetch(url);
  return res.json();
}
