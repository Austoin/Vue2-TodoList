<script>
export default {
    name: 'Calendar',

    props: {
        // 外部传入的日期任务数据 { '2024-01-15': [tasks...] }
        dateTasks: {
            type: Object,
            default() {
                return {}
            }
        }
    },

    data() {
        return {
            currentDate: new Date(),
            selectedDate: null,
            showTaskModal: false,
            taskTitle: '',
            selectedDateTasks: [],
            year: new Date().getFullYear(),
            month: new Date().getMonth()
        }
    },

    computed: {
        // 获取当前月的天数
        daysInMonth() {
            return new Date(this.year, this.month + 1, 0).getDate()
        },

        // 获取当前月第一天是星期几
        firstDayOfMonth() {
            return new Date(this.year, this.month, 1).getDay()
        },

        // 获取月份名称
        monthName() {
            const months = ['一月', '二月', '三月', '四月', '五月', '六月', 
                          '七月', '八月', '九月', '十月', '十一月', '十二月']
            return months[this.month]
        },

        // 生成日历格子
        calendarDays() {
            const days = []
            
            // 添加空白格子（月初前几天）
            for (let i = 0; i < this.firstDayOfMonth; i++) {
                days.push({ day: null, isCurrentMonth: false })
            }
            
            // 添加当月天数
            for (let i = 1; i <= this.daysInMonth; i++) {
                const dateStr = this.getDateString(this.year, this.month, i)
                const hasTasks = this.dateTasks[dateStr] && this.dateTasks[dateStr].length > 0
                const completedCount = hasTasks ? 
                    this.dateTasks[dateStr].filter(t => t.completed).length : 0
                const totalCount = hasTasks ? this.dateTasks[dateStr].length : 0
                
                days.push({
                    day: i,
                    isCurrentMonth: true,
                    dateStr: dateStr,
                    hasTasks: hasTasks,
                    completedCount: completedCount,
                    totalCount: totalCount,
                    isToday: this.isToday(i),
                    isSelected: this.selectedDate === dateStr
                })
            }
            
            return days
        },

        // 格式化选中日期显示
        formattedSelectedDate() {
            if (!this.selectedDate) return ''
            const date = new Date(this.selectedDate)
            return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
        }
    },

    methods: {
        // 获取日期字符串 YYYY-MM-DD
        getDateString(year, month, day) {
            const y = year
            const m = String(month + 1).padStart(2, '0')
            const d = String(day).padStart(2, '0')
            return `${y}-${m}-${d}`
        },

        // 判断是否是今天
        isToday(day) {
            const today = new Date()
            return day === today.getDate() && 
                   this.month === today.getMonth() && 
                   this.year === today.getFullYear()
        },

        // 上个月
        prevMonth() {
            if (this.month === 0) {
                this.month = 11
                this.year--
            } else {
                this.month--
            }
        },

        // 下个月
        nextMonth() {
            if (this.month === 11) {
                this.month = 0
                this.year++
            } else {
                this.month++
            }
        },

        // 点击日期 - 通知父组件切换到该日期
        handleDateClick(day) {
            if (!day.day || !day.isCurrentMonth) return
            
            // 发送日期选择事件给父组件
            this.$emit('date-select', day)
        },

        // 关闭任务弹窗
        closeTaskModal() {
            this.showTaskModal = false
            this.taskTitle = ''
            this.selectedDateTasks = []
        },

        // 添加任务
        addTask() {
            if (this.taskTitle.trim() === '') return
            
            const newTask = {
                id: Date.now(),
                title: this.taskTitle.trim(),
                completed: false,
                createdAt: new Date().toLocaleString('zh-CN')
            }
            
            // 不直接修改prop，而是通知父组件
            this.$emit('task-add', {
                date: this.selectedDate,
                task: newTask
            })
            
            this.selectedDateTasks = [...this.selectedDateTasks, newTask]
            this.taskTitle = ''
        },

        // 切换任务完成状态
        toggleTask(taskId) {
            // 通知父组件处理
            this.$emit('task-toggle', {
                date: this.selectedDate,
                taskId: taskId
            })
            
            const task = this.selectedDateTasks.find(t => t.id === taskId)
            if (task) {
                task.completed = !task.completed
            }
        },

        // 删除任务
        deleteTask(taskId) {
            // 通知父组件处理
            this.$emit('task-delete', {
                date: this.selectedDate,
                taskId: taskId
            })
            
            this.selectedDateTasks = this.selectedDateTasks.filter(t => t.id !== taskId)
        },

        // 跳转到今天
        goToToday() {
            const today = new Date()
            this.year = today.getFullYear()
            this.month = today.getMonth()
        }
    }
}
</script>

