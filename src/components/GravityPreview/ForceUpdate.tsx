import React from 'react';

export interface ForceUpdateProps {
  watchKey: string | number;
  children?: React.ReactNode;
}

export function ForceUpdate({ watchKey, children }: ForceUpdateProps) {
  return <>{[<ForceUpdateContent key={watchKey}>{children}</ForceUpdateContent>]}</>;
}

function ForceUpdateContent({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
