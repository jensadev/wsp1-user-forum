const app = require('../app');
const supertest = require('supertest');
const session = require('supertest-session');
const pool = require('../utils/database');
const bcrypt = require('bcrypt');

const usersTable = process.env.DATABASE_USERSTABLE;
const { faker } = require('@faker-js/faker');
const user1 = {
    name: faker.name.firstName(),
    password: faker.internet.password(),
};

describe('4. Forum', () => {
    let testSession = null;
    /** Setup
     * Before all tests, we create the user in the database
     * and create a session for the tests
     */
    beforeAll(async () => {
        testSession = await session(app);
        try {
            const hash = await bcrypt.hash(user1.password, 10);
            const [result] = await pool
                .promise()
                .query(
                    `INSERT INTO ${usersTable} (name, password) VALUES (?,?)`,
                    [user1.name, hash]
                );
            user1.id = result.insertId;
        } catch (error) {
            console.log('Something went wrong with database setup: ');
            console.log(error);
        }
    });

    describe('without authentication', () => {
        describe('GET /forum/new', () => {
            it('should return a 401 response', async () => {
                expect.assertions(2);
                const response = await supertest(app).get('/forum/new');
                expect(response.statusCode).toBe(401);
                expect(response.text).toContain('Access denied');
            });
        });
        describe('GET /forum', () => {
            it('should return an array of forum posts', async () => {
                // code
            });
        });
        describe('GET /forum/:id', () => {
            it('should return a single forum post', async () => {
                // code
            });
        });
    });
    describe('with authentication', () => {
        let authenticatedSession;
        let createdPostId;

        /** Setup
         * Before east tests, we login the user
         * and create a session for the tests
         */
        beforeAll(async () => {
            await testSession.post('/login').send({
                username: user1.name,
                password: user1.password,
            });
            authenticatedSession = testSession;
            const post = {
                title: '<script>alert("xss")</script>',
                body: '<script>alert("xss")</script>',
            };

            const response = await testSession.post('/forum').send({ ...post });
            createdPostId = response.header.location.split('/').pop();
        });

        describe('GET /forum/new', () => {
            it('should return a 200 response', async () => {
                expect.assertions(2);
                const response = await authenticatedSession.get('/forum/new');
                expect(response.statusCode).toBe(200);
                expect(response.text).toContain('New post');
            });
        });
        describe('POST /forum', () => {
            it('should create a new forum post', async () => {
                // code
                const post = {
                    title: faker.lorem.sentence(),
                    body: faker.lorem.paragraph(),
                };

                const response = await testSession
                    .post('/forum')
                    .send({ ...post });
                expect(response.statusCode).toBe(302);
            });
        });
        describe('POST /forum with no title', () => {
            it('should return a 400 response', async () => {
                // code
                const post = {
                    body: faker.lorem.paragraph(),
                };

                const response = await testSession
                    .post('/forum')
                    .send({ ...post });
                expect(response.statusCode).toBe(400);
                expect(response.text).toContain('Title is required');
            });
        });
        describe('POST /forum with short title', () => {
            it('should return a 400 response', async () => {
                // code
                const post = {
                    title: 'abc',
                    body: faker.lorem.paragraph(),
                };

                const response = await testSession
                    .post('/forum')
                    .send({ ...post });
                expect(response.statusCode).toBe(400);
                expect(response.text).toContain(
                    'Title must be at least 3 characters'
                );
            });
        });

        describe(`GET /forum/:id}`, () => {
            it(`it should contain sanitized content`, async () => {
                // code
                const response = await testSession.get(
                    `/forum/${createdPostId}`
                );
                expect(response.statusCode).toBe(200);
                expect(response.text).toContain('xss');
                expect(response.text).not.toContain(
                    '<script>alert("xss")</script>'
                );
            });
        });
    });
    /** Teardown
     * After all tests, we delete the users from the database
     * and close the session
     * We also close the database connection
     */
    afterAll(async () => {
        try {
            await pool
                .promise()
                .query(`DELETE FROM ${usersTable} WHERE name = ?`, [
                    user1.name,
                ]);
        } catch (error) {
            console.log('Something went wrong with database cleanup: ');
            console.log(error);
        }
        await pool.end();
        await testSession.destroy();
    });
});
