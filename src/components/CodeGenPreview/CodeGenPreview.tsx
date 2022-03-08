import React from 'react';
import { Tab } from '@alifd/next';

import { useIsInIntranet } from './useIsInIntranet';
import type { GravityCode } from '../GravityCode';
import { GravityPreview } from '../GravityPreview';
import { CodeSandboxPreview } from '../CodeSandboxPreview';
import { ForceUpdate } from '../GravityPreview/ForceUpdate';

import './CodeGenPreview.scss';

export type CodeGenPreviewProps = {
  code: GravityCode | null;
  height: string | number;
  refresh: string | number;
};

export function CodeGenPreview(props: CodeGenPreviewProps) {
  const isInIntranet = useIsInIntranet();
  const previewPanes: Array<{
    title: string;
    available?: boolean;
    render: () => React.ReactElement;
  }> = [
    {
      title: '基于 Gravity 预览',
      available: isInIntranet,
      render: () => <GravityPreview {...props} />,
    },
    {
      title: '基于 CodeSandbox 预览',
      available: true,
      render: () => <CodeSandboxPreview {...props} />,
    },
  ];

  const availablePreviewPanes = previewPanes.filter((pane) => pane.available);
  if (availablePreviewPanes.length === 1) {
    return availablePreviewPanes[0].render();
  }

  return (
    <Tab className="code-gen-preview-tabs" size="small">
      {availablePreviewPanes.map((pane) => (
        <Tab.Item title={pane.title} key={pane.title}>
          <ForceUpdate watchKey={props.refresh}>{pane.render()}</ForceUpdate>
        </Tab.Item>
      ))}
    </Tab>
  );
}
