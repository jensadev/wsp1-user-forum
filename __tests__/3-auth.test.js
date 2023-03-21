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

const user2 = {
    name: faker.name.firstName(),
    password: faker.internet.password(),
};

describe('3. Authentication', () => {
    let testSession = null;
    /** Setup
     * Before all tests, we create the user in the database
     * and create a session for the tests
     */
    beforeAll(async () => {
        testSession = await session(app);
        try {
            const hash = await bcrypt.hash(user1.password, 10);
            await pool
                .promise()
                .query(
                    `INSERT INTO ${usersTable} (name, password) VALUES (?,?)`,
                    [user1.name, hash]
                );
        } catch (error) {
            console.log('Something went wrong with database setup: ');
            console.log(error);
        }
    });

    describe('without authentication', () => {
        describe('GET /profile', () => {
            it('should return a 401 response', async () => {
                expect.assertions(2);
                const response = await supertest(app).get('/user/profile');
                expect(response.statusCode).toBe(401);
                expect(response.text).toContain('Access denied');
            });
        });
        describe('POST /logout', () => {
            it('should return a 401 response', async () => {
                expect.assertions(2);
                const response = await supertest(app).post('/logout');
                expect(response.statusCode).toBe(401);
                expect(response.text).toContain('Access denied');
            });
        });
    });
    describe('with authentication', () => {
        let authenticatedSession;

        /** Setup
         * Before east tests, we login the user
         * and create a session for the tests
         */
        beforeEach(async () => {
            await testSession.post('/login').send({
                username: user1.name,
                password: user1.password,
            });
            authenticatedSession = testSession;
        });

        describe('GET /profile', () => {
            it('should return a 200 response', async () => {
                expect.assertions(1);
                const response = await authenticatedSession.get(
                    '/user/profile'
                );
                expect(response.statusCode).toBe(200);
            });
        });
        describe('POST /logout', () => {
            it('should return a 200 response', async () => {
                expect.assertions(2);
                const response = await authenticatedSession.post('/logout');
                expect(response.statusCode).toBe(302);
                expect(response.headers.location).toBe('/');
            });
        });
        afterEach(async () => {
            /* Destroy the session */
            await authenticatedSession.destroy();
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
                    user2.name,
                ]);
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
