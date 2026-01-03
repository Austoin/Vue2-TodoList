<script>
import TodoHeader from './components/TodoHeader.vue'
import TodoInput from './components/TodoInput.vue'
import TodoList from './components/TodoList.vue'

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
        // 添加今日任务
        addTodayTask(taskTitle) {
            if (taskTitle.trim() === '') return
            this.todayTasks.push({
                id: this.taskIdCounter++,
                title: taskTitle,
                completed: false,
                createdAt: new Date().toLocaleString('zh-CN')
            })
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
        },

        // 删除今日任务
        deleteTodayTask(taskId) {
            this.todayTasks = this.todayTasks.filter(task => task.id !== taskId)
        },

        // 删除明日任务
        deleteTomorrowTask(taskId) {
            this.tomorrowTasks = this.tomorrowTasks.filter(task => task.id !== taskId)
        },

        // 切换今日任务完成状态
        toggleTodayTask(taskId) {
            const task = this.todayTasks.find(task => task.id === taskId)
            if (task) {
                task.completed = !task.completed
            }
        },

        // 切换明日任务完成状态
        toggleTomorrowTask(taskId) {
            const task = this.tomorrowTasks.find(task => task.id === taskId)
            if (task) {
                task.completed = !task.completed
            }
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

    watch: {
        // 监听今日任务变化，保存到本地存储
        todayTasks: {
            handler(newTasks) {
                localStorage.setItem('todayTasks', JSON.stringify(newTasks))
            },
            deep: true
        },

        // 监听明日任务变化，保存到本地存储
        tomorrowTasks: {
            handler(newTasks) {
                localStorage.setItem('tomorrowTasks', JSON.stringify(newTasks))
            },
            deep: true
        }
    },

    // 生命周期钩子：组件挂载时从本地存储加载数据
    mounted() {
        const savedTodayTasks = localStorage.getItem('todayTasks')
        const savedTomorrowTasks = localStorage.getItem('tomorrowTasks')
        const savedCounter = localStorage.getItem('taskIdCounter')

        if (savedTodayTasks) {
            this.todayTasks = JSON.parse(savedTodayTasks)
        }
        if (savedTomorrowTasks) {
            this.tomorrowTasks = JSON.parse(savedTomorrowTasks)
        }
        if (savedCounter) {
            this.taskIdCounter = parseInt(savedCounter)
        }

        // 计算最大ID以避免ID冲突
        const allTasks = [...this.todayTasks, ...this.tomorrowTasks]
        if (allTasks.length > 0) {
            const maxId = Math.max(...allTasks.map(task => task.id))
            this.taskIdCounter = maxId + 1
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
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
    background: rgba(255, 255, 255, 0.95);
    border-radius: 20px;
    padding: 25px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
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