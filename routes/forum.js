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
    const response = {
        msg: '',
        user: req.session.uid || 0,
        errors: [],
    };
    // validera title och body
    if (!title) response.errors.push('Title is required');
    if (!body) response.errors.push('Body is required');
    if (title.length < 3)
        response.errors.push('Title must be at least 3 characters');
    if (body.length < 10)
        response.errors.push('Body must be at least 10 characters');

    // sanitize title och body, tvätta datan

    if (response.errors.length === 0) {
        const [result] = await pool
            .promise()
            .query(
                `INSERT INTO ${forumTable} (uid, title, body) VALUES (?, ?, ?)`,
                [req.session.uid, title, body]
            );

        if (result.affectedRows === 1) {
            return res.redirect(`/forum/${result.insertId}`);
        }

        response.msg = 'Could not create post';
    }
    return res.render('forum/new.njk', {
        title: 'New post',
        ...response,
    });
});

router.get('/:id', async (req, res) => {
    const response = {
        msg: '',
        user: req.session.uid || 0,
        errors: [],
    };
    const [result] = await pool
        .promise()
        .query(`SELECT * FROM ${forumTable} WHERE id = ?`, [req.params.id]);

    if (result.length === 1) {
        response.post = result[0];
        return res.render('forum/post.njk', {
            title: `${response.post.title}`,
            ...response,
        });
    }

    response.msg = 'Could not find post';
    return res.render('forum/post.njk', response);
});

module.exports = router;
