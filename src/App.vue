<script>
import TodoHeader from './components/TodoHeader.vue'
import TodoInput from './components/TodoInput.vue'
import TodoList from './components/TodoList.vue'
import Calendar from './components/Calendar.vue'

const API_BASE = 'http://localhost:4096/api'

export default {
    components: {
        TodoHeader,
        TodoInput,
        TodoList,
        Calendar
    },

    data() {
        return {
            // 主题状态
            isDark: true,
            // 背景图片路径
            backgroundImage: '',
            // 背景透明度
            backgroundOpacity: 0.3,
            // 是否显示背景设置面板
            showBackgroundSettings: false,
            // 今日任务列表
            todayTasks: [],
            // 明日任务列表
            tomorrowTasks: [],
            // 任务ID计数器
            taskIdCounter: 1,
            // 每日历史任务记录 { '2024-01-15': [tasks...] }
            dailyTasks: {},
            // 是否显示日历
            showCalendar: false,
            // 上次保存的日期
            lastSavedDate: null,
            // 标记是否已初始化
            isInitialized: false,
            // 任务过期策略: 0-永不过期, 7-7天, 30-30天
            taskExpirationDays: 7,
            // 已归档的历史任务
            archivedTasks: {},
            // 保存重试次数
            saveRetryCount: 0,
            maxSaveRetries: 3,
            // 保存失败提示
            saveErrorMessage: '',
            // 是否显示归档
            showArchive: false,
            // 背景URL输入
            backgroundUrlInput: ''
        }
    },

    methods: {
        // 切换主题
        toggleTheme() {
            this.isDark = !this.isDark
            localStorage.setItem('theme', this.isDark ? 'dark' : 'light')
            this.applyTheme()
        },

        // 应用主题
        applyTheme() {
            document.body.classList.toggle('dark-theme', this.isDark)
        },

        // 处理背景图片URL
        handleBackgroundUrlInput() {
            this.handleBackgroundUrl(this.backgroundUrlInput)
        },

        // 处理背景图片URL
        handleBackgroundUrl(url) {
            if (!url.trim()) {
                alert('请输入有效的URL')
                return
            }
            
            // 验证URL格式
            try {
                new URL(url)
            } catch (e) {
                alert('请输入有效的URL格式')
                return
            }
            
            this.backgroundImage = url
            localStorage.setItem('backgroundImage', url)
            localStorage.setItem('backgroundOpacity', this.backgroundOpacity)
        },

        // 处理背景图片上传
        handleBackgroundUpload(event) {
            const file = event.target.files[0]
            if (file) {
                // 检查文件大小 (限制10MB)
                if (file.size > 10 * 1024 * 1024) {
                    alert('图片大小不能超过10MB')
                    return
                }
                
                const reader = new FileReader()
                reader.onload = async (e) => {
                    const imageData = e.target.result
                    
                    // 尝试使用IndexedDB存储大图片
                    if (imageData.length > 1024 * 1024) { // 大于1MB使用IndexedDB
                        const saved = await this.saveImageToIndexedDB(imageData)
                        if (saved) {
                            this.backgroundImage = 'indexeddb://background'
                            localStorage.setItem('backgroundImage', 'indexeddb://background')
                        } else {
                            // IndexedDB失败，回退到localStorage
                            this.backgroundImage = imageData
                            localStorage.setItem('backgroundImage', imageData)
                        }
                    } else {
                        // 小图片使用localStorage
                        this.backgroundImage = imageData
                        localStorage.setItem('backgroundImage', imageData)
                    }
                    
                    localStorage.setItem('backgroundOpacity', this.backgroundOpacity)
                }
                reader.readAsDataURL(file)
            }
        },

        // 更新背景透明度
        updateBackgroundOpacity(event) {
            this.backgroundOpacity = parseFloat(event.target.value)
            localStorage.setItem('backgroundOpacity', this.backgroundOpacity)
        },

        // 重置背景设置
        resetBackground() {
            this.backgroundImage = ''
            this.backgroundOpacity = 0.3
            localStorage.removeItem('backgroundImage')
            localStorage.removeItem('backgroundOpacity')
            // 清理IndexedDB中的图片
            this.clearIndexedDBImage()
        },

        // IndexedDB 相关方法
        async getIndexedDB() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open('TodoAppDB', 1)
                request.onerror = () => reject(request.error)
                request.onsuccess = () => resolve(request.result)
                request.onupgradeneeded = (event) => {
                    const db = event.target.result
                    if (!db.objectStoreNames.contains('images')) {
                        db.createObjectStore('images', { keyPath: 'id' })
                    }
                }
            })
        },

        async saveImageToIndexedDB(imageData, id = 'background') {
            try {
                const db = await this.getIndexedDB()
                const transaction = db.transaction(['images'], 'readwrite')
                const store = transaction.objectStore('images')
                store.put({ id, data: imageData, timestamp: Date.now() })
                return true
            } catch (error) {
                console.error('保存图片到IndexedDB失败:', error)
                return false
            }
        },

        async getImageFromIndexedDB(id = 'background') {
            try {
                const db = await this.getIndexedDB()
                return new Promise((resolve, reject) => {
                    const transaction = db.transaction(['images'], 'readonly')
                    const store = transaction.objectStore('images')
                    const request = store.get(id)
                    request.onerror = () => reject(request.error)
                    request.onsuccess = () => resolve(request.result ? request.result.data : null)
                })
            } catch (error) {
                console.error('从IndexedDB获取图片失败:', error)
                return null
            }
        },

        async clearIndexedDBImage(id = 'background') {
            try {
                const db = await this.getIndexedDB()
                const transaction = db.transaction(['images'], 'readwrite')
                const store = transaction.objectStore('images')
                store.delete(id)
                return true
            } catch (error) {
                console.error('删除IndexedDB图片失败:', error)
                return false
            }
        },

        // 获取今天的日期字符串 YYYY-MM-DD
        getTodayDateString() {
            const now = new Date()
            const year = now.getFullYear()
            const month = String(now.getMonth() + 1).padStart(2, '0')
            const day = String(now.getDate()).padStart(2, '0')
            return `${year}-${month}-${day}`
        },

        // 获取今天的显示日期
        getTodayDisplayDate() {
            const now = new Date()
            return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`
        },

        // 获取明天的显示日期
        getTomorrowDisplayDate() {
            const tomorrow = new Date()
            tomorrow.setDate(tomorrow.getDate() + 1)
            return `${tomorrow.getFullYear()}年${tomorrow.getMonth() + 1}月${tomorrow.getDate()}日`
        },

        // 获取指定日期的下一天日期字符串
        getNextDayDateString(dateStr) {
            const date = new Date(dateStr)
            date.setDate(date.getDate() + 1)
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            return `${year}-${month}-${day}`
        },

        // 获取当前选中日期的下一天显示日期
        getCurrentNextDayDisplayDate() {
            if (this.lastSavedDate) {
                const nextDateStr = this.getNextDayDateString(this.lastSavedDate)
                const date = new Date(nextDateStr)
                return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
            }
            return this.getTomorrowDisplayDate()
        },

        // 初始化任务数据
        async initializeTasks() {
            if (this.isInitialized) return
            this.isInitialized = true

            const today = this.getTodayDateString()
            const savedDate = this.lastSavedDate

            console.log('========== 初始化任务开始 ==========')
            console.log('今天日期:', today)
            console.log('保存的日期:', savedDate)
            console.log('当前 todayTasks 数量:', this.todayTasks.length)

            // 如果保存的日期不是今天，保存历史并切换到今天
            if (savedDate && savedDate !== today) {
                console.log('从历史日期切换到今天...')

                // 1. 将当前任务保存到历史（昨天的任务）
                if (this.todayTasks.length > 0) {
                    this.dailyTasks[savedDate] = JSON.parse(JSON.stringify(this.todayTasks))
                    console.log(`已保存 ${savedDate} 的任务记录到历史`)
                }
            }

            // 2. 更新 lastSavedDate 为今天
            this.lastSavedDate = today
            localStorage.setItem('lastTaskDate', today)

            // 3. 如果 dailyTasks 中有今天的任务，加载今天的任务
            // 如果没有今天的任务且 todayTasks 为空，保持空数组
            if (this.dailyTasks[today] && this.dailyTasks[today].length > 0) {
                console.log('从历史记录加载今天的任务')
                this.todayTasks = JSON.parse(JSON.stringify(this.dailyTasks[today]))
            } else if (this.todayTasks.length > 0) {
                // 如果 todayTasks 有数据（从后端加载的昨天的任务），
                // 但我们现在已经切换到今天，所以这些任务应该保存到今天
                // 检查这些任务是否属于今天
                const taskDate = savedDate || today
                if (taskDate !== today && this.todayTasks.length > 0) {
                    // 任务是昨天的，今天还没有任务，保持空数组
                    console.log('任务是昨天的，今天还没有任务')
                    this.todayTasks = []
                } else {
                    // 任务就是今天的，保存到 dailyTasks
                    this.dailyTasks[today] = JSON.parse(JSON.stringify(this.todayTasks))
                    console.log('已保存当前任务到今天的记录')
                }
            }
            // 如果 todayTasks 为空且 dailyTasks 也没有今天的任务，保持空数组

            // 4. 清空明日任务
            this.tomorrowTasks = []

            // 5. 保存所有数据
            await this.saveTasks()
            console.log('========== 初始化任务结束 ==========')
        },

        // 保存所有任务到后端（带重试机制）
        async saveTasks() {
            const maxRetries = this.maxSaveRetries
            let attempt = 0
            
            while (attempt < maxRetries) {
                try {
                    console.log(`正在保存任务... (尝试 ${attempt + 1}/${maxRetries})`)
                    const response = await fetch(`${API_BASE}/tasks`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            todayTasks: this.todayTasks,
                            tomorrowTasks: this.tomorrowTasks,
                            taskIdCounter: this.taskIdCounter,
                            dailyTasks: this.dailyTasks,
                            lastSavedDate: this.lastSavedDate || this.getTodayDateString(),
                            taskExpirationDays: this.taskExpirationDays,
                            archivedTasks: this.archivedTasks
                        })
                    })
                    
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`)
                    }
                    
                    const result = await response.json()
                    console.log('保存结果:', result)
                    
                    // 保存成功，重置错误状态
                    this.saveRetryCount = 0
                    this.saveErrorMessage = ''
                    return true
                } catch (error) {
                    attempt++
                    console.error(`保存任务失败 (尝试 ${attempt}/${maxRetries}):`, error)
                    
                    if (attempt < maxRetries) {
                        // 等待1秒后重试
                        await new Promise(resolve => setTimeout(resolve, 1000))
                    } else {
                        // 所有重试都失败
                        this.saveRetryCount = attempt
                        this.saveErrorMessage = `保存失败，请检查后端服务是否运行 (${API_BASE})`
                    }
                }
            }
            return false
        },

        // 从后端加载任务
        async loadTasks() {
            try {
                const response = await fetch(`${API_BASE}/tasks`)
                const data = await response.json()
                this.todayTasks = data.todayTasks || []
                this.tomorrowTasks = data.tomorrowTasks || []
                this.taskIdCounter = data.taskIdCounter || 1
                this.dailyTasks = data.dailyTasks || {}
                this.lastSavedDate = data.lastSavedDate || null
                this.taskExpirationDays = data.taskExpirationDays || 0
                this.archivedTasks = data.archivedTasks || {}

                // 应用任务过期策略
                this.applyTaskExpiration()

                const allTasks = [...this.todayTasks, ...this.tomorrowTasks]
                if (allTasks.length > 0) {
                    const maxId = Math.max(...allTasks.map(task => task.id))
                    this.taskIdCounter = maxId + 1
                }
            } catch (error) {
                console.error('加载任务失败:', error)
            }
        },

        // 同步今日任务到每日历史记录
        syncTodayTasksToDailyTasks() {
            if (this.lastSavedDate && this.todayTasks.length > 0) {
                this.dailyTasks[this.lastSavedDate] = JSON.parse(JSON.stringify(this.todayTasks))
            }
        },

        // 应用任务过期策略
        applyTaskExpiration() {
            if (this.taskExpirationDays === 0) return // 永不过期

            const today = this.getTodayDateString()
            const expirationDate = new Date()
            expirationDate.setDate(expirationDate.getDate() - this.taskExpirationDays)
            
            const expirationDateStr = `${expirationDate.getFullYear()}-${String(expirationDate.getMonth() + 1).padStart(2, '0')}-${String(expirationDate.getDate()).padStart(2, '0')}`

            // 检查每个日期的任务
            Object.keys(this.dailyTasks).forEach(dateStr => {
                if (dateStr < expirationDateStr) {
                    // 该日期的任务已过期，移到归档
                    const completedTasks = this.dailyTasks[dateStr].filter(t => t.completed)
                    const incompleteTasks = this.dailyTasks[dateStr].filter(t => !t.completed)
                    
                    if (completedTasks.length > 0) {
                        if (!this.archivedTasks[dateStr]) {
                            this.archivedTasks[dateStr] = []
                        }
                        this.archivedTasks[dateStr].push(...completedTasks)
                        console.log(`已归档 ${dateStr} 的 ${completedTasks.length} 个完成任务`)
                    }
                    
                    // 保留未完成任务在原日期
                    if (incompleteTasks.length > 0) {
                        this.dailyTasks[dateStr] = incompleteTasks
                    } else {
                        delete this.dailyTasks[dateStr]
                    }
                }
            })
        },

        // 更新任务过期策略
        updateTaskExpiration(days) {
            this.taskExpirationDays = days
            localStorage.setItem('taskExpirationDays', days)
            this.applyTaskExpiration()
            this.saveTasks()
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
            // 同步到每日历史记录
            this.syncTodayTasksToDailyTasks()
            this.saveTasks()
        },

        // 添加明日任务（当前选中日期的下一天）
        addTomorrowTask(taskTitle) {
            if (taskTitle.trim() === '') return
            const nextDateStr = this.getNextDayDateString(this.lastSavedDate || this.getTodayDateString())
            const newTask = {
                id: this.taskIdCounter++,
                title: taskTitle,
                completed: false,
                createdAt: new Date().toLocaleString('zh-CN')
            }
            if (!this.dailyTasks[nextDateStr]) {
                this.dailyTasks[nextDateStr] = []
            }
            this.dailyTasks[nextDateStr].push(newTask)
            this.saveTasks()
        },

        // 删除今日任务
        deleteTodayTask(taskId) {
            this.todayTasks = this.todayTasks.filter(task => task.id !== taskId)
            // 同步到每日历史记录
            this.syncTodayTasksToDailyTasks()
            this.saveTasks()
        },

        // 删除明日任务（当前选中日期的下一天）
        deleteTomorrowTask(taskId) {
            const nextDateStr = this.getNextDayDateString(this.lastSavedDate || this.getTodayDateString())
            if (this.dailyTasks[nextDateStr]) {
                this.dailyTasks[nextDateStr] = this.dailyTasks[nextDateStr].filter(task => task.id !== taskId)
            }
            this.saveTasks()
        },

        // 切换今日任务完成状态
        toggleTodayTask(taskId) {
            const task = this.todayTasks.find(task => task.id === taskId)
            if (task) {
                task.completed = !task.completed
            }
            // 同步到每日历史记录
            this.syncTodayTasksToDailyTasks()
            this.saveTasks()
        },

        // 切换明日任务完成状态（当前选中日期的下一天）
        toggleTomorrowTask(taskId) {
            const nextDateStr = this.getNextDayDateString(this.lastSavedDate || this.getTodayDateString())
            if (this.dailyTasks[nextDateStr]) {
                const task = this.dailyTasks[nextDateStr].find(task => task.id === taskId)
                if (task) {
                    task.completed = !task.completed
                }
            }
            this.saveTasks()
        },

        // 日历任务变更处理
        handleCalendarTaskChange(newDailyTasks) {
            console.log('handleCalendarTaskChange:', JSON.stringify(newDailyTasks))
            // 使用深拷贝确保数据隔离
            this.dailyTasks = JSON.parse(JSON.stringify(newDailyTasks))
            this.saveTasks()
        },

        // 日历添加任务
        handleTaskAdd(event) {
            const { date, task } = event
            if (!this.dailyTasks[date]) {
                this.dailyTasks[date] = []
            }
            this.dailyTasks[date].push(task)
            // 如果是当前选中的日期，更新todayTasks
            if (this.lastSavedDate === date) {
                this.todayTasks = JSON.parse(JSON.stringify(this.dailyTasks[date]))
            }
            this.saveTasks()
        },

        // 日历切换任务状态
        handleTaskToggle(event) {
            const { date, taskId } = event
            if (this.dailyTasks[date]) {
                const task = this.dailyTasks[date].find(t => t.id === taskId)
                if (task) {
                    task.completed = !task.completed
                    // 如果是当前选中的日期，更新todayTasks
                    if (this.lastSavedDate === date) {
                        this.todayTasks = JSON.parse(JSON.stringify(this.dailyTasks[date]))
                    }
                    this.saveTasks()
                }
            }
        },

        // 日历删除任务
        handleTaskDelete(event) {
            const { date, taskId } = event
            if (this.dailyTasks[date]) {
                this.dailyTasks[date] = this.dailyTasks[date].filter(t => t.id !== taskId)
                // 如果是当前选中的日期，更新todayTasks
                if (this.lastSavedDate === date) {
                    this.todayTasks = JSON.parse(JSON.stringify(this.dailyTasks[date]))
                }
                this.saveTasks()
            }
        },

        // 日历日期点击处理 - 切换到该日期的任务并关闭日历
        handleCalendarDateSelect(dateInfo) {
            const today = this.getTodayDateString()
            
            console.log('========== 日历日期选择开始 ==========')
            console.log('选择的日期:', dateInfo.dateStr)
            console.log('当前 lastSavedDate:', this.lastSavedDate)
            console.log('当前 todayTasks 数量:', this.todayTasks.length)
            console.log('dailyTasks 中目标日期的任务:', this.dailyTasks[dateInfo.dateStr])
            
            // 如果点击的是今天，需要加载今天的任务
            if (dateInfo.dateStr === today) {
                console.log('点击的是今天，加载今天的任务')
                // 保存当前任务（如果之前查看的是其他日期）
                if (this.lastSavedDate && this.lastSavedDate !== today && this.todayTasks.length > 0) {
                    console.log('保存当前任务到:', this.lastSavedDate)
                    this.dailyTasks[this.lastSavedDate] = JSON.parse(JSON.stringify(this.todayTasks))
                }
                // 加载今天的任务
                const todayTaskList = this.dailyTasks[today] || []
                this.todayTasks = JSON.parse(JSON.stringify(todayTaskList))
                this.lastSavedDate = today
                localStorage.setItem('lastTaskDate', today)
                this.saveTasks()
                this.showCalendar = false
                return
            }
            
            // 保存当前任务到历史（使用深拷贝避免引用问题）
            if (this.lastSavedDate && this.todayTasks.length > 0) {
                console.log('保存当前任务到:', this.lastSavedDate)
                this.dailyTasks[this.lastSavedDate] = JSON.parse(JSON.stringify(this.todayTasks))
                console.log('保存后 dailyTasks:', JSON.stringify(this.dailyTasks))
            }
            
            // 切换到该日期的任务（使用深拷贝避免引用问题）
            const dateTasks = this.dailyTasks[dateInfo.dateStr] || []
            console.log('加载目标日期任务:', dateTasks)
            this.todayTasks = JSON.parse(JSON.stringify(dateTasks))
            console.log('加载后 todayTasks 数量:', this.todayTasks.length)
            
            // 不清空明天任务，保持不变
            
            // 更新日期
            this.lastSavedDate = dateInfo.dateStr
            localStorage.setItem('lastTaskDate', dateInfo.dateStr)
            
            this.saveTasks()
            
            console.log('========== 日历日期选择结束 ==========')
            
            // 关闭日历
            this.showCalendar = false
        },

        // 切换日历显示
        toggleCalendar() {
            this.showCalendar = !this.showCalendar
        },

        // 点击外部关闭面板
        handleClickOutside(event) {
            // 如果点击的是背景设置面板外部，关闭它
            const panel = document.querySelector('.bg-settings-panel')
            if (panel && !panel.contains(event.target) && !event.target.closest('.bg-settings-btn')) {
                this.showBackgroundSettings = false
            }
        },

        // 加载背景设置（从localStorage和IndexedDB）
        async loadBackgroundSettings() {
            const savedBgImage = localStorage.getItem('backgroundImage')
            const savedBgOpacity = localStorage.getItem('backgroundOpacity')
            const savedExpiration = localStorage.getItem('taskExpirationDays')
            
            if (savedBgOpacity !== null) {
                this.backgroundOpacity = parseFloat(savedBgOpacity)
            }
            
            if (savedExpiration !== null) {
                this.taskExpirationDays = parseInt(savedExpiration)
            }
            
            // 处理IndexedDB中的图片
            if (savedBgImage === 'indexeddb://background') {
                const imageData = await this.getImageFromIndexedDB('background')
                if (imageData) {
                    this.backgroundImage = imageData
                } else {
                    localStorage.removeItem('backgroundImage')
                }
            } else if (savedBgImage) {
                this.backgroundImage = savedBgImage
            }
        },

        // 切换归档显示
        toggleArchive() {
            this.showArchive = !this.showArchive
            // 如果关闭归档，同时关闭日历
            if (!this.showArchive) {
                this.showCalendar = false
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
        },

        // 获取当前显示的日期标题
        currentDateTitle() {
            if (this.lastSavedDate) {
                const [year, month, day] = this.lastSavedDate.split('-')
                return `${year}年${parseInt(month)}月${parseInt(day)}日`
            }
            return this.getTodayDisplayDate()
        },

        // 合并今日任务和日历历史任务用于日历显示
        allDateTasks() {
            const result = { ...this.dailyTasks }
            // 使用 lastSavedDate 作为当前日期的任务来源
            // 因为 todayTasks 可能不是今天的任务，而是 lastSavedDate 对应的任务
            if (this.lastSavedDate) {
                result[this.lastSavedDate] = this.todayTasks
            } else {
                result[this.getTodayDateString()] = this.todayTasks
            }
            return result
        },

        // 获取当前选中日期下一天的任务
        currentNextDayTasks() {
            if (!this.lastSavedDate) {
                return this.tomorrowTasks
            }
            const nextDateStr = this.getNextDayDateString(this.lastSavedDate)
            return this.dailyTasks[nextDateStr] || []
        },

        // 背景样式
        backgroundStyle() {
            const style = {}
            if (this.backgroundImage) {
                style.backgroundImage = `url(${this.backgroundImage})`
                style.backgroundSize = 'cover'
                style.backgroundPosition = 'center'
                style.backgroundRepeat = 'no-repeat'
            }
            return style
        },

        // 格式化归档任务列表
        formattedArchiveTasks() {
            const tasks = []
            Object.keys(this.archivedTasks).sort().forEach(dateStr => {
                const dateTasks = this.archivedTasks[dateStr]
                const [year, month, day] = dateStr.split('-')
                const displayDate = `${year}年${parseInt(month)}月${parseInt(day)}日`
                dateTasks.forEach(task => {
                    tasks.push({
                        ...task,
                        displayDate
                    })
                })
            })
            return tasks
        },

        // 归档任务总数
        archiveTaskCount() {
            let count = 0
            Object.values(this.archivedTasks).forEach(tasks => {
                count += tasks.length
            })
            return count
        }
    },

    async mounted() {
        // 加载保存的主题
        const savedTheme = localStorage.getItem('theme')
        this.isDark = savedTheme === 'dark'
        this.applyTheme()

        // 加载保存的背景设置
        await this.loadBackgroundSettings()

        const savedTodayTasks = localStorage.getItem('todayTasks')
        const savedTomorrowTasks = localStorage.getItem('tomorrowTasks')
        const savedCounter = localStorage.getItem('taskIdCounter')

        if (savedTodayTasks || savedTomorrowTasks || savedCounter) {
            this.todayTasks = savedTodayTasks ? JSON.parse(savedTodayTasks) : []
            this.tomorrowTasks = savedTomorrowTasks ? JSON.parse(savedTomorrowTasks) : []
            this.taskIdCounter = savedCounter ? parseInt(savedCounter) : 1

            const allTasks = [...this.todayTasks, ...this.tomorrowTasks]
            if (allTasks.length > 0) {
                const maxId = Math.max(...allTasks.map(task => task.id))
                this.taskIdCounter = maxId + 1
            }

            await this.saveTasks()
            console.log('数据已从 localStorage 迁移到后端')

            localStorage.removeItem('todayTasks')
            localStorage.removeItem('tomorrowTasks')
            localStorage.removeItem('taskIdCounter')
        } else {
            await this.loadTasks()
        }

        await this.initializeTasks()

        // 添加全局点击事件监听（用于点击外部关闭面板）
        document.addEventListener('click', this.handleClickOutside)
    },

    beforeDestroy() {
        // 移除全局点击事件监听
        document.removeEventListener('click', this.handleClickOutside)
    }
}
</script>

