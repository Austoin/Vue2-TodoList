# 部署步骤指南

本项目支持两种部署方式：
1. **本地开发** - 适合开发调试
2. **Docker 容器化部署** - 适合生产环境

---

## 方式一：本地开发

### 步骤 1：安装依赖

```bash
npm install
```

### 步骤 2：启动后端服务器（必需）

```bash
node server.js
```

- 服务器地址：`http://localhost:4096`
- 数据文件：`tasks.json`

### 步骤 3：启动前端开发服务器

```bash
npm run dev
```

- 前端地址：`http://localhost:5173`
- 前后端都启动后才能正常使用

### 步骤 4：测试功能

1. 打开浏览器访问 http://localhost:5173
2. 添加今日/明日任务
3. 验证数据保存到 `tasks.json`

---

## 方式二：Docker 容器化部署

### 前置条件

- 安装 [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- 启用 WSL Integration（如果使用 WSL）

### 步骤 1：构建 Docker 镜像

```bash
docker build -t todolist-backend .
```

### 步骤 2：启动后端容器

```bash
docker run -d -p 4096:4096 -v ./tasks.json:/app/tasks.json --name todolist todolist-backend
```

参数说明：
- `-d`：后台运行
- `-p 4096:4096`：端口映射（宿主机:容器）
- `-v ./tasks.json:/app/tasks.json`：数据卷挂载
- `--name todolist`：容器命名

### 步骤 3：验证容器运行

```bash
docker ps
```

应该看到：
```
CONTAINER ID   IMAGE              COMMAND              CREATED        STATUS        PORTS                    NAMES
xxx            todolist-backend   "node server.js"    1 minute ago   Up 1 minute   0.0.0.0:4096->4096/tcp   todolist
```

### 步骤 4：查看日志

```bash
docker logs todolist
```

---

## 方式三：公网穿透（Cloudflare Tunnel）

将本地服务暴露到公网，无需云服务器。

### 步骤 1：启动后端容器（如果还未启动）

```bash
docker run -d -p 4096:4096 -v ./tasks.json:/app/tasks.json --name todolist todolist-backend
```

### 步骤 2：启动 Cloudflare Tunnel

**Docker 方式（推荐）：**

```bash
docker run -d --network host --name cf-tunnel cloudflare/cloudflared tunnel --url http://localhost:4096
```

**本地方式（需要安装 cloudflared）：**

```bash
# Windows 安装
choco install cloudflared

# 运行隧道
cloudflared tunnel --url http://localhost:4096
```

### 步骤 3：获取公网链接

```bash
docker logs cf-tunnel
```

输出示例：
```
+--------------------------------------------------------------------------------------------+
|  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):  |
|  https://random-name.trycloudflare.com                                                      |
+--------------------------------------------------------------------------------------------+
```

### 步骤 4：修改前端 API 地址

编辑 `src/App.vue`，将 localhost 改为公网域名：

```javascript
// 修改前
const API_BASE = 'http://localhost:4096/api'

// 修改后（使用你的公网链接）
const API_BASE = 'https://random-name.trycloudflare.com/api'
```

### 步骤 5：重启前端开发服务器

```bash
npm run dev
```

### 步骤 6：测试公网访问

1. 访问 `https://random-name.trycloudflare.com`
2. 添加任务，验证数据保存到 `tasks.json`

---

## 常用命令速查表

| 操作 | 命令 |
|------|------|
| **构建镜像** | `docker build -t todolist-backend .` |
| **启动容器** | `docker run -d -p 4096:4096 -v ./tasks.json:/app/tasks.json --name todolist todolist-backend` |
| **停止容器** | `docker stop todolist` |
| **删除容器** | `docker rm todolist` |
| **查看日志** | `docker logs todolist` |
| **查看状态** | `docker ps` |
| **重启容器** | `docker restart todolist` |
| **启动隧道** | `docker run -d --network host --name cf-tunnel cloudflare/cloudflared tunnel --url http://localhost:4096` |
| **查看隧道日志** | `docker logs cf-tunnel` |
| **停止隧道** | `docker stop cf-tunnel && docker rm cf-tunnel` |

---

## 故障排除

### 端口被占用

```bash
# 查找占用端口的进程
netstat -ano | findstr :4096

# 杀掉进程
taskkill /PID <PID> /F
```

### Docker 权限错误

确保以管理员身份运行终端。

### Cloudflare Tunnel 连不上

- 检查后端容器是否正常运行：`docker ps`
- 检查隧道日志：`docker logs cf-tunnel`
- 等待几分钟让 DNS 生效

### 数据没有保存

- 检查数据卷挂载：`docker exec todolist cat /app/tasks.json`
- 确保容器有写入权限

---

## 原理说明

### Docker 和本地程序的关系

```
你的电脑
│
├── tasks.json  ←────┬────→  Docker 容器内的 Express
│                    │        (只是桥梁)
│                    │
└── 实际数据存在这里  ←──────  读和写都是这个文件
```

**关键点：**
- Docker 容器里的 Express 直接读写 `tasks.json`
- 通过 `-v ./tasks.json:/app/tasks.json` 把容器内的文件映射到本地
- 删除 Docker 容器 → 数据还在 `tasks.json`
- 重启 Docker → 继续读 `tasks.json`

### Cloudflare Tunnel 的作用

```
┌─────────────────────────────────────────────────────────┐
│                      你的电脑                            │
│                                                         │
│  ┌─────────────────────┐      ┌─────────────────────┐   │
│  │  todolist 容器       │      │  cf-tunnel 容器      │   │
│  │                     │      │                     │   │
│  │  作用：              │      │  作用：             │   │
│  │  - 处理 API 请求     │      │  - 把内网变公网     │   │
│  │  - 读写 tasks.json  │      │  - 转发请求         │   │
│  └─────────────────────┘      └─────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

| 容器 | 作用 |
|------|------|
| **todolist** | "服务员" - 接待客人（上菜/收钱） |
| **cf-tunnel** | "前台/传话筒" - 告诉外面的人怎么找到服务员 |

---

## GitHub Pages vs Docker + Cloudflare

| 功能 | GitHub Pages | Docker + Cloudflare |
|------|-------------|---------------------|
| 前端页面 | ✅ 可以 | ✅ 可以 |
| 后端 API | ❌ 不行 | ✅ 可以 |
| 数据保存 | ❌ 不行 | ✅ 可以 |
| 实时交互 | ❌ 不行 | ✅ 可以 |

**结论：** GitHub Pages 只能托管静态文件，无法运行后端 API，不适合需要数据保存的应用。

---

## 多项目公网访问配置

### 单隧道限制

一个 Cloudflare Tunnel 只能映射**一个**本地端口：
- `--url http://localhost:4096` → 只能映射到 4096 端口

### 多项目方案

**方案 1：创建多个隧道**

```bash
# 项目 A（端口 4096）
docker run -d --network host --name cf-tunnel-a cloudflare/cloudflared tunnel --url http://localhost:4096

# 项目 B（端口 3000）
docker run -d --network host --name cf-tunnel-b cloudflare/cloudflared tunnel --url http://localhost:3000
```

**方案 2：使用 Cloudflare 仪表盘配置**

1. 在 Cloudflare Zero Trust → Access → Tunnels 中配置
2. 添加多个 Public Hostname 指向不同本地服务

---

## 常见错误及解决方案

### Error 524（超时）

**原因：** 后端服务未运行或无响应

**解决方案：**
```bash
# 1. 检查容器是否运行
docker ps

# 2. 如果没运行，启动它
docker run -d -p 4096:4096 -v ./tasks.json:/app/tasks.json --name todolist todolist-backend

# 3. 本地测试
curl http://localhost:4096/api/tasks
```

### context canceled

**原因：** 电脑休眠/网络断开/请求超时

**解决方案：**
1. 关闭电脑休眠：Windows → 设置 → 电源 → 休眠设置为"从不"
2. 保持电脑活跃（移动鼠标/敲键盘）
3. 重新创建隧道：
```bash
docker stop cf-tunnel
docker rm cf-tunnel
docker run -d --network host --name cf-tunnel cloudflare/cloudflared tunnel --url http://localhost:4096
```

### 端口被占用

**解决方案：**
```bash
# 查找占用端口的进程
netstat -ano | findstr :4096

# 杀掉进程
taskkill /PID <PID> /F
```

### 电脑关机后公网失效

**原因：** Cloudflare Tunnel 只是"隧道"，你的电脑是"服务器"

**解决方案（按推荐程度排序）：**
1. **使用云服务器**（推荐）- 24小时运行
2. **保持电脑开机**（不推荐，费电）
3. **使用云数据库** - 数据保存在云端
