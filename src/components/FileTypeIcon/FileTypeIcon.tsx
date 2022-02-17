import './FileTypeIcon.scss';
import React from 'react';

export type FileTypeIconProps = React.HtmlHTMLAttributes<HTMLSpanElement> & {
  type: string;
};

export function FileTypeIcon({ type, ...props }: FileTypeIconProps) {
  return <i {...props} className={`file-types-iconfont file-types-icon-${type} ${props.className || ''}`} />;
}
