# 简历项目介绍

## Vue2 TodoList - 日常任务管理应用

### 项目简介
基于 Vue.js Options API 开发的任务管理单页应用，支持今日/明日任务分类管理，具备完整的 CRUD 功能和数据持久化能力。

### 技术栈
- **前端框架**: Vue 3 (Options API 风格)
- **构建工具**: Vite
- **数据存储**: LocalStorage
- **样式方案**: CSS3 + Flexbox 响应式布局

### 核心功能
- 任务增删改查（CRUD）
- 任务完成状态切换
- 今日/明日任务分类管理
- 实时任务统计
- 本地数据持久化
- 响应式设计适配移动端

### 技术亮点
1. **组件化架构**: 采用单一职责原则，拆分为 Header、Input、List、Item 四个独立组件
2. **父子组件通信**: Props 向下传递数据，$emit 向上传递事件
3. **响应式数据管理**: 使用 computed 计算属性实现任务统计，watch 深度监听实现数据持久化
4. **列表动画**: 使用 transition-group 实现任务添加/删除的平滑过渡效果
5. **用户体验优化**: 空状态提示、悬停交互反馈、键盘回车快捷添加

### 项目收获
- 深入理解 Vue Options API 的组件开发模式
- 掌握组件通信、计算属性、侦听器等核心概念
- 实践前端组件化设计思想和单向数据流架构

---

## 简洁版（适合简历直接使用）

**Vue2 TodoList | 个人项目**
- 基于 Vue 3 Options API + Vite 构建的任务管理应用
- 实现任务 CRUD、状态切换、分类管理、LocalStorage 持久化
- 采用组件化架构，运用 Props/$emit 通信、computed/watch 响应式特性
- 使用 transition-group 实现列表动画，Flexbox 实现响应式布局