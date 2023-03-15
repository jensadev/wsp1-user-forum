const express = require('express');
const router = express.Router();
const pool = require('../utils/database');
const { authBySession } = require('../middleware/auth');

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

router.get('/:user/edit', authBySession, function (req, res) {
    return res.json({ msg: `Edit profile for ${req.params.user}` });
});

router.post('/:user/edit', authBySession, async function (req, res) {
    return res.json({ msg: `Edit profile for ${req.params.user}` });
});

module.exports = router;
