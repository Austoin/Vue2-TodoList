<script>
import TodoHeader from './components/TodoHeader.vue'
import TodoInput from './components/TodoInput.vue'
import TodoList from './components/TodoList.vue'

const API_BASE = 'http://localhost:4096/api'

export default {
    components: {
        TodoHeader,
        TodoInput,
        TodoList
    },

    data() {
        return {
            // 今日任务列表
            todayTasks: [],
            // 明日任务列表
            tomorrowTasks: [],
            // 任务ID计数器
            taskIdCounter: 1
        }
    },

    methods: {
        // 保存所有任务到后端
        async saveTasks() {
            try {
                console.log('正在保存任务...')
                const response = await fetch(`${API_BASE}/tasks`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        todayTasks: this.todayTasks,
                        tomorrowTasks: this.tomorrowTasks,
                        taskIdCounter: this.taskIdCounter
                    })
                })
                const result = await response.json()
                console.log('保存结果:', result)
            } catch (error) {
                console.error('保存任务失败:', error)
                console.error('API 地址:', API_BASE)
            }
        },

        // 从后端加载任务
        async loadTasks() {
            try {
                const response = await fetch(`${API_BASE}/tasks`)
                const data = await response.json()
                this.todayTasks = data.todayTasks || []
                this.tomorrowTasks = data.tomorrowTasks || []
                this.taskIdCounter = data.taskIdCounter || 1

                // 计算最大ID以避免ID冲突
                const allTasks = [...this.todayTasks, ...this.tomorrowTasks]
                if (allTasks.length > 0) {
                    const maxId = Math.max(...allTasks.map(task => task.id))
                    this.taskIdCounter = maxId + 1
                }
            } catch (error) {
                console.error('加载任务失败:', error)
            }
        },

        // 添加今日任务
        addTodayTask(taskTitle) {
            if (taskTitle.trim() === '') return
            this.todayTasks.push({
                id: this.taskIdCounter++,
                title: taskTitle,
                completed: false,
                createdAt: new Date().toLocaleString('zh-CN')
            })
            this.saveTasks()
        },

        // 添加明日任务
        addTomorrowTask(taskTitle) {
            if (taskTitle.trim() === '') return
            this.tomorrowTasks.push({
                id: this.taskIdCounter++,
                title: taskTitle,
                completed: false,
                createdAt: new Date().toLocaleString('zh-CN')
            })
            this.saveTasks()
        },

        // 删除今日任务
        deleteTodayTask(taskId) {
            this.todayTasks = this.todayTasks.filter(task => task.id !== taskId)
            this.saveTasks()
        },

        // 删除明日任务
        deleteTomorrowTask(taskId) {
            this.tomorrowTasks = this.tomorrowTasks.filter(task => task.id !== taskId)
            this.saveTasks()
        },

        // 切换今日任务完成状态
        toggleTodayTask(taskId) {
            const task = this.todayTasks.find(task => task.id === taskId)
            if (task) {
                task.completed = !task.completed
            }
            this.saveTasks()
        },

        // 切换明日任务完成状态
        toggleTomorrowTask(taskId) {
            const task = this.tomorrowTasks.find(task => task.id === taskId)
            if (task) {
                task.completed = !task.completed
            }
            this.saveTasks()
        }
    },

    computed: {
        // 今日已完成任务数
        todayCompletedCount() {
            return this.todayTasks.filter(task => task.completed).length
        },

        // 明日已完成任务数
        tomorrowCompletedCount() {
            return this.tomorrowTasks.filter(task => task.completed).length
        }
    },

    // 生命周期钩子：组件挂载时从后端加载数据
    async mounted() {
        // 先检查 localStorage 是否有旧数据，有则迁移到后端
        const savedTodayTasks = localStorage.getItem('todayTasks')
        const savedTomorrowTasks = localStorage.getItem('tomorrowTasks')
        const savedCounter = localStorage.getItem('taskIdCounter')

        if (savedTodayTasks || savedTomorrowTasks || savedCounter) {
            // 有旧数据，先迁移到后端
            this.todayTasks = savedTodayTasks ? JSON.parse(savedTodayTasks) : []
            this.tomorrowTasks = savedTomorrowTasks ? JSON.parse(savedTomorrowTasks) : []
            this.taskIdCounter = savedCounter ? parseInt(savedCounter) : 1

            // 计算最大ID
            const allTasks = [...this.todayTasks, ...this.tomorrowTasks]
            if (allTasks.length > 0) {
                const maxId = Math.max(...allTasks.map(task => task.id))
                this.taskIdCounter = maxId + 1
            }

            // 保存到后端
            await this.saveTasks()
            console.log('数据已从 localStorage 迁移到后端')

            // 清除 localStorage
            localStorage.removeItem('todayTasks')
            localStorage.removeItem('tomorrowTasks')
            localStorage.removeItem('taskIdCounter')
        } else {
            // 没有旧数据，从后端加载
            await this.loadTasks()
        }
    }
}
</script>

<template>
    <div class="app-container">
        <TodoHeader />
        
        <div class="main-content">
            <!-- 今日任务区域 -->
            <div class="task-section today-section">
                <h2 class="section-title">📅 今日任务</h2>
                <p class="task-stats">
                    已完成: {{ todayCompletedCount }} / {{ todayTasks.length }}
                </p>
                <TodoInput 
                    placeholder="添加今日任务..." 
                    @add-task="addTodayTask" 
                />
                <TodoList 
                    :tasks="todayTasks" 
                    @delete-task="deleteTodayTask"
                    @toggle-task="toggleTodayTask"
                />
            </div>

            <!-- 明日任务区域 -->
            <div class="task-section tomorrow-section">
                <h2 class="section-title">🌅 明日任务</h2>
                <p class="task-stats">
                    已完成: {{ tomorrowCompletedCount }} / {{ tomorrowTasks.length }}
                </p>
                <TodoInput 
                    placeholder="添加明日任务..." 
                    @add-task="addTomorrowTask" 
                />
                <TodoList 
                    :tasks="tomorrowTasks" 
                    @delete-task="deleteTomorrowTask"
                    @toggle-task="toggleTomorrowTask"
                />
            </div>
        </div>
    </div>
</template>

<style>
/* 全局样式重置 */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
    background-color: #f5f5f5;
    background-image: 
        linear-gradient(rgba(200, 200, 200, 0.5) 1px, transparent 1px),
        linear-gradient(90deg, rgba(200, 200, 200, 0.5) 1px, transparent 1px);
    background-size: 20px 20px;
    min-height: 100vh;
}

.app-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    min-height: 100vh;
}

.main-content {
    display: flex;
    gap: 30px;
    flex-wrap: wrap;
    justify-content: center;
    margin-top: 30px;
}

.task-section {
    flex: 1;
    min-width: 350px;
    max-width: 500px;
    background: rgba(255, 255, 255, 0.98);
    border-radius: 15px;
    padding: 25px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    border: 1px solid #e0e0e0;
}

.today-section {
    border-top: 5px solid #4CAF50;
}

.tomorrow-section {
    border-top: 5px solid #2196F3;
}

.section-title {
    font-size: 1.5rem;
    color: #333;
    margin-bottom: 10px;
    text-align: center;
}

.task-stats {
    text-align: center;
    color: #666;
    font-size: 0.9rem;
    margin-bottom: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .main-content {
        flex-direction: column;
        align-items: center;
    }

    .task-section {
        width: 100%;
        max-width: 100%;
    }
}
</style>