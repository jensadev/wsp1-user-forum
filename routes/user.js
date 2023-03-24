const express = require('express');
const router = express.Router();
const pool = require('../utils/database');
const { authBySession } = require('../middleware/auth');
const sanitize = require('../utils/sanitize');
const bcrypt = require('bcrypt');
const validator = require('validator');

const usersTable = process.env.DATABASE_USERSTABLE;

/* GET home page. */
router.get('/profile', authBySession, async function (req, res) {
    const [user] = await pool
        .promise()
        .query(`SELECT * FROM ${usersTable} WHERE id = ? LIMIT 1`, [
            req.session.uid,
        ]);
    if (user.length > 0) {
        return res.render('user/profile.njk', {
            title: 'Profile',
            user: req.session.uid || 0,
            username: user[0].name,
        });
    }
    return res.render('user/profile.njk', {
        title: 'Profile',
        user: req.session.uid || 0,
        error: 'User not found',
    });
});

router.get('/register', function (req, res) {
    return res.render('user/register.njk', {
        title: 'Register',
        user: req.session.uid || 0,
    });
});

router.post('/register', async function (req, res) {
    const { username, password, password2 } = req.body;
    const response = {
        msg: '',
        user: req.session.uid || 0,
        errors: [],
    };
    // validera username och password
    if (!username) response.errors.push('Username is required');
    if (username && username.length <= 3)
        response.errors.push('Username must be at least 3 characters');
    if (username && !validator.isAlphanumeric(username))
        response.errors.push('Username must contain only letters and numbers');

    const [user] = await pool
        .promise()
        .query(`SELECT * FROM ${usersTable} WHERE name = ? LIMIT 1`, [
            username,
        ]);
    if (user.length > 0) response.errors.push('Username already exists');

    if (!password) response.errors.push('Password is required');
    if (!password2) response.errors.push('Password confirmation is required');
    if (password && password.length <= 8)
        response.errors.push('Password must be at least 8 characters');
    if (password && password !== password2)
        response.errors.push('Passwords do not match');
    if (password && !validator.isStrongPassword(password))
        response.errors.push(
            'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
        );

    if (response.errors.length === 0) {
        const hash = await bcrypt.hash(password, 10);

        const [result] = await pool
            .promise()
            .query(`INSERT INTO ${usersTable} (name, password) VALUES (?, ?)`, [
                username,
                hash,
            ]);

        if (result.affectedRows === 1) {
            response.msg = 'User created';
            // return res.render('login.njk', { ...response });
            return res.redirect('/login');
        }
    }
    return res.render('user/register.njk', { ...response });
});

router.get('/:uid', async (req, res) => {
    const uid = req.params.uid;
    if (uid && !isNaN(uid)) {
        const [user] = await pool
            .promise()
            .query(`SELECT * FROM ${usersTable} WHERE id = ? LIMIT 1`, [uid]);
        if (user.length > 0) {
            return res.render('user/profile.njk', {
                title: 'Profile',
                user: req.session.uid || 0,
                username: user[0].name,
            });
        }
    }
    return res.render('user/profile.njk', {
        title: 'Profile',
        user: req.session.uid || 0,
        error: 'User not found',
    });
});

router.get('/:uid/edit', authBySession, function (req, res) {
    return res.json({ msg: `Edit profile for ${req.params.uid}` });
});

router.post('/:uid/edit', authBySession, async function (req, res) {
    return res.json({ msg: `Edit profile for ${req.params.uid}` });
});

module.exports = router;
