const app = require('../app');
const supertest = require('supertest');

describe('1. Setup', () => {
    describe('GET / ', () => {
        it('should return a 200 response', async () => {
            expect.assertions(1);
            const response = await supertest(app).get('/');
            expect(response.statusCode).toBe(200);
        });
        it('should return a html response', async () => {
            expect.assertions(1);
            const response = await supertest(app).get('/');
            expect(response.headers['content-type']).toBe(
                'text/html; charset=utf-8'
            );
        });
        it('should return a html response with title', async () => {
            expect.assertions(1);
            const response = await supertest(app).get('/');
            expect(response.text).toContain('<h1>Login ALC</h1>');
        });
    });
});