<template>
    <div class="app-container" :class="{ 'dark-theme': isDark, 'has-background': backgroundImage }">
        <!-- 背景图片层 -->
        <div 
            class="background-overlay" 
            :style="[backgroundStyle, { opacity: backgroundOpacity }]"
        ></div>
        
        <!-- 状态胶囊条（带蓝色呼吸灯效果） -->
        <div class="status-capsule">
            <div class="status-indicator"></div>
            <span class="status-text">服务正常运行中</span>
        </div>

        <!-- 主题切换按钮 -->
        <div class="theme-toggle">
            <button 
                class="theme-btn"
                :class="{ 'dark': isDark }"
                @click="toggleTheme"
                :title="isDark ? '切换到亮色主题' : '切换到暗色主题'"
            >
                <span class="theme-icon">{{ isDark ? '🌙' : '☀️' }}</span>
                <span class="theme-text">{{ isDark ? 'Dark' : 'Light' }}</span>
            </button>
        </div>

        <!-- 背景设置按钮 -->
        <div class="bg-settings-toggle">
            <button 
                class="bg-settings-btn"
                @click="showBackgroundSettings = !showBackgroundSettings"
                title="背景设置"
            >
                🖼️ 背景
            </button>
        </div>

        <!-- 背景设置面板 -->
        <div class="bg-settings-panel" v-if="showBackgroundSettings">
            <h3>🎨 背景设置</h3>
            
            <!-- 本地上传选项 -->
            <div class="setting-item">
                <label>📁 本地上传：</label>
                <input 
                    type="file" 
                    accept="image/*" 
                    @change="handleBackgroundUpload"
                    class="file-input"
                >
            </div>
            
            <!-- URL输入选项 -->
            <div class="setting-item">
                <label>🔗 网络图片URL：</label>
                <div class="url-input-group">
                    <input 
                        type="url" 
                        v-model="backgroundUrlInput"
                        placeholder="https://example.com/image.jpg"
                        class="url-input"
                        @keyup.enter="handleBackgroundUrlInput"
                    >
                    <button 
                        class="url-btn"
                        @click="handleBackgroundUrlInput"
                        :disabled="!backgroundUrlInput.trim()"
                    >
                        应用
                    </button>
                </div>
            </div>
            
            <!-- 透明度调节 -->
            <div class="setting-item">
                <label>透明度：{{ backgroundOpacity }}</label>
                <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.1" 
                    :value="backgroundOpacity"
                    @input="updateBackgroundOpacity"
                    class="opacity-slider"
                >
            </div>
            <button class="reset-btn" @click="resetBackground">重置背景</button>
            
            <hr class="settings-divider">
            
            <h3>⚙️ 任务设置</h3>
            <div class="setting-item">
                <label>任务自动归档：</label>
                <div class="expiration-options">
                    <button 
                        class="expiration-btn"
                        :class="{ active: taskExpirationDays === 0 }"
                        @click="updateTaskExpiration(0)"
                    >
                        永不过期
                    </button>
                    <button 
                        class="expiration-btn"
                        :class="{ active: taskExpirationDays === 7 }"
                        @click="updateTaskExpiration(7)"
                    >
                        7天
                    </button>
                    <button 
                        class="expiration-btn"
                        :class="{ active: taskExpirationDays === 30 }"
                        @click="updateTaskExpiration(30)"
                    >
                        30天
                    </button>
                </div>
            </div>
        </div>

        <!-- 保存失败提示 -->
        <div v-if="saveErrorMessage" class="save-error-toast">
            ⚠️ {{ saveErrorMessage }}
            <button @click="saveTasks()" class="retry-btn">重试</button>
        </div>

        <TodoHeader />
        
        <!-- 日历按钮 -->
        <div class="calendar-toggle">
            <button 
                class="calendar-btn"
                :class="{ active: showCalendar }"
                @click="toggleCalendar"
            >
                📅 {{ showCalendar ? '关闭日历' : '打开日历' }}
            </button>
            
            <button 
                class="archive-btn"
                :class="{ active: showArchive }"
                @click="toggleArchive"
            >
                📦 归档 ({{ archiveTaskCount }})
            </button>
        </div>

        <!-- 日历组件 -->
        <Calendar 
            v-if="showCalendar"
            :dateTasks="allDateTasks"
            @task-change="handleCalendarTaskChange"
            @task-add="handleTaskAdd"
            @task-toggle="handleTaskToggle"
            @task-delete="handleTaskDelete"
            @date-select="handleCalendarDateSelect"
        />

        <!-- 归档组件 -->
        <div v-if="showArchive" class="archive-panel">
            <div class="archive-header">
                <h2>📦 归档任务</h2>
                <p class="archive-count">共 {{ archiveTaskCount }} 个已完成任务</p>
            </div>
            
            <div class="archive-content" v-if="formattedArchiveTasks.length > 0">
                <div 
                    v-for="task in formattedArchiveTasks" 
                    :key="task.id" 
                    class="archive-item"
                >
                    <div class="archive-item-date">{{ task.displayDate }}</div>
                    <div class="archive-item-content">
                        <span class="archive-checkmark">✅</span>
                        {{ task.title }}
                    </div>
                </div>
            </div>
            
            <div v-else class="archive-empty">
                <p class="empty-icon">📭</p>
                <p class="empty-text">暂无归档任务</p>
                <p class="empty-hint">设置任务过期策略后，已完成的旧任务会自动归档到这里</p>
            </div>
        </div>

        <div class="main-content" v-if="!showCalendar">
            <!-- 今日任务区域 -->
            <div class="task-section today-section">
                <h2 class="section-title">📅 {{ currentDateTitle }} - 任务</h2>
                <p class="task-stats">
                    已完成: {{ todayCompletedCount }} / {{ todayTasks.length }}
                </p>
                <TodoInput 
                    placeholder="添加任务..." 
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
                <h2 class="section-title">🌙 {{ getCurrentNextDayDisplayDate() }} - 任务</h2>
                <p class="task-stats">
                    已完成: {{ currentNextDayTasks.filter(task => task.completed).length }} / {{ currentNextDayTasks.length }}
                </p>
                <TodoInput 
                    placeholder="添加明天任务..." 
                    @add-task="addTomorrowTask" 
                />
                <TodoList 
                    :tasks="currentNextDayTasks" 
                    @delete-task="deleteTomorrowTask"
                    @toggle-task="toggleTomorrowTask"
                />
            </div>
        </div>
    </div>
