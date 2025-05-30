// test/specs/api/health_api.e2e.js
import supertest from 'supertest';

describe('/health_api', () => {
    const baseApiUrl = process.env.BASE_API_URL;

    it('Check the health of the API Notes services via API', async () => {
        const response = await supertest(baseApiUrl)
            .get('/health-check')
            .set('Accept', 'application/json');

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
            success: true,
            status: 200,
            message: 'Notes API is Running'
        });

        console.log('Response body:', response.body);
    });
});
