import React, { useMemo } from 'react';

import GravityDemoSDK from './GravitySdk';

import { GravityCode } from '../GravityCode/GravityCode';

export function GravityPreview({ code, height, refresh }: { code: GravityCode | null; height: string | number; refresh: string | number }) {
  const fixedCode = useMemo(() => fixGravityCode(code, refresh), [code, refresh]);

  if (!code || !fixedCode) {
    return null;
  }

  console.log('GravityPreview', fixedCode);

  return <GravityDemoSDK code={fixedCode} width="100%" height={height} src="https://gw.alipayobjects.com/as/g/Gravity/gravity/5.0.0-beta.10/gravityDemoSdk/index.html" />;
}

// 默认生成的代码不符合 gravity 的规则，需要处理下
function fixGravityCode(code: GravityCode | null, _unused: unknown): GravityCode | null {
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
import './global.css';

import React from 'react';
import ReactDOM from 'react-dom';
import Page from '${Object.keys(fixedModules).find((fpath) => fpath.startsWith('/src/pages/'))}';

ReactDOM.render(<Page/>, document.getElementById('root'));
`,
  };

  fixedCode.modules['/package.json'] = {
    ...fixedCode.modules['/package.json'],
    code: `{
  "name": "demo",
  "version": "1.0.0",
  "dependencies": {
    "react": "16.x",
    "react-dom": "16.x"
  }
}`,
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
@import "~@alifd/next/dist/next.css";

body {
  -webkit-font-smoothing: antialiased;
}
`,
  };

  //   fixedCode.modules['/src/layouts/BasicLayout/components/Logo/index.module.css'] = {
  //     fpath: '/src/layouts/BasicLayout/components/Logo/index.module.css',
  //     code: `.logo{
  //   display: flex;
  //   align-items: center;
  //   justify-content: center;
  //   color: #333;
  //   font-weight: bold;
  //   font-size: 14px;
  //   line-height: 22px;
  // }

  // .logo:visited, .logo:link {
  //   color: #333;
  // }

  // .logo img {
  //   height: 24px;
  //   margin-right: 10px;
  // }`
  //   };

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
