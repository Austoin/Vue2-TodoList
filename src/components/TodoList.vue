<script>
import TodoItem from './TodoItem.vue'

export default {
    components: {
        TodoItem
    },

    // 接收父组件传递的任务列表
    props: {
        tasks: {
            type: Array,
            default() {
                return []
            }
        }
    },

    methods: {
        // 删除任务 - 向父组件发送事件
        handleDelete(taskId) {
            this.$emit('delete-task', taskId)
        },

        // 切换任务状态 - 向父组件发送事件
        handleToggle(taskId) {
            this.$emit('toggle-task', taskId)
        }
    },

    computed: {
        // 判断是否有任务
        hasTasks() {
            return this.tasks.length > 0
        }
    }
}
</script>

<template>
    <div class="todo-list">
        <!-- 有任务时显示列表 -->
        <transition-group name="list" tag="ul" class="task-list" v-if="hasTasks">
            <TodoItem 
                v-for="task in tasks" 
                :key="task.id"
                :task="task"
                @delete="handleDelete"
                @toggle="handleToggle"
            />
        </transition-group>

        <!-- 无任务时显示提示 -->
        <div class="empty-state" v-else>
            <p class="empty-icon">📋</p>
            <p class="empty-text">暂无任务，添加一个吧！</p>
        </div>
    </div>
</template>

<style scoped>
.todo-list {
    min-height: 200px;
}

.task-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    color: #999;
}

.empty-icon {
    font-size: 3rem;
    margin-bottom: 10px;
}

.empty-text {
    font-size: 1rem;
}

/* 列表动画 */
.list-enter-active,
.list-leave-active {
    transition: all 0.3s ease;
}

.list-enter-from {
    opacity: 0;
    transform: translateX(-30px);
}

.list-leave-to {
    opacity: 0;
    transform: translateX(30px);
}

.list-move {
    transition: transform 0.3s ease;
}
</style>