</template>

<style>
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Comic Sans MS', 'PingFang SC', 'Microsoft YaHei', sans-serif;
    background-color: #ffffff;
    background-image: 
        linear-gradient(#000000 1px, transparent 1px),
        linear-gradient(90deg, #000000 1px, transparent 1px);
    background-size: 40px 40px;
    min-height: 100vh;
    transition: background-image 0.3s ease;
}

/* 有背景图片时隐藏网格 */
body.has-background {
    background-image: none !important;
}

.app-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    min-height: 100vh;
    position: relative;
}

/* 背景图片覆盖层 */
.background-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
    pointer-events: none;
    transition: opacity 0.3s ease;
}

/* 状态胶囊条 - 带蓝色呼吸灯效果 */
.status-capsule {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 20px;
    background: #f5f5f5;
    border-radius: 50px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    z-index: 999;
    border: 1px solid #ccc;
}

.status-indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #333;
    box-shadow: 0 0 10px #333, 0 0 20px #333, 0 0 30px #333;
    animation: breathing 2s ease-in-out infinite;
}

@keyframes breathing {
    0%, 100% {
        opacity: 1;
        box-shadow: 0 0 10px #666, 0 0 20px #666, 0 0 30px #666;
    }
    50% {
        opacity: 0.5;
        box-shadow: 0 0 5px #666, 0 0 10px #666, 0 0 15px #666;
    }
}

