const express = require('express');
const router = express.Router();
const pool = require('../utils/database');
const { authBySession } = require('../middleware/auth');
const bcrypt = require('bcrypt');

const usersTable = process.env.DATABASE_USERSTABLE;
const forumTable = process.env.DATABASE_FORUMTABLE;

const userSlug = (username) => username.toLowerCase().replace(/ /g, '-');

router.get('/', async (req, res) => {
    const [rows] = await pool.promise()
        .query(`SELECT ${forumTable}.*, ${usersTable}.name AS author FROM ${forumTable}
        JOIN ${usersTable} ON ${forumTable}.uid = ${usersTable}.id ORDER BY id DESC`);

    return res.render('index.njk', {
        title: 'Mitt user forum',
        user: req.session.uid || 0,
        posts: rows || [],
    });
});

router.get('/login', (req, res) => {
    if (req.session.uid && req.session.username) {
        // return res.redirect(`/user/${userSlug(req.session.username)}`
        return res.redirect(`/user/${req.session.uid}`);
    }
    return res.render('user/login.njk', {
        title: 'Login',
        user: req.session.uid || 0,
    });
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username) throw new Error('Username is Required');
        if (!password) throw new Error('Password is Required');

        const [rows] = await pool
            .promise()
            .query(
                `SELECT id, password FROM ${usersTable} WHERE name = ? LIMIT 1`,
                [username]
            );

        const result = rows[0];

        if (!result) throw new Error('User not found');
        const match = await bcrypt.compare(password, result.password);
        if (!match) throw new Error('Invalid username or password');

        req.session.uid = result.id;
        req.session.username = username;
        // return res.redirect(`/user/${userSlug(req.session.username)}`);
        return res.redirect(`/user/${req.session.uid}`);
    } catch (error) {
        return res.render('user/login.njk', {
            title: 'Login',
            error: error.message,
        });
    }
});

router.post('/logout', authBySession, (req, res) => {
    req.session.destroy();
    return res.redirect('/');
});

module.exports = router;
