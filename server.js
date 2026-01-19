import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 4096;

// 移除默认的 X-Powered-By 头，增强安全性
app.disable('x-powered-by');

// CORS 中间件 - 允许跨域请求
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    // 继续执行后续中间件，OPTIONS请求也会经过安全检查
    next()
});

// 安全中间件 - 防止 MIME 类型嗅探（所有请求都会经过这里，包括 OPTIONS）
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // 处理 OPTIONS 预检请求
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200)
    }
    next();
});

// 缓存控制中间件 - 性能优化
app.use((req, res, next) => {
    // API 请求不缓存
    if (req.path.startsWith('/api')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Surrogate-Control', 'no-store');
    } else {
        // 静态资源缓存 1 小时
        res.setHeader('Cache-Control', 'public, max-age=3600');
    }
    next();
});

const DATA_FILE = path.join(__dirname, 'tasks.json');

// 中间件 - 强制 UTF-8 编码
app.use(express.json({ charset: 'utf-8' }));

// 读取任务数据 - 支持新旧两种数据格式
function readTasks() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            const parsedData = JSON.parse(data);
            
            // 检查是否是新格式（包含 allTasks）
            if (parsedData.allTasks !== undefined) {
                return parsedData;
            }
            
            // 旧格式转换为新格式
            console.log('检测到旧数据格式，正在转换...');
            return convertToNewFormat(parsedData);
        }
    } catch (error) {
        console.error('读取文件失败:', error);
    }
    // 返回默认的新格式数据
    return {
        allTasks: [],
        taskIdCounter: 1,
        currentDate: null,
        taskExpirationDays: 7,
        archivedTasks: {}
    };
}

// 将旧格式转换为新格式
function convertToNewFormat(oldData) {
    const newTasks = [];
    let maxId = 1;
    
    // 转换 todayTasks 和 tomorrowTasks
    if (oldData.todayTasks && Array.isArray(oldData.todayTasks)) {
        oldData.todayTasks.forEach(task => {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const todayStr = `${year}-${month}-${day}`;
            
            newTasks.push({
                ...task,
                date: todayStr
            });
            if (task.id >= maxId) maxId = task.id + 1;
        });
    }
    
    if (oldData.tomorrowTasks && Array.isArray(oldData.tomorrowTasks)) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const year = tomorrow.getFullYear();
        const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const day = String(tomorrow.getDate()).padStart(2, '0');
        const tomorrowStr = `${year}-${month}-${day}`;
        
        oldData.tomorrowTasks.forEach(task => {
            newTasks.push({
                ...task,
                date: tomorrowStr
            });
            if (task.id >= maxId) maxId = task.id + 1;
        });
    }
    
    // 转换 dailyTasks
    if (oldData.dailyTasks && typeof oldData.dailyTasks === 'object') {
        Object.keys(oldData.dailyTasks).forEach(dateStr => {
            if (Array.isArray(oldData.dailyTasks[dateStr])) {
                oldData.dailyTasks[dateStr].forEach(task => {
                    newTasks.push({
                        ...task,
                        date: dateStr
                    });
                    if (task.id >= maxId) maxId = task.id + 1;
                });
            }
        });
    }
    
    // 获取今天的日期作为默认 currentDate
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    
    return {
        allTasks: newTasks,
        taskIdCounter: oldData.taskIdCounter || maxId,
        currentDate: oldData.lastSavedDate || todayStr,
        taskExpirationDays: oldData.taskExpirationDays || 7,
        archivedTasks: oldData.archivedTasks || {}
    };
}

// 保存任务数据 - 只保存有效数据
function saveTasks(data) {
    try {
        // 验证数据格式
        if (!data || typeof data !== 'object') {
            console.error('保存失败：数据格式无效');
            return false;
        }
        
        // 确保所有必要字段都存在
        const validData = {
            allTasks: Array.isArray(data.allTasks) ? data.allTasks : [],
            taskIdCounter: typeof data.taskIdCounter === 'number' ? data.taskIdCounter : 1,
            currentDate: typeof data.currentDate === 'string' ? data.currentDate : null,
            taskExpirationDays: typeof data.taskExpirationDays === 'number' ? data.taskExpirationDays : 7,
            archivedTasks: data.archivedTasks && typeof data.archivedTasks === 'object' ? data.archivedTasks : {}
        };
        
        fs.writeFileSync(DATA_FILE, JSON.stringify(validData, null, 2), 'utf8');
        console.log('数据保存成功');
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

// 保存所有任务 - 只在有实际数据变化时保存
app.post('/api/tasks', (req, res) => {
    const newData = req.body;
    
    // 验证数据
    if (!newData || typeof newData !== 'object') {
        return res.status(400).json({ success: false, message: '数据格式无效' });
    }
    
    // 读取当前数据
    const currentData = readTasks();
    
    // 比较数据是否有变化
    const hasChanges = JSON.stringify(currentData) !== JSON.stringify(newData);
    
    if (hasChanges) {
        console.log('检测到数据变化，保存新数据');
        if (saveTasks(newData)) {
            res.json({ success: true, message: '任务保存成功' });
        } else {
            res.status(500).json({ success: false, message: '任务保存失败' });
        }
    } else {
        console.log('数据无变化，跳过保存');
        res.json({ success: true, message: '数据无变化，无需保存' });
    }
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
    console.log(`服务器运行在 http://0.0.0.0:${PORT}`);
});
