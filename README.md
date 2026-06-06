# template

uiauto.dev desktop & server的插件模板项目。方便快速创建插件。

## 使用步骤

1. **Fork 本项目**，得到你自己的插件仓库
2. 将 fork 后的项目克隆到本地插件目录：

   ```bash
   mkdir -p ~/.uiautodev/plugins
   git clone 你的仓库地址 ~/.uiautodev/plugins/你的插件名
   ```

3. 用 Claude 打开该项目，说 **"我要初始化项目"**，按 Claude.md 中的流程完成初始化

### 入门教程

假设我们现在需要一个执行shell的插件。
按照下面我说的跟AI对话。

```txt
AI问: 这个插件是做什么的？请描述一下它的功能
你回答：我需要实现一个执行shell的插件，输出shell命令，界面上显示shell的输出。
AI问：请选择一个合适的名字。（挑一个合适的就行）
AI问：请提供更多的细节？
你回答：只保留最新的一条执行历史。请直接实现吧
```

打开设备的控制界面 -> 插件 调试一下。
很快一个简单的终端小插件就做出来了。 优化一下就可以跟小伙伴们分享了。

## 本地调试

启动 uiauto.dev desktop 或 server 版本，`~/.uiautodev/plugins/` 下的插件会自动加载。开发时运行：

```bash
npm run dev
```

即可实时编译 `app.ts` 的改动。
