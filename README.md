# 集团低代码引擎 - 出码插件（浏览器里进行出码）

## 简介

本项目是出码模块的对应的浏览器里进行出码的插件

## 使用方法

1. 安装依赖 `npm install --save @alilc/lowcode-plugin-code-generator`
2. 注册插件:

```ts
import { plugins } from '@alilc/lowcode-engine';
import CodeGenPlugin from '@alilc/lowcode-plugin-code-generator';

// 在你的初始化函数中：
await plugins.register(CodeGenPlugin);

// 如果您不希望自动加上出码按钮，则可以这样注册
await plugins.register(CodeGenPlugin, { disableCodeGenActionBtn: true });

```

然后运行你的低代码编辑器项目即可。

参考：低代码编辑器的 Demo: <https://github.com/alibaba/lowcode-demo>

## 插件 API

本插件提供了出码的 API，注册了插件后, 可以这么样来用:

```js
import { plugins } from '@alilc/lowcode-engine';

const codeGenResult = plugins.codeGenerator.generateCode({
  solution: 'icejs',
  schema: await ctx.project.exportSchema(),
});

console.log('出码结果:', codeGenResult); // 这里就是出码结果

```

## 本地开发

常规两步即可开发调试：`npm i && npm start`

## 共建

欢迎参与共建，欢迎直接 fork 一份改改，补充您所需要的特性或修复 bug，然后提 PR 过来:

-- 代码仓库：<https://github.com/alibaba/lowcode-code-generator-demo>