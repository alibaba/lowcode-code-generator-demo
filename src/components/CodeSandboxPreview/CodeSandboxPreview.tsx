import React, { useMemo, useState, useEffect } from 'react';

import { Button, Loading, Message } from '@alifd/next';
import type { CodeGenPreviewProps } from '../CodeGenPreview';
import { fixPreviewCode } from '../CodeGenPreview/fixPreviewCode';
import './CodeSandboxPreview.scss';

type CodeSandboxFiles = Record<
  string,
  {
    isBinary: boolean;
    content: string;
  }
>;

// 使用 CodeSandbox 来进行预览
// @see https://codesandbox.io/docs/api#get-request
export function CodeSandboxPreview({ code, height }: CodeGenPreviewProps) {
  const parameters = useMemo(() => {
    const files: CodeSandboxFiles = {};

    if (code && code.modules) {
      const fixedCode = fixPreviewCode(code);
      Object.values(fixedCode.modules).forEach((file) => {
        files[file?.fpath?.slice(1)] = {
          isBinary: false,
          content: file.code,
        };
      });

      // 入口文件需要顺便引入下样式
      files['src/index.js'] = {
        isBinary: false,
        content: `
// 目前需要单独引入下样式文件
import "@alifd/next/dist/next.css";
import "@alifd/pro-layout/dist/AlifdProLayout.css";

// 引入入口文件
import './app';
`,
      };
    }

    return { files, template: 'create-react-app' };
  }, [code]);

  const [state, setState] = useState({
    parameters,
    sandboxId: '',
    isCreating: false,
    hasError: false,
    error: null as unknown,
  });

  useEffect(() => {
    if (state.parameters !== parameters || state.sandboxId === 'retry' || !state.sandboxId) {
      let hasCanceled = false;
      setState((prev) => ({ ...prev, hasError: false, code, parameters, isCreating: true }));

      (async () => {
        try {
          const sandboxId = await createCodeSandbox(parameters);
          if (!hasCanceled) {
            setState((prev) => ({ ...prev, hasError: false, isCreating: false, sandboxId: sandboxId }));
          }
        } catch (error) {
          if (!hasCanceled) {
            setState((prev) => ({ ...prev, hasError: true, error, isCreating: false }));
          }
        }
      })();
      return () => {
        hasCanceled = true;
      };
    }

    return () => {};
  }, [parameters, state.sandboxId, state.parameters]);

  const handleRetry = () => {
    setState((prev) => ({ ...prev, hasError: false, sandboxId: 'retry' }));
  };

  return (
    <div className="code-gen-plugin-code-sandbox-preview" style={{ height }} data-code-sandbox-id={state.sandboxId}>
      {(() => {
        if (state.hasError) {
          return (
            <Message title="生成 CodeSandbox 预览应用失败">
              <p>详细错误：{`${state.error || '网络开小差了'}`}</p>
              <p>
                <Button onClick={handleRetry}>重新尝试下</Button>
              </p>
            </Message>
          );
        }

        return state.sandboxId ? (
          <iframe
            src={`https://codesandbox.io/embed/${state.sandboxId}?autoresize=1&fontsize=14&hidenavigation=1&theme=dark&view=preview`}
            title="CodeSandbox Preview"
            allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
            sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
          />
        ) : (
          <Loading tip="正在生成 CodeSandbox 预览应用..." />
        );
      })()}
    </div>
  );
}

async function createCodeSandbox(parameters: any) {
  if (!Object.entries(parameters?.files || {}).length) {
    return '';
  }

  const res = await fetch('https://codesandbox.io/api/v1/sandboxes/define?json=1', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(parameters),
  });
  if (!res.ok) {
    throw new Error(`创建 CodeSandbox 失败，错误码：${res.status} ${res.statusText}`);
  }

  const json = await res.json().catch((err) => {
    throw new Error(`创建 CodeSandbox 失败，服务异常(${err?.message || err || '未知异常'})`);
  });

  const { sandbox_id } = json || {};
  if (!sandbox_id || typeof sandbox_id !== 'string') {
    throw new Error(`创建 CodeSandbox 失败，服务响应异常`);
  }

  return sandbox_id;
}