.status-text {
    font-size: 0.9rem;
    color: #333;
    font-weight: 500;
}

/* 暗色模式下的状态胶囊条 - 蓝紫色渐变带亮光 */
body.dark-theme .status-capsule {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%);
    box-shadow: 
        0 4px 20px rgba(102, 126, 234, 0.4),
        0 0 40px rgba(102, 126, 234, 0.2),
        0 0 60px rgba(118, 75, 162, 0.1);
    border: 1px solid rgba(102, 126, 234, 0.5);
}

body.dark-theme .status-text {
    color: #e0e0e0;
}

body.dark-theme .status-indicator {
    background: #00d4ff;
    box-shadow: 0 0 10px #00d4ff, 0 0 20px #00d4ff, 0 0 30px #00d4ff;
}

/* 背景设置按钮 */
.bg-settings-toggle {
    position: fixed;
    top: 20px;
    right: 140px;
    z-index: 1000;
}

.bg-settings-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    font-size: 0.9rem;
    font-weight: 500;
    border: none;
    border-radius: 25px;
    cursor: pointer;
    transition: all 0.3s ease;
    background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
    color: #333;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    border: 1px solid #ccc;
}

.bg-settings-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

/* 暗色模式 - 蓝紫色渐变 */
body.dark-theme .bg-settings-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    border: none;
}