<template>
    <div class="calendar-container">
        <!-- 日历头部 -->
        <div class="calendar-header">
            <button class="nav-btn" @click="prevMonth">◀</button>
            <div class="month-year">
                <span class="month">{{ monthName }}</span>
                <span class="year">{{ year }}</span>
            </div>
            <button class="nav-btn" @click="nextMonth">▶</button>
        </div>

        <!-- 星期标题 -->
        <div class="weekdays">
            <span class="weekday">日</span>
            <span class="weekday">一</span>
            <span class="weekday">二</span>
            <span class="weekday">三</span>
            <span class="weekday">四</span>
            <span class="weekday">五</span>
            <span class="weekday">六</span>
        </div>

        <!-- 日历格子 -->
        <div class="calendar-grid">
            <div 
                v-for="(day, index) in calendarDays" 
                :key="index"
                class="calendar-day"
                :class="{
                    'empty': !day.day,
                    'other-month': day.day && !day.isCurrentMonth,
                    'today': day.isToday,
                    'has-tasks': day.hasTasks,
                    'selected': day.isSelected
                }"
                @click="handleDateClick(day)"
            >
                <span v-if="day.day" class="day-number">{{ day.day }}</span>
                <div v-if="day.hasTasks" class="task-indicator">
                    <span class="task-count">{{ day.completedCount }}/{{ day.totalCount }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.calendar-container {
    background: #f5f5f5;
    border-radius: 15px;
    padding: 15px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    max-width: 400px;
    margin: 0 auto;
    border: 1px solid #ccc;
}

:global(body.dark-theme) .calendar-container {
    background: rgba(15, 15, 26, 0.98);
    border: 1px solid #3a3a5a;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.calendar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

.nav-btn {
    background: #e0e0e0;
    border: none;
    padding: 8px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.9rem;
    color: #333;
}

.nav-btn:hover {
    background: #666;
    color: white;
}

:global(body.dark-theme) .nav-btn {
    background: rgba(255, 255, 255, 0.1);
    color: #e0e0e0;
}

:global(body.dark-theme) .nav-btn:hover {
    background: #667eea;
}

.month-year {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.month {
    font-size: 1.2rem;
    font-weight: bold;
    color: #333;
}

:global(body.dark-theme) .month {
    color: #e0e0e0;
}

.year {
    font-size: 0.8rem;
    color: #666;
}

:global(body.dark-theme) .year {
    color: #a0a0b0;
}

.weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 3px;
    margin-bottom: 8px;
}

.weekday {
    text-align: center;
    font-weight: bold;
    color: #666;
    font-size: 0.75rem;
    padding: 5px 0;
}

:global(body.dark-theme) .weekday {
    color: #a0a0b0;
}

.calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 3px;
}

.calendar-day {
    aspect-ratio: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
    padding: 3px;
    background: #e8e8e8;
}

.calendar-day:hover {
    background: #d0d0d0;
}

:global(body.dark-theme) .calendar-day {
    background: rgba(0, 0, 0, 0.2);
}

:global(body.dark-theme) .calendar-day:hover {
    background: rgba(0, 0, 0, 0.3);
}

.calendar-day.empty {
    cursor: default;
    background: transparent;
}

.calendar-day.other-month {
    opacity: 0.3;
}

.calendar-day.today {
    background: #e0e0e0;
    border: 2px solid #999;
}

:global(body.dark-theme) .calendar-day.today {
    background: rgba(102, 126, 234, 0.15);
    border: 2px solid #3a3a5a;
}

.calendar-day.selected {
    background: #666;
    color: white;
}

.calendar-day.selected.has-tasks {
    background: #555;
}

:global(body.dark-theme) .calendar-day.selected {
    background: #667eea;
}

:global(body.dark-theme) .calendar-day.selected.has-tasks {
    background: #5a6fd6;
}

.calendar-day.has-tasks {
    background: #90EE90;
}

:global(body.dark-theme) .calendar-day.has-tasks {
    background: rgba(144, 238, 144, 0.2);
}

.day-number {
    font-size: 0.85rem;
    font-weight: 500;
    color: #333;
}

:global(body.dark-theme) .day-number {
    color: #e0e0e0;
}

.task-indicator {
    position: absolute;
    bottom: 1px;
}

.task-count {
    font-size: 0.55rem;
    color: #666;
}

:global(body.dark-theme) .task-count {
    color: #a0a0b0;
}

.calendar-day.selected .task-count {
    color: #ccc;
}

:global(body.dark-theme) .calendar-day.selected .task-count {
    color: #ffeb3b;
}
</style>
