<script>
export default {
    // 接收单个任务对象
    props: {
        task: {
            type: Object,
            required: true
        },
        // 当前选中的日期（用于显示任务所属日期）
        currentDate: {
            type: String,
            default: ''
        }
    },

    methods: {
        // 删除任务
        deleteTask() {
            this.$emit('delete', this.task.id)
        },

        // 切换完成状态
        toggleComplete() {
            this.$emit('toggle', this.task.id)
        }
    },

    computed: {
        // 任务状态样式类
        taskClass() {
            return {
                'task-item': true,
                'completed': this.task.completed
            }
        },
        // 显示的任务日期
        taskDate() {
            if (this.currentDate) {
                const [year, month, day] = this.currentDate.split('-')
                return `${year}年${parseInt(month)}月${parseInt(day)}日`
            }
            return this.task.createdAt
        }
    }
}
</script>

<template>
    <li :class="taskClass">
        <div class="task-content">
            <!-- 复选框 -->
            <input 
                type="checkbox" 
                class="task-checkbox"
                :checked="task.completed"
                @change="toggleComplete"
            >
            
            <!-- 任务信息 -->
            <div class="task-info">
                <p class="task-title">{{ task.title }}</p>
                <p class="task-time">创建于: {{ taskDate }}</p>
            </div>
        </div>

        <!-- 删除按钮 -->
        <button class="delete-btn" @click="deleteTask">
            🗑️ 删除
        </button>
    </li>
</template>

<style scoped>
.task-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    margin-bottom: 10px;
    background: #f5f5f5;
    border-radius: 10px;
    border-left: 4px solid #999;
    transition: all 0.3s ease;
}

.task-item:hover {
    background: #e8e8e8;
    transform: translateX(5px);
}

.task-item.completed {
    border-left-color: #27ae60;
    background: #e8f5e9;
}

/* 暗色模式 */
:global(body.dark-theme) .task-item {
    background: rgba(0, 0, 0, 0.2);
    border-left-color: #3a3a5a;
}

:global(body.dark-theme) .task-item:hover {
    background: rgba(0, 0, 0, 0.3);
}

:global(body.dark-theme) .task-item.completed {
    border-left-color: #27ae60;
    background: rgba(39, 174, 96, 0.15);
}

.task-item.completed .task-title {
    text-decoration: line-through;
    color: #999;
}

:global(body.dark-theme) .task-item.completed .task-title {
    color: #666;
}

.task-content {
    display: flex;
    align-items: center;
    gap: 15px;
    flex: 1;
}

.task-checkbox {
    width: 20px;
    height: 20px;
    cursor: pointer;
    accent-color: #666;
}

:global(body.dark-theme) .task-checkbox {
    accent-color: #667eea;
}

.task-info {
    flex: 1;
}

.task-title {
    font-size: 1rem;
    color: #333;
    margin-bottom: 5px;
    word-break: break-word;
    /* 移除字体特效：清除亮光和模糊 */
    text-shadow: none;
    filter: none;
    font-weight: bold;
    letter-spacing: normal;
}

:global(body.dark-theme) .task-title {
    color: #e0e0e0;
    /* 移除字体特效：清除亮光和模糊 */
    text-shadow: none;
    filter: none;
    font-weight: bold;
    letter-spacing: normal;
}

.task-time {
    font-size: 0.75rem;
    color: #999;
}

:global(body.dark-theme) .task-time {
    color: #a0a0b0;
}

.delete-btn {
    padding: 8px 12px;
    font-size: 0.85rem;
    background: #ff5252;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
}

.delete-btn:hover {
    background: #ff1744;
    transform: scale(1.05);
}

.delete-btn:active {
    transform: scale(0.95);
}

@media (max-width: 480px) {
    .task-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
    }

    .delete-btn {
        align-self: flex-end;
    }
}
</style>