body.dark-theme .bg-settings-btn:hover {
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

/* 背景设置面板 */
.bg-settings-panel {
    position: fixed;
    top: 70px;
    right: 20px;
    background: #f5f5f5;
    border-radius: 15px;
    padding: 20px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    z-index: 1001;
    width: 300px;
    border: 1px solid #ccc;
}

.bg-settings-panel h3 {
    margin-bottom: 15px;
    color: #333;
    font-size: 1.1rem;
}

.setting-item {
    margin-bottom: 15px;
}

.setting-item label {
    display: block;
    margin-bottom: 8px;
    color: #666;
    font-size: 0.9rem;
}

.file-input {
    width: 100%;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 8px;
    font-size: 0.85rem;
    background: #fff;
}

.url-input-group {
    display: flex;
    gap: 8px;
}

.url-input {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid #ccc;
    border-radius: 8px;
    font-size: 0.85rem;
    background: #fff;
    color: #333;
}

.url-input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.url-input::placeholder {
    color: #999;
}

.url-btn {
    padding: 8px 16px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 500;
    transition: all 0.3s;
    white-space: nowrap;
}

.url-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.url-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

:global(body.dark-theme) .url-input {
    background: rgba(255, 255, 255, 0.1);
    border-color: #3a3a5a;
    color: #e0e0e0;
}

:global(body.dark-theme) .url-input::placeholder {
    color: #666;
}

.opacity-slider {
    width: 100%;
    height: 8px;
    border-radius: 4px;
    background: linear-gradient(90deg, #999, #666);
    outline: none;
    cursor: pointer;
}

:global(body.dark-theme) .opacity-slider {
    background: linear-gradient(90deg, #667eea, #764ba2);
}

.reset-btn {
    width: 100%;
    padding: 10px;
    border: none;
    border-radius: 8px;
    background: #999;
    color: white;
    cursor: pointer;
    transition: all 0.3s;
    font-weight: 500;
}

.reset-btn:hover {
    background: #666;
    transform: translateY(-2px);
}

/* 任务过期设置按钮 */
.expiration-options {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.expiration-btn {
    flex: 1;
    min-width: 70px;
    padding: 8px 12px;
    border: 1px solid #ccc;
    border-radius: 8px;
    background: #f5f5f5;
    color: #333;
    cursor: pointer;
    transition: all 0.3s;
    font-size: 0.85rem;
}

.expiration-btn:hover {
    background: #e0e0e0;
}

.expiration-btn.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.5);
    transform: scale(1.05);
}

.expiration-btn.active:hover {
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.7);
    transform: scale(1.08);
}

/* 分隔线 */
.settings-divider {
    margin: 15px 0;
    border: none;
    border-top: 1px solid #ddd;
}

/* 保存失败提示 */
.save-error-toast {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #ff6b6b;
    color: white;
    padding: 12px 20px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    gap: 15px;
    box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
    z-index: 1002;
    animation: slideUp 0.3s ease;
}

.retry-btn {
    padding: 6px 12px;
    background: white;
    color: #ff6b6b;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.3s;
}

.retry-btn:hover {
    background: #fff0f0;
}

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateX(-50%) translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
    }
}

