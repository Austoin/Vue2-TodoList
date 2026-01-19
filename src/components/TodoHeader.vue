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
    background: #f5f5f5;
    border-radius: 20px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    margin-bottom: 30px;
    border: 1px solid #ccc;
}

:global(body.dark-theme) .header {
    background: rgba(15, 15, 26, 0.95);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    border: 1px solid #3a3a5a;
}

.title {
    font-size: 2.8rem;
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
    color: #333;
    font-weight: 600;
}

.time {
    font-size: 1rem;
    color: #333;
    font-weight: 600;
}

/* Light模式 - 灰色系渐变效果 */
:global(body:not(.dark-theme)) .title {
    background: linear-gradient(90deg, #666666 0%, #333333 50%, #1a1a1a 100%);
    background-clip: text;
    -webkit-background-clip: text;
    font-weight: 800;
    font-size: 2.8rem;
    text-shadow: none;
    color: #333333;
}

:global(body:not(.dark-theme)) .subtitle {
    background: linear-gradient(90deg, #999999 0%, #666666 100%);
    background-clip: text;
    -webkit-background-clip: text;
    font-weight: 500;
    color: #555555;
}

:global(body:not(.dark-theme)) .date {
    background: linear-gradient(90deg, #555555 0%, #333333 100%);
    background-clip: text;
    -webkit-background-clip: text;
    font-weight: 600;
    color: #333333;
}

:global(body:not(.dark-theme)) .time {
    background: linear-gradient(90deg, #777777 0%, #444444 100%);
    background-clip: text;
    -webkit-background-clip: text;
    font-weight: 600;
    color: #444444;
}

/* 暗色主题下的渐变效果 */
:global(body.dark-theme) .header {
    background: rgba(30, 30, 50, 0.95);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

:global(body.dark-theme) .title {
    background: linear-gradient(90deg, #87ceeb 0%, #8b5cf6 50%, #ec4899 100%);
    background-clip: text;
    -webkit-background-clip: text;
    font-weight: 800;
    font-size: 2.8rem;
    text-shadow: none;
    color: #e0e0e0; /* 回退颜色 - 确保可见 */
}

:global(body.dark-theme) .subtitle {
    background: linear-gradient(90deg, #a78bfa 0%, #c084fc 100%);
    background-clip: text;
    -webkit-background-clip: text;
    font-weight: 500;
    color: #c0b0d0; /* 回退颜色 - 确保可见 */
}

:global(body.dark-theme) .date {
    background: linear-gradient(90deg, #67e8f9 0%, #22d3ee 100%);
    background-clip: text;
    -webkit-background-clip: text;
    font-weight: 600;
    color: #67e8f9; /* 回退颜色 - 确保可见 */
}

:global(body.dark-theme) .time {
    background: linear-gradient(90deg, #a5b4fc 0%, #818cf8 100%);
    background-clip: text;
    -webkit-background-clip: text;
    font-weight: 600;
    color: #a5b4fc; /* 回退颜色 - 确保可见 */
}

@media (max-width: 480px) {
    .title {
        font-size: 2rem;
    }

    :global(body:not(.dark-theme)) .title {
        font-size: 2rem;
    }

    :global(body.dark-theme) .title {
        font-size: 2rem;
    }

    .datetime {
        flex-direction: column;
        gap: 5px;
    }
}
</style>