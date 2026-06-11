const secureCheck = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    const token = authHeader && (authHeader.includes(' ') ? authHeader.split(' ')[1] : authHeader);

    if (token === 'mock-jwt-token-xyz-123456') {
        req.user = { username: 'admin', role: 'admin' };
        return next();
    }

    return res.status(401).json({ 
        success: false, 
        message: '未检测到有效登录状态，无权访问当前商业智能(BI)供应链数据' 
    });
};

module.exports = { secureCheck };