/* 暗色模式下的设置面板 */
body.dark-theme .bg-settings-panel {
    background: rgba(30, 30, 50, 0.95);
    border-color: #3a3a5a;
}

body.dark-theme .bg-settings-panel h3 {
    color: #e0e0e0;
}

body.dark-theme .setting-item label {
    color: #a0a0b0;
}

body.dark-theme .file-input {
    background: rgba(255, 255, 255, 0.1);
    border-color: #3a3a5a;
    color: #e0e0e0;
}

body.dark-theme .reset-btn {
    background: #ff6b6b;
}

body.dark-theme .reset-btn:hover {
    background: #ee5a5a;
}

body.dark-theme .expiration-btn {
    background: rgba(255, 255, 255, 0.1);
    border-color: #3a3a5a;
    color: #e0e0e0;
}

body.dark-theme .expiration-btn:hover {
    background: rgba(255, 255, 255, 0.2);
}

body.dark-theme .expiration-btn.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    box-shadow: 0 0 20px rgba(102, 126, 234, 0.6);
    transform: scale(1.05);
}

body.dark-theme .expiration-btn.active:hover {
    box-shadow: 0 0 30px rgba(102, 126, 234, 0.8);
    transform: scale(1.08);
}

body:not(.dark-theme) .expiration-btn.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.5);
    transform: scale(1.05);
}

