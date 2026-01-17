# Vue2 TodoList 开发日志

## 日期: 2026-01-17

### 完成的功能

1. 修改主题样式
   - 将背景改为网格效果（20x20px）
   - 调整任务卡片样式
   - 文件: src/App.vue

2. 创建 JSON 后端服务器
   - 创建 Express 服务器: server.js
   - API 接口:
     - GET /api/tasks - 获取所有任务
     - POST /api/tasks - 保存所有任务
   - 数据文件: tasks.json
   - 端口: 4096

3. 修改前端调用后端 API
   - 替换 localStorage 为后端 API 调用
   - 添加 loadTasks() 方法加载数据
   - 添加 saveTasks() 方法保存数据
   - 文件: src/App.vue

4. 添加自动迁移功能
   - 从 localStorage 自动迁移到后端
   - 迁移完成后清除 localStorage

5. 解决跨域问题 (CORS)
   - 添加 CORS 中间件
   - 允许所有来源的跨域请求

### 遇到的问题及解决

1. 端口冲突
   - 端口 3000, 3001, 8080 被占用
   - 解决: 改为端口 4096

2. ES Module 兼容性问题
   - package.json 包含 "type": "module"
   - 解决: 将 server.js 改为 ES Module 格式 (import/export)

3. CORS 跨域错误
   - 前端(Vite)和后端(Express)运行在不同端口
   - 错误: "Failed to fetch"
   - 解决: 添加 CORS 中间件

### 待处理

- 重启后端服务器以应用 CORS 修复
