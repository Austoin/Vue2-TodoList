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
