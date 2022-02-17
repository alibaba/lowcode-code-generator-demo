import './CodeGenResult.scss';

import React, { useEffect, useState } from 'react';

import FileSaver from 'file-saver';
import JSZip from 'jszip';

import { Result } from '@alilc/lowcode-code-generator/standalone-loader';
import { Collapse, Message } from '@alifd/next';

import { GravityCode } from '../GravityCode';
import { GravityPreview } from '../GravityPreview';
import { SourcesView } from '../SourcesView';
import { ProjectSchema } from '@alilc/lowcode-types';

export function CodeGenResult({ result, schema }: { result: Result | null | undefined; schema: ProjectSchema|null; originalSchema: ProjectSchema|null; }) {
  const [paneState, setPaneState] = useState({ expandedKeys: ['sources', 'preview'] });
  const [gravityCode, setGravityCode] = useState<GravityCode | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    setGravityCode(convertCodeGenResult(result,schema));
  }, [result]);

  if (!result) {
    return null;
  }

  const sourcesViewHeight = paneState.expandedKeys.includes('preview') ? '40vh' : '80vh';
  const gravityDemoHeight = paneState.expandedKeys.includes('sources') ? '40vh' : '80vh';
  const handleDownloadSources = async (e: React.MouseEvent) => {
    try {
      e.preventDefault();
      e.stopPropagation();

      const zip = new JSZip();

      Object.values(gravityCode?.modules || {}).forEach((file) => {
        zip.file(file.fpath, file.code);
      });

      await zip.generateAsync({ type: 'blob' }).then((content) => {
        FileSaver.saveAs(content, 'ali-lowcode-generated-sources.zip');
      });
    } catch (e) {
      console.log('failed to download sources: ', e);
      Message.error('下载失败！');
    }
  };

  return (
    <div className="code-gen-result">
      <Collapse
        expandedKeys={paneState.expandedKeys}
        onExpand={(expandedKeys) => {
          setPaneState({ expandedKeys });
        }}
      >
        <Collapse.Panel
          title={
            <span>
              出码生成的源代码{' '}
              <a href="javascript:void(0)" onClick={handleDownloadSources}>
                导出/下载 zip 包
              </a>
            </span>
          }
          key="sources"
        >
          {gravityCode != null && <SourcesView height={sourcesViewHeight} code={gravityCode} onCodeChange={setGravityCode} />}
        </Collapse.Panel>

        <Collapse.Panel
          title={
            <span>
              在线预览{' '}
              <a
                href="#refresh"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setRefresh(Date.now());
                }}
              >
                刷新
              </a>
            </span>
          }
          key="preview"
        >
          <div className="code-gen-result-gravity-demo" style={{ height: gravityDemoHeight }}>
            <GravityPreview code={gravityCode} height={gravityDemoHeight} refresh={refresh} />
          </div>
        </Collapse.Panel>
      </Collapse>
    </div>
  );
}

function convertCodeGenResult(result: Result | null | undefined, schema: ProjectSchema|null): GravityCode {
  const schemaFiles = {
    '/.project-schema.json': {
      fpath: '/.project-schema.json',
      code: `${JSON.stringify(schema, null, 2)}\n`
    },
  };

  if (!result || !Array.isArray(result) || !result.length) {
    return {
      type: 'demo',
      modules: schemaFiles,
    };
  }

  const code: GravityCode = {
    type: 'demo',
    modules: result.reduce(
      (acc, file) => ({
        ...acc,
        [`/${file.pathName}`]: {
          fpath: `/${file.pathName}`,
          code: file.content,
          entry: undefined,
          packagejson: ['package.json'].includes(file.pathName) ? 1 : undefined,
        },
      }),
      {}
    ),
  };

  let foundEntry = false;

  // 设置入口文件
  ['index.js', 'index.ts', 'index.tsx', 'app.js', 'app.ts', 'app.tsx'].forEach((fileName) => {
    if (!foundEntry) {
      const filePath = `/src/${fileName}`;
      if (code.modules[filePath]) {
        foundEntry = true;
        code.modules[filePath].entry = 1;
      }
    }
  });

  if (!foundEntry) {
    console.warn('Failed to find entry file for demo.');
  }

  // 补充 schema 文件
  Object.assign(code.modules, schemaFiles);

  return getDemoCode() || code;
}

export function getDemoCode(): GravityCode | null {
  if (Math.random() < 2) {
    return null;
  }
  return {
    type: 'demo',
    modules: {
      '/src/index.js': {
        fpath: '/src/index.js',
        code: `import "./global.css";

import React from 'react';
import ReactDOM from 'react-dom';
import DemoPage from '@/pages/Demo';

console.debug("Running app");

const App = () => <DemoPage />;

ReactDOM.render(<App />, document.getElementById('root'));

`,
        entry: 1,
      },
      '/src/pages/Demo.js': {
        fpath: '/src/pages/Demo.js',
        code: `import React from 'react';
export default () => <div>Hello world!</div>;`,
      },
      '/package.json': {
        fpath: '/package.json',
        code: `{
  "name": "demo",
  "version": "1.0.0",
  "dependencies": {
    "react": "16.x",
    "react-dom": "16.x" 
  }
}`,
        packagejson: 1,
      },
    },
  };
}
