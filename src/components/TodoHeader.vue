<script>
export default {
    data() {
        return {
            currentDate: '',
            currentTime: ''
        }
    },

    methods: {
        updateDateTime() {
            const now = new Date()
            const options = { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                weekday: 'long'
            }
            this.currentDate = now.toLocaleDateString('zh-CN', options)
            this.currentTime = now.toLocaleTimeString('zh-CN')
        }
    },

    mounted() {
        this.updateDateTime()
        // 每秒更新时间
        setInterval(() => {
            this.updateDateTime()
        }, 1000)
    }
}
</script>

<template>
    <header class="header">
        <h1 class="title">📝 Vue2 TodoList</h1>
        <p class="subtitle">日常任务管理 - 记录生活每一天</p>
        <div class="datetime">
            <p class="date">{{ currentDate }}</p>
            <p class="time">{{ currentTime }}</p>
        </div>
    </header>
</template>

<style scoped>
.header {
    text-align: center;
    padding: 30px 20px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 20px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.title {
    font-size: 2.5rem;
    color: #333;
    margin-bottom: 10px;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.subtitle {
    font-size: 1.1rem;
    color: #666;
    margin-bottom: 15px;
}

.datetime {
    display: flex;
    justify-content: center;
    gap: 30px;
    flex-wrap: wrap;
}

.date {
    font-size: 1rem;
    color: #4CAF50;
    font-weight: 500;
}

.time {
    font-size: 1rem;
    color: #2196F3;
    font-weight: 500;
}

@media (max-width: 480px) {
    .title {
        font-size: 1.8rem;
    }

    .datetime {
        flex-direction: column;
        gap: 5px;
    }
}
</style>