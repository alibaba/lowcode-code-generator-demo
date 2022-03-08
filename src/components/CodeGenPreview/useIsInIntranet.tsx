import React, { useEffect } from 'react';

// 预先检测下是否在内网环境中
let isInIntranetPromise = detectIsInIntranet();

/**
 * 判断是否在内网环境中中
 */
export function useIsInIntranet() {
  const [state, setState] = React.useState({ isInIntranet: false });

  useEffect(() => {
    // 如果预加载失败了，可以尝试重试下
    isInIntranetPromise
      .catch(() => {
        isInIntranetPromise = detectIsInIntranet();
        return isInIntranetPromise;
      })
      .then((isInIntranet) => {
        setState({ isInIntranet });
      });
  }, []);

  return state.isInIntranet;
}

/**
 * 判断是否在内网环境中中
 */
async function detectIsInIntranet() {
  try {
    const res = await fetch('https://dev.g.alicdn.com/ali-lowcode/ali-lowcode-materials/1.1.0/schema.json');
    if (res.ok) {
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}
