import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 4096;

// CORS 中间件 - 允许跨域请求
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.header('Access-Control-Allow-Headers', 'Content-Type')
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200)
    }
    next()
});
const DATA_FILE = path.join(__dirname, 'tasks.json');

// 中间件
app.use(express.json());

// 读取任务数据
function readTasks() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('读取文件失败:', error);
    }
    return {
        todayTasks: [],
        tomorrowTasks: [],
        taskIdCounter: 1,
        dailyTasks: {},
        lastSavedDate: null
    };
}

// 保存任务数据
function saveTasks(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('保存文件失败:', error);
        return false;
    }
}

// API 路由

// 获取所有任务
app.get('/api/tasks', (req, res) => {
    const tasks = readTasks();
    res.json(tasks);
});

// 保存所有任务
app.post('/api/tasks', (req, res) => {
    const tasks = req.body;
    if (saveTasks(tasks)) {
        res.json({ success: true, message: '任务保存成功' });
    } else {
        res.status(500).json({ success: false, message: '任务保存失败' });
    }
});

// 获取今日任务
app.get('/api/tasks/today', (req, res) => {
    const data = readTasks();
    res.json(data.todayTasks);
});

// 获取明日任务
app.get('/api/tasks/tomorrow', (req, res) => {
    const data = readTasks();
    res.json(data.tomorrowTasks);
});

// 更新今日任务
app.post('/api/tasks/today', (req, res) => {
    const tasks = req.body;
    const data = readTasks();
    data.todayTasks = tasks;
    if (saveTasks(data)) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

// 更新明日任务
app.post('/api/tasks/tomorrow', (req, res) => {
    const tasks = req.body;
    const data = readTasks();
    data.tomorrowTasks = tasks;
    if (saveTasks(data)) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

// 更新任务ID计数器
app.post('/api/tasks/counter', (req, res) => {
    const { counter } = req.body;
    const data = readTasks();
    data.taskIdCounter = counter;
    if (saveTasks(data)) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});
