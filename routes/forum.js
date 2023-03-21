const express = require('express');
const router = express.Router();
const pool = require('../utils/database');
const { authBySession } = require('../middleware/auth');
const validator = require('validator');

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
    if (title && title.length < 4)
        response.errors.push('Title must be at least 3 characters');
    if (body && body.length < 10)
        response.errors.push('Body must be at least 10 characters');

    if (response.errors.length === 0) {
        // sanitize title och body, tvätta datan
        const sanitize = (str) => {
            let temp = str.trim();
            temp = validator.stripLow(temp);
            temp = validator.escape(temp);
            return temp;
        };
        if (title) sanitizedTitle = sanitize(title);
        if (body) sanitizedBody = sanitize(body);

        const [result] = await pool
            .promise()
            .query(
                `INSERT INTO ${forumTable} (uid, title, body) VALUES (?, ?, ?)`,
                [req.session.uid, sanitizedTitle, sanitizedBody]
            );

        if (result.affectedRows === 1) {
            return res.redirect(`/forum/${result.insertId}`);
        }

        response.msg = 'Could not create post';
    }
    return res.status(400).render('forum/new.njk', {
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
