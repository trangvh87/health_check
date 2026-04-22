const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

// Initialize Telegram Bot
const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
const bot = telegramBotToken ? new TelegramBot(telegramBotToken) : null;
const telegramChatId = process.env.TELEGRAM_CHAT_ID;

// Parse URLs from environment variable
const healthCheckUrls = (process.env.HEALTH_CHECK_URLS || '').split(',').filter(url => url.trim());

// Health check function
async function checkHealth(url) {
    try {
        const response = await axios.get(url, { timeout: 5000 });
        return { url, status: 'OK', statusCode: response.status };
    } catch (error) {
        return { url, status: 'FAILED', error: error.message };
    }
}

// Send Telegram notification
async function sendTelegramNotification(message) {
    try {
        if (!bot || !telegramChatId) {
            console.warn('Telegram notification skipped: missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID');
            return;
        }
        await bot.sendMessage(telegramChatId, message);
    } catch (error) {
        console.error('Failed to send Telegram notification:', error.message);
    }
}

// Main health check job
async function runHealthCheck() {
    console.log(`[${new Date().toISOString()}] Running health check...`);

    const results = await Promise.all(healthCheckUrls.map(url => checkHealth(url.trim())));

    const failedChecks = results.filter(result => result.status === 'FAILED');
    const successfulChecks = results.filter(result => result.status === 'OK');

    if (failedChecks.length > 0) {
        const message = `⚠️ *Health Check Failed*\n\n${failedChecks.map(f => `❌ ${f.url}\nError: ${f.error}`).join('\n\n')}`;
        await sendTelegramNotification(message);
        console.error('Failed checks:', failedChecks);
    } else {
        console.log('All health checks passed ✓');
    }

    return {
        successfulUrls: successfulChecks.map(result => result.url),
        failedUrls: failedChecks.map(result => result.url),
        total: results.length
    };
}

console.log('Health check API ready. Use external scheduler (cron-job.org) to trigger endpoint.');
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Health check API is running',
        triggerEndpoint: '/api/health-check/trigger',
        statusEndpoint: '/api/health-check/status'
    });
});

// API endpoint to trigger health check manually
app.post('/api/health-check/trigger', async (req, res) => {
    try {
        const summary = await runHealthCheck();
        res.status(200).json({
            message: 'Health check triggered successfully',
            successfulUrls: summary.successfulUrls,
            total: summary.total
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Health check status endpoint
app.get('/api/health-check/status', (req, res) => {
    res.status(200).json({ 
        status: 'running',
        urlCount: healthCheckUrls.length,
        lastCheck: new Date().toISOString()
    });
});

if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Health check API server running on port ${PORT}`);
    });
}

module.exports = app;
module.exports.runHealthCheck = runHealthCheck;