body:not(.dark-theme) .expiration-btn.active:hover {
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.7);
    transform: scale(1.08);
}

body.dark-theme .settings-divider {
    border-top-color: #3a3a5a;
}

.calendar-toggle {
    display: flex;
    justify-content: center;
    margin: 20px 0;
}

.calendar-btn {
    padding: 12px 24px;
    font-size: 1rem;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.3s;
    background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
    color: #333;
    border: 1px solid #ccc;
}

.calendar-btn.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
}

.calendar-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

:global(body.dark-theme) .calendar-btn {
    background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%);
    color: #e0e0e0;
    border: 1px solid #3a3a5a;
}

:global(body.dark-theme) .calendar-btn.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

:global(body.dark-theme) .calendar-btn:hover {
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
}

/* 归档按钮样式 */
.archive-btn {
    padding: 12px 24px;
    font-size: 1rem;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.3s;
    background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
    color: #333;
    border: 1px solid #ccc;
    margin-left: 10px;
}

.archive-btn.active {
    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
    color: white;
    border: none;
}

.archive-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

:global(body.dark-theme) .archive-btn {
    background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%);
    color: #e0e0e0;
    border: 1px solid #3a3a5a;
}

:global(body.dark-theme) .archive-btn.active {
    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
}

:global(body.dark-theme) .archive-btn:hover {
    box-shadow: 0 5px 15px rgba(255, 107, 107, 0.3);
}

/* 归档面板样式 */
.archive-panel {
    max-width: 800px;
    margin: 20px auto;
    background: #f5f5f5;
    border-radius: 15px;
    padding: 25px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    border: 1px solid #ccc;
}

.archive-header {
    text-align: center;
    margin-bottom: 20px;
}

.archive-header h2 {
    font-size: 1.5rem;
    color: #333;
    margin-bottom: 8px;
}

.archive-count {
    color: #666;
    font-size: 0.9rem;
}

.archive-content {
    max-height: 400px;
    overflow-y: auto;
}

.archive-item {
    display: flex;
    align-items: center;
    padding: 12px 15px;
    background: #fff;
    border-radius: 10px;
    margin-bottom: 10px;
    border: 1px solid #eee;
}

