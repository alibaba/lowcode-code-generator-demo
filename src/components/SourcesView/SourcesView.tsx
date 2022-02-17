import './SourcesView.scss';

import React, { useMemo, useRef, useState } from 'react';

import naturalCompare from 'string-natural-compare';

import { Tree } from '@alifd/next';
import Editor from '@alilc/lowcode-plugin-base-monaco-editor';
import '@alilc/lowcode-plugin-base-monaco-editor/lib/style';

import { FileTypeIcon } from '../FileTypeIcon';
import { GravityCode } from '../GravityCode';

type TreeNode = {
  label: string;
  key: string;
  icon?: React.ReactNode;
  children?: TreeNode[];
};

type GravityCodeModule = GravityCode['modules'][string];

const FILE_TYPES_ICON_MAP: Record<string, string> = {
  js: 'js',
  jsx: 'jsx',
  ts: 'ts',
  tsx: 'ts',
  json: 'json',
};


const DEBOUNCE_UPDATE_INTERVAL_IN_MS = 500;

export function SourcesView({ height, code, onCodeChange }: { height: string; code: GravityCode; onCodeChange: (code: GravityCode) => void }) {
  const [state, setState] = useState(() => {
    const allFiles = Object.values(code.modules);
    const currentFile = [allFiles.find((x) => /pages.+(js|ts)x?$/.test(x.fpath)), allFiles.find((m) => m.entry)].filter(Boolean)[0];
    return {
      currentFile,
      selectedKeys: [currentFile?.fpath],
    };
  });

  const ref = useRef({
    debounceTimer: null as ReturnType<typeof setTimeout> | null,
  });

  const fileTreeNodes = useMemo(() => {
    const files = Object.values(code.modules);
    const rootNodes = [] as Array<TreeNode>;

    files.forEach((file) => {
      const addFileToNodes = (currentNodes: TreeNode[], basePath: string, path: string, file: GravityCodeModule) => {
        const [head, ...tail] = path.split('/').filter(Boolean);
        if (tail.length === 0) {
          currentNodes.push({
            label: head,
            key: file.fpath,
            children: [],
            icon: getFileIcon(file.fpath),
          });
        } else {
          let parentNode = currentNodes.find((node) => node.label === head);
          if (!parentNode) {
            parentNode = {
              label: head,
              key: `${basePath}/${head}`,
              children: [],
              icon: <FileTypeIcon type="folder" />,
            };
            currentNodes.push(parentNode);
          }

          parentNode.children = parentNode.children || [];

          addFileToNodes(parentNode.children, `${basePath}/${head}`, tail.join('/'), file);
        }
      };

      addFileToNodes(rootNodes, '/', file.fpath, file);
    });

    return sortNodes(rootNodes);
  }, [code]);

  const defaultExpandedKeys = useMemo(() => {
    return Array.from(new Set([...fileTreeNodes.filter((node) => node.children?.length).map((node) => node.key), ...state.selectedKeys, 'src', 'src/pages']).values());
  }, [fileTreeNodes, state.selectedKeys]);

  return (
    <div className="code-gen-sources-view" style={{ height }}>
      <div className="sources-panes">
        <div className="file-tree-pane">
          <Tree
            dataSource={fileTreeNodes}
            selectable
            selectedKeys={state.selectedKeys}
            defaultExpandedKeys={defaultExpandedKeys}
            onSelect={(keys) => {
              setState((prev) => {
                if (ref.current.debounceTimer) {
                  ref.current.debounceTimer = null;
                }

                return { selectedKeys: keys, currentFile: code.modules[keys[0]] || prev.currentFile };
              });
            }}
          />
        </div>
        <div className="source-code-pane" style={{ height }} >
          <Editor
            height={calcHeightInPx(height) - 2} // 注意：这里的编辑器会有边框所以要减掉一点
            language={getFileLanguage(state.currentFile?.fpath)}
            saveViewState
            defaultValue={state.currentFile?.code}
            path={state.currentFile?.fpath}
            onChange={(value) => {
              console.debug('[monaco editor] onChange: %o (currentFile: %o)', { value }, state.currentFile);
              const currentFile = state.currentFile;
              if (currentFile) {
                if (ref.current.debounceTimer) {
                  clearTimeout(ref.current.debounceTimer);
                }

                ref.current.debounceTimer = setTimeout(() => {
                  ref.current.debounceTimer = null;
                  onCodeChange({
                    ...code,
                    modules: {
                      ...code.modules,
                      [currentFile.fpath]: {
                        ...currentFile,
                        code: value || '',
                      },
                    },
                  });
                }, DEBOUNCE_UPDATE_INTERVAL_IN_MS);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}

function getFileIcon(file: string | undefined) {
  const type = FILE_TYPES_ICON_MAP[(file || '').split('.').pop() || ''] || 'text';
  return <FileTypeIcon type={type} />;
}

function getFileLanguage(file: string | undefined) {
  switch ((file || '').split('.').pop()) {
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'css':
      return 'css';
    case 'scss':
      return 'scss';
    case 'less':
      return 'less';
    case 'json':
      return 'json';
    case 'md':
      return 'markdown';
    default:
      return 'text';
  }
}

function sortNodes(nodes: TreeNode[]): TreeNode[] {
  return nodes
    .sort((a, b) => {
      if (a.children?.length && !b.children?.length) {
        return -1;
      }

      if (!a.children?.length && b.children?.length) {
        return 1;
      }
      return naturalCompare(a.label, b.label);
    })
    .map((node) => {
      if (node.children?.length) {
        return {
          ...node,
          children: sortNodes(node.children),
        };
      }
      return node;
    });
}

function calcHeightInPx(height: string): number {
  const div = document.createElement('div');
  div.setAttribute('style', `position:fixed;top:0;left:0;width:0;height:${height};`);
  document.body.appendChild(div);
  return Number(div.getBoundingClientRect().height.toFixed(0));
}

