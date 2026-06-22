// routes/auth.js
const express = require('express');
const router = express.Router();
const dataService = require('../services/dataService');
const { secureCheck } = require('./authMiddleware');

const MOCK_USER = {
    username: 'admin',
    password: '123456',
    name: '供应链总监',
    role: 'admin'
};

router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: '账号或密码不能为空' });
    }

    if (username === MOCK_USER.username && password === MOCK_USER.password) {
        return res.json({
            success: true,
            message: '登录成功',
            data: {
                name: MOCK_USER.name,
                role: MOCK_USER.role,
                token: 'mock-jwt-token-xyz-123456'
            }
        });
    } else {
        return res.status(401).json({ success: false, message: '账号或密码错误，请重试' });
    }
});

module.exports = router;