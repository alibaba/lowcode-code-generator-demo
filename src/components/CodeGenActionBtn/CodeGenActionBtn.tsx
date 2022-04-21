import './CodeGenActionBtn.scss';

import React, { useState } from 'react';

import * as CodeGenerator from '@alilc/lowcode-code-generator/standalone-loader';
import type { ILowCodePluginContext } from '@alilc/lowcode-engine';
import { ProjectSchema, TransformStage } from '@alilc/lowcode-types';
import { Button, Drawer, Loading, Message } from '@alifd/next';

import { CodeGenResult } from '../CodeGenResult';

export function CodeGenActionBtn({ ctx }: { ctx: ILowCodePluginContext }) {
  const [state, setState] = useState({
    visible: false,
    hasError: false,
    error: null as Error | null,
    loading: false,
    result: null as CodeGenerator.Result | null,
    schema: null as ProjectSchema |null,
    originalSchema: null as ProjectSchema |null,
  });

  const handleClick = async () => {
    try {
      // 打开基于 Gravity 的编辑器/出码预览器
      setState((prev) => ({ ...prev, loading: true, visible: true, hasError: false }));

      // 获取 schema，并修正
      const originalSchema = await ctx.project.exportSchema(TransformStage.Save);
      const schema = await fixSchema(originalSchema);
      console.log('got schema: ', schema);

      setState(prev => ({...prev, schema, originalSchema}));

      // 出码...
      const result = await CodeGenerator.generateCode({
        solution: 'icejs',
        schema,
        flattenResult: true,
      });

      console.log('generated: ', result);

      setState((prev) => ({ ...prev, loading: false, result }));
    } catch (e) {
      console.error('failed to run code generator: ', e);
      setState((prev) => ({ ...prev, hasError: true, error: e instanceof Error ? e : new Error(`${(e as { message: string })?.message || e}`) }));
    }
  };

  return (
    <>
      <Button type="primary" onClick={handleClick}>
        出码
      </Button>
      <Drawer
        visible={state.visible}
        title="出码结果"
        width="95vw"
        onClose={() => {
          setState((prev) => ({ ...prev, visible: false }));
        }}
      >
        <div className="code-gen-plugin-result">
          {(() => {
            if (state.hasError) {
              return (
                <Message type="error" title="出错了">
                  {state.error?.message}
                </Message>
              );
            }

            if (state.loading) {
              return <Loading className="code-gen-plugin-loading" tip="正在出码..." />;
            }

            return <CodeGenResult result={state.result} schema={state.schema} originalSchema={state.originalSchema} />;
          })()}
        </div>
      </Drawer>
    </>
  );
}

export async function fixSchema(schema: ProjectSchema): Promise<ProjectSchema> {
  return deepClone({
    ...schema,
    componentsMap: schema.componentsMap.filter((c: { package: string }) => c.package), // 去掉没有 package 的组件
  });
}

function deepClone<T>(x: T): T {
  try {
    return JSON.parse(JSON.stringify(x));
  } catch (e) {
    throw new Error(`failed to clone schema -- ${e}`);
  }
}
