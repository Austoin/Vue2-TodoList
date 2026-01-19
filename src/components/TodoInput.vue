<script>
export default {
    // 接收父组件传递的props
    props: {
        placeholder: {
            type: String,
            default: '请输入任务...'
        },
        inputId: {
            type: String,
            default: 'taskInput'
        }
    },

    data() {
        return {
            inputValue: ''
        }
    },

    methods: {
        // 提交任务
        submitTask() {
            if (this.inputValue.trim() === '') {
                return
            }
            // 通过$emit向父组件发送事件
            this.$emit('add-task', this.inputValue)
            // 清空输入框
            this.inputValue = ''
        },

        // 处理键盘回车事件
        handleKeyup(event) {
            if (event.key === 'Enter') {
                this.submitTask()
            }
        }
    }
}
</script>

<template>
    <div class="input-container">
        <label :for="inputId" class="sr-only">添加任务</label>
        <input 
            type="text" 
            class="task-input"
            :id="inputId"
            :name="inputId"
            v-model="inputValue"
            :placeholder="placeholder"
            title="输入任务标题后按回车或点击添加按钮"
            @keyup.enter="submitTask"
        >
        <button 
            class="add-btn"
            type="button"
            title="添加任务"
            @click="submitTask"
        >
            ➕ 添加
        </button>
    </div>
</template>

<style scoped>
.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}

.input-container {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
}

.task-input {
    flex: 1;
    padding: 12px 16px;
    font-size: 1rem;
    border: 2px solid #ccc;
    border-radius: 10px;
    outline: none;
    transition: border-color 0.3s, box-shadow 0.3s;
    background: #f5f5f5;
    color: #333;
    -webkit-user-select: none;
    user-select: none;
}

.task-input:focus {
    border-color: #666;
    box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
    background: #fff;
}

.task-input::placeholder {
    color: #999;
}

/* 暗色模式 */
:global(body.dark-theme) .task-input {
    background: rgba(255, 255, 255, 0.05);
    border-color: #3a3a5a;
    color: #e0e0e0;
}

:global(body.dark-theme) .task-input:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
    background: rgba(255, 255, 255, 0.1);
}

.add-btn {
    padding: 12px 20px;
    font-size: 1rem;
    background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
    color: #333;
    border: 1px solid #ccc;
    border-radius: 10px;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    white-space: nowrap;
}

.add-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

/* 暗色模式下的添加按钮 */
:global(body.dark-theme) .add-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
}

:global(body.dark-theme) .add-btn:hover {
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.add-btn:active {
    transform: translateY(0);
}

@media (max-width: 480px) {
    .input-container {
        flex-direction: column;
    }

    .add-btn {
        width: 100%;
    }
}
</style>