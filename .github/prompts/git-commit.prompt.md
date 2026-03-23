---
mode: 'agent'
description: '分析当前 git 暂存区和工作区的所有更改，自动生成规范的 commit message 并提交'
tools: ['run_in_terminal', 'get_terminal_output', 'read_file', 'grep_search']
---

# Git 提交当前更改

分析并提交当前项目（`d:\Flutter_Study\Website_GAARAHK`）的所有未提交更改。

## 操作步骤

1. **查看当前状态**  
   运行 `git status` 和 `git diff --stat` 了解哪些文件发生了变化。

2. **分析变更内容**  
   逐一读取或 diff 改动的关键文件，理解每处修改的目的。

3. **生成 commit message**  
   按照以下规范生成 commit message：
   - 第一行：`<type>(<scope>): <简短描述>`（不超过 72 字）
   - type 取值：`feat`（新功能）、`fix`（修复）、`style`（样式）、`refactor`（重构）、`chore`（杂项）
   - 空一行后列出详细 bullet 说明（中文），每条以 `-` 开头

   示例：
   ```
   feat(frontend): 添加欢迎横幅、暗色模式与搜索功能

   - 新增 WelcomeSection 全屏横幅，浮动封面图背景动画
   - Navbar 添加搜索图标（Ctrl+K）和暗色切换按钮
   - 新建 SearchModal 组件，支持防抖搜索
   - 侧边栏新增分类列表和标签云，支持点击过滤
   - 文章列表支持分页（每页 10 篇）
   ```

4. **暂存并提交**  
   运行：
   ```bash
   git add -A
   git commit -m "<生成的 commit message>"
   ```

5. **确认结果**  
   运行 `git log --oneline -5` 展示最新 5 条提交历史，确认提交成功。
