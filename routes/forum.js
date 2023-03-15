const express = require('express');
const router = express.Router();
const pool = require('../utils/database');
const { authBySession } = require('../middleware/auth');

const forumTable = process.env.DATABASE_FORUMTABLE;

router.get('/new', authBySession, (req, res) => {
    return res.render('forum/new.njk', {
        title: 'New post',
        user: req.session.uid || 0,
    });
});

router.post('/', authBySession, async (req, res) => {
    const { title, body } = req.body;
    if (!title) throw new Error('Title is required');
    if (!body) throw new Error('Body is required');

    const [result] = await pool
        .promise()
        .query(
            `INSERT INTO ${forumTable} (uid, title, body) VALUES (?, ?, ?)`,
            [req.session.uid, title, body]
        );

    if (result.affectedRows === 1) {
        return res.redirect('/');
    }
    throw new Error('Could not create post');
});

module.exports = router;
