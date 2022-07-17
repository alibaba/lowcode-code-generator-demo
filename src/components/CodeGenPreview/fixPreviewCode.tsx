import { GravityCode } from '../GravityCode/GravityCode';

// 默认生成的代码不符合在线预览的规则，需要处理下
export function fixPreviewCode(code: GravityCode | null, unused?: unknown): GravityCode | null {
  if (!code) {
    return null;
  }

  const fixedModules = Object.entries(code.modules || {})
    // 去掉隐藏文件和 html 以及 md 等无用文件:
    .filter(([fpath]) => !fpath.startsWith('/.') && !fpath.endsWith('.html') && !fpath.endsWith('.md'))
    // 所有的 jsx 文件改成 js 文件（因为 gravity 不支持 jsx）
    .map(([fpath, module]) => [fpath.replace(/\.jsx$/, '.js'), module] as const)
    .map(([fpath, module]) => [fpath.replace(/\.scss$/, '.css'), module] as const)

    .reduce(
      (acc, [fpath, module]) => ({
        ...acc,
        [fpath]: {
          ...module,
          fpath,
          code: module.code
            // 所有的 import xxx from '@/yyy' 转换为 import xxx from '/src/yyy'
            .replace(/import\s+([^\s]+)\s+from\s+['"]@\/([^'"]+)['"]/g, (_, name, path) => {
              return `import ${name} from '/src/${path}'`;
            })
            // 所有的 import styles from 'xxx.scss' 转换为 import styles from '/src/xxx.css'
            .replace(/import\s+([^\s]+)\s+from\s+['"]([^'"]+)\.scss['"]/g, (_, name, path) => {
              return `import ${name} from '${path}.css'`;
            }),
        },
      }),
      {}
    );

  const fixedCode: GravityCode = {
    ...code,
    modules: fixedModules,
  };

  fixedCode.modules['/src/app.js'] = {
    ...fixedCode.modules['/src/app.js'],
    code: `
// 注意：为了方便在浏览器中进行预览，这里简化了一些内容
import './shims';
import './global.css';

import React from 'react';
import ReactDOM from 'react-dom';

import Page from '${Object.keys(fixedModules).find((fpath) => fpath.startsWith('/src/pages/'))}';

ReactDOM.render(<Page/>, document.getElementById('root'));
`,
  };

  // 一些垫片，用于解决一些不能被 gravity 解析的问题
  // 1. @alilc/lowcode-materials 中有部分代码直接使用了全局变量 PropTypes...
  fixedCode.modules['/src/shims.js'] = {
    fpath: '/src/shims.js',
    code: `
// 一些垫片代码，用来解决直接在浏览器中预览的时候的问题
import PropTypes from 'prop-types';

window.PropTypes = PropTypes;
`,
  };

  fixedCode.modules['/package.json'] = {
    ...fixedCode.modules['/package.json'],
    code: JSON.stringify({
      name: 'demo',
      version: '1.0.0',
      dependencies: {
        react: '^16.8.3',
        'react-dom': '^16.8.3',
        ...JSON.parse(fixedCode.modules['/package.json']?.code || '{}')?.dependencies,
      },
    }),
  };

  fixedCode.modules = pickKeys(fixedCode.modules, [
    // '/tsconfig.json',
    // '/jsconfig.json',
    // '/build.json',
    // '/abc.json',
    '/package.json',
    '/src/routes.js',
    '/src/app.js',
    '/src/constants.js',
    '/src/utils.js',
    '/src/i18n.js',
    '/src/global.css',
    '/src/index.js',
    '/src/shims.js',

    // layouts 暂时先不加载吧
    // '/src/layouts/BasicLayout/index.js',
    // '/src/layouts/BasicLayout/menuConfig.js',
    // '/src/layouts/BasicLayout/components/Footer/index.js',
    // '/src/layouts/BasicLayout/components/Footer/index.module.css',
    // '/src/layouts/BasicLayout/components/Logo/index.js',
    // '/src/layouts/BasicLayout/components/Logo/index.module.css',
    // '/src/layouts/BasicLayout/components/PageNav/index.js',
    ...Object.keys(fixedModules).filter((fpath) => fpath.startsWith('/src/pages/')),
    // '/src/pages/Lowcode/index.js',
    // '/src/pages/Lowcode/index.css',
  ]);

  fixedCode.modules['/src/routes.js'] = {
    ...fixedCode.modules['/src/routes.js'],
    code: `
`,
  };

  fixedCode.modules['/src/global.css'] = {
    fpath: '/src/global.css',
    code: `
body {
  -webkit-font-smoothing: antialiased;
}
`,
  };

  Object.assign(fixedCode.modules, {
    '/src/index.html': {
      code: '<div id="root"></div>',
      fpath: '/src/index.html',
    },
    '/src/index.less': {
      fpath: '/src/index.less',
      code: `
@import "~@alifd/next/dist/next.css";
@import '~@alifd/pro-layout/dist/AlifdProLayout.css';
`,
    },
  });

  fixedCode.type = 'riddle';

  return fixedCode;
}

function pickKeys<T extends Record<string, unknown>>(data: T, keys: string[]): T {
  return keys.reduce((acc, key) => {
    if (data[key]) {
      return {
        ...acc,
        [key]: data[key],
      };
    }
    return acc;
  }, {} as T);
}
