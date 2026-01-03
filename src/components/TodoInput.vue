<script>
export default {
    // 接收父组件传递的props
    props: {
        placeholder: {
            type: String,
            default: '请输入任务...'
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
        <input 
            type="text" 
            class="task-input"
            v-model="inputValue"
            :placeholder="placeholder"
            @keyup.enter="submitTask"
        >
        <button 
            class="add-btn"
            @click="submitTask"
        >
            ➕ 添加
        </button>
    </div>
</template>

<style scoped>
.input-container {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
}

.task-input {
    flex: 1;
    padding: 12px 16px;
    font-size: 1rem;
    border: 2px solid #e0e0e0;
    border-radius: 10px;
    outline: none;
    transition: border-color 0.3s, box-shadow 0.3s;
}

.task-input:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
}

.task-input::placeholder {
    color: #aaa;
}

.add-btn {
    padding: 12px 20px;
    font-size: 1rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    white-space: nowrap;
}

.add-btn:hover {
    transform: translateY(-2px);
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