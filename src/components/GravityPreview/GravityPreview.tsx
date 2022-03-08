import React, { useMemo } from 'react';

import GravityDemoSDK from './GravitySdk';
import { ForceUpdate } from './ForceUpdate';

import { GravityCode } from '../GravityCode/GravityCode';
import { fixPreviewCode } from '../CodeGenPreview/fixPreviewCode';

export function GravityPreview({ code, height, refresh }: { code: GravityCode | null; height: string | number; refresh: string | number }) {
  const fixedCode = useMemo(() => fixGravityCode(code, refresh), [code, refresh]);

  if (!code || !fixedCode) {
    return null;
  }

  console.log('GravityPreview', fixedCode);

  return (
    <ForceUpdate watchKey={refresh}>
      <GravityDemoSDK code={fixedCode} width="100%" height={height} />
    </ForceUpdate>
  );
}

function fixGravityCode(code: GravityCode | null, refresh: unknown) {
  if (!code) {
    return null;
  }

  const fixed = fixPreviewCode(code);

  Object.assign(fixed.modules, {
    '/src/html.js': {
      fpath: '/src/html.js',
      code: "function runScript(script){\n  const newScript = document.createElement('script');\n  newScript.innerHTML = script.innerHTML;\n  const src = script.getAttribute('src');\n  if (src) newScript.setAttribute('src', src);\n\n  document.head.appendChild(newScript);\n  document.head.removeChild(newScript);\n}\n\nfunction setHTMLWithScript(container, rawHTML){\n  container.innerHTML = rawHTML;\n  const scripts = container.querySelectorAll('script');\n  for (let script of scripts) {\n    runScript(script);\n  }\n} var html = window.BrowserFS.BFSRequire('fs').readFileSync('/~/src/index.html').toString();setHTMLWithScript(document.getElementById(\"riddleContainer\"), html);",
      entry: 1,
    },
  });

  return fixed;
}
