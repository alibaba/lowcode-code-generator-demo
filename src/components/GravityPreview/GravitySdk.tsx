import React, { useRef, useEffect } from 'react';

// const GRAVITY_PREFIX = 'lowcodeGravityPreview';
// const GRAVITY_PREFIX = 'gravityDemoSdk';
const GRAVITY_PREFIX = 'gravityRiddleSdk';

const defaultProps = {
  // src: "https://gw.alipayobjects.com/as/g/Gravity/gravity/5.0.0-beta.10/gravityDemoSdk/index.html"
  src: 'https://gw.alipayobjects.com/as/g/Gravity/gravity/5.0.0-beta.10/gravityRiddleSdk/index.html',
  code: {},
  target: null,
  style: {
    backgroundColor: '#fff',
    border: 'none',
    position: null,
    display: 'block',
    overflow: null,
  },
  scrolling: null,
  importance: null,
  sandbox: null,
  loading: null,
  styles: null,
  name: null,
  className: null,
  referrerPolicy: null,
  title: null,
  allow: 'clipboard-read;clipboard-write;camera;microphone',
  id: null,
  'aria-labelledby': null,
  'aria-hidden': null,
  'aria-label': null,
  width: null,
  height: null,
  onLoad: null,
  onMouseOver: null,
  onMouseOut: null,
};

let height;
let boostState;
let iframe;
let isPrivate;

export function getHeight() {
  return height;
}

export function refresh() {
  const channel = GRAVITY_PREFIX;
  if (iframe) {
    iframe.current.contentWindow.postMessage({
      type: `${channel}_reload`,
    }, '*');
  }
}

export function clear() {
  const channel = GRAVITY_PREFIX;
  if (iframe) {
    iframe.current.contentWindow.postMessage({
      type: `${channel}_remove_cache`,
    }, '*');
  }
}

export function getBoostState() {
  return boostState;
}

export function toggleBoostState() {
  const channel = GRAVITY_PREFIX;
  if (iframe) {
    iframe.current.contentWindow.postMessage({
      type: `${channel}_toggle_boost_state`,
    }, '*');
  }
}

export function isPrivateMode() {
  return isPrivate;
}

export function change(filename, content) {
  const channel = GRAVITY_PREFIX;
  if (iframe) {
    iframe.current.contentWindow.postMessage({
      type: `${channel}_file_change`,
      filename,
      content,
    }, '*');
  }
}

export default (props) => {
  const iframeEl = useRef(null);
  iframe = iframeEl;
  // let iframeElOnload = useRef(false);
  useEffect(() => {
    // iframeEl.current.contentWindow.location.reload();
    const channel = GRAVITY_PREFIX;
    iframeEl.current.contentWindow.postMessage({
      type: `${channel}_reload`,
    }, '*');

    function handler(msg) {
      const channel = GRAVITY_PREFIX;
      const { type } = msg.data;
      if (type) {
        if (type === `${channel}_force_update`) {
          if (props.force) {
            props.force();
          }
        }
        if (type === `${channel}_code_fetch`) {
          if (props.code && props.code.modules) {
            const { modules } = props.code;
            let imn = '';
            const im = Object.keys(modules).some((m) => {
              if (modules[m].code === null || modules[m].code === undefined) {
                imn = m;
                return m;
              }

              return false;
            });
            if (!im) {
              iframeEl.current.contentWindow.postMessage({
                type: `${channel}_code_fetch`,
                code: props.code,
              }, '*');
            } else {
              console.warn(`模块 ${imn} 代码存在异常，code 为 ${modules[imn].code}`);
            }
          }
        }
        if (type === `${channel}_get_height`) {
          height = msg.data && msg.data.height || 0;
        }
        if (type === `${channel}_boost_state`) {
          boostState = msg.data && msg.data.boostState;
        }
        if (type === `${channel}_is_private_mode`) {
          isPrivate = msg.data && msg.data.isPrivateMode;
        }
      }
    }

    window.addEventListener('message', handler);

    return () => {
      window.removeEventListener('message', handler);
    };

    // return iframeEl.current.addEventListener('load', () => {
    //   iframeElOnload = true;
    //   iframeEl.current.contentWindow.postMessage({
    //     type: 'demo_fetch_code',
    //     code,
    //   });
    // });
  }, [props.code]);

  // useEffect(() => {
  //   if (iframeElOnload) {
  //     iframeEl.current.contentWindow.postMessage({
  //       type: 'demo_fetch_code',
  //       code,
  //     });
  //   }
  // }, [
  //   props.code
  // ]);

  const newProps = {
    ...defaultProps,
    ...props,
  };

  let final = Object.create(null);
  for (let prop of Object.keys(newProps)) {
    if (newProps[prop] != null) {
      final[prop] = newProps[prop];
    }
  }
  for (let i of Object.keys(final.style)) {
    if (final.style[i] == null) {
      delete final.style[i];
    }
  }

  return (
    // eslint-disable-next-line
    <iframe
      ref={iframeEl}
      { ...final }
    />
  );
};
