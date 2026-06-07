# 当前应用 (Current App)

uiauto.dev 插件 — 显示当前设备上正在运行的应用信息，支持复制包名、Activity、PID，以及强制停止和启动应用。

## 功能

- 自动检测设备当前前台应用的 **包名 (Package)**、**Activity**、**PID**
- 一键复制包名、Activity、PID 到剪贴板
- **强制停止** 应用（`am force-stop`）
- **启动应用**（`am start`）
- 刷新按钮重新获取当前应用信息

## 安装

将项目克隆到 uiauto.dev 插件目录：

```bash
git clone https://github.com/codeskyblue/uiautodev-plugin-app-current ~/.uiautodev/plugins/uiautodev-plugin-app-current
cd ~/.uiautodev/plugins/uiautodev-plugin-app-current
npm install
npm run build
```

## 开发

```bash
npm install          # 安装依赖
npm run fetch-types  # 拉取 plugin-runtime.d.ts 类型定义
npm run dev          # 开发模式，监听 app.tsx 变化自动编译
npm run build        # 编译为 app.js
```

启动 uiauto.dev desktop 或 server 版本，`~/.uiautodev/plugins/` 下的插件会自动加载。

## 插件模板

本项目基于 [uiauto.dev 插件模板](https://github.com/uiautodev-plugins/template) 创建。