.archive-item-date {
    font-size: 0.85rem;
    color: #999;
    min-width: 100px;
    padding-right: 15px;
    border-right: 1px solid #eee;
}

.archive-item-content {
    flex: 1;
    padding-left: 15px;
    display: flex;
    align-items: center;
    gap: 8px;
    color: #555;
}

.archive-checkmark {
    font-size: 1rem;
}

.archive-empty {
    text-align: center;
    padding: 40px 20px;
    color: #999;
}

.archive-empty .empty-icon {
    font-size: 3rem;
    margin-bottom: 10px;
}

.archive-empty .empty-text {
    font-size: 1.1rem;
    margin-bottom: 8px;
}

.archive-empty .empty-hint {
    font-size: 0.85rem;
    color: #bbb;
}

:global(body.dark-theme) .archive-panel {
    background: rgba(15, 15, 26, 0.95);
    border: 1px solid #3a3a5a;
}

:global(body.dark-theme) .archive-header h2 {
    color: #e0e0e0;
}

:global(body.dark-theme) .archive-count {
    color: #a0a0b0;
}

:global(body.dark-theme) .archive-item {
    background: rgba(255, 255, 255, 0.05);
    border-color: #3a3a5a;
}

:global(body.dark-theme) .archive-item-date {
    color: #888;
    border-right-color: #3a3a5a;
}

:global(body.dark-theme) .archive-item-content {
    color: #c0c0d0;
}

:global(body.dark-theme) .archive-empty .empty-hint {
    color: #666;
}

.main-content {
    display: flex;
    justify-content: center;
    gap: 30px;
    margin-top: 30px;
    flex-wrap: wrap;
}

.task-section {
    width: 100%;
    max-width: 500px;
    background: #f5f5f5;
    border-radius: 15px;
    padding: 25px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    border: 1px solid #ccc;
}

:global(body.dark-theme) .task-section {
    background: rgba(15, 15, 26, 0.95);
    border: 1px solid #3a3a5a;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.today-section {
    border-top: 5px solid #4CAF50;
}

.tomorrow-section {
    border-top: 5px solid #999;
}

:global(body.dark-theme) .tomorrow-section {
    border-top: 5px solid #667eea;
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

@media (max-width: 1100px) {
    .main-content {
        flex-direction: column;
        align-items: center;
    }

    .task-section {
        max-width: 600px;
    }

    /* 按钮在中等屏幕保持水平排列 */
    .calendar-toggle {
        display: flex;
        justify-content: center;
    }

    .calendar-btn {
        margin-left: 10px;
    }

    .status-capsule {
        top: 10px;
        padding: 8px 16px;
    }

    .bg-settings-toggle {
        top: 10px;
        right: 140px;
    }

    .theme-toggle {
        top: 10px;
        right: 20px;
    }
}

/* ========== 暗色主题样式 ========== */
body.dark-theme {
    background-color: #0f0f1a;
    background-image: 
        linear-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.06) 1px, transparent 1px);
    background-size: 40px 40px;
    position: relative;
}

/* 暗色主题渐变背景遮罩 */
body.dark-theme::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, 
        rgba(135, 206, 235, 0.15) 0%, 
        rgba(139, 92, 246, 0.2) 35%, 
        rgba(236, 72, 153, 0.25) 100%);
    pointer-events: none;
    z-index: -1;
}

/* 有背景图片时隐藏网格和渐变背景 */
body.dark-theme.has-background {
    background-image: none !important;
}

body.dark-theme.has-background::before {
    display: none !important;
}

body.dark-theme .task-section {
    background: rgba(15, 15, 26, 0.95);
    border: 1px solid #3a3a5a;
}

body.dark-theme .section-title {
    color: #e0e0e0;
    font-weight: 600;
    text-shadow: none;
}

body.dark-theme .task-stats {
    color: #a0a0b0;
}

body.dark-theme .header {
    background: rgba(15, 15, 26, 0.95);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    border: 1px solid #3a3a5a;
}

/* 标题渐变效果 - 体现"下一代"和"科技感" */
body.dark-theme .title {
    color: #e0e0e0;
}

body.dark-theme .subtitle {
    color: #c0b0d0;
}

body.dark-theme .date {
    color: #67e8f9;
}

body.dark-theme .time {
    color: #a5b4fc;
}

/* 主题切换按钮样式 */
.theme-toggle {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
}

/* 主题按钮样式 - Light模式 */
.theme-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    font-size: 0.9rem;
    font-weight: 500;
    border: none;
    border-radius: 25px;
    cursor: pointer;
    transition: all 0.3s ease;
    background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
    color: #333;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    border: 1px solid #ccc;
}

.theme-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

/* 主题按钮样式 - Dark模式 */
.theme-btn.dark {
    background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
    border: 1px solid #3a3a5a;
    color: #e0e0e0;
}

.theme-btn.dark:hover {
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6);
}

.theme-icon {
    font-size: 1.2rem;
}

.theme-text {
    font-weight: 600;
}

@media (max-width: 480px) {
    .theme-toggle {
        top: 10px;
        right: 10px;
    }

    .theme-btn {
        padding: 8px 12px;
        font-size: 0.8rem;
    }

    .theme-icon {
        font-size: 1rem;
    }
    
    .bg-settings-toggle {
        right: 100px;
    }
    
    .status-capsule {
        left: 10px;
        transform: none;
    }
    
    .bg-settings-panel {
        right: 10px;
        width: 280px;
    }

    /* 日历和归档按钮移动端样式 */
    .calendar-toggle {
        flex-direction: column;
        align-items: center;
        gap: 10px;
        margin: 15px 0;
    }

    .calendar-btn {
        width: 100%;
        max-width: 200px;
    }

    .archive-btn {
        width: 100%;
        max-width: 200px;
        margin-left: 0;
    }
}
</style>

