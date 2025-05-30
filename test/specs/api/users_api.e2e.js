// test/specs/api/users_api.e2e.js
import supertest from 'supertest';
import { faker } from '@faker-js/faker';
import {
    logInUserViaApi,
    deleteUserViaApi,
    deleteJsonFile,
    createUserViaApi
} from '../../support/commands.js';
import fs from 'fs/promises';

describe('/users_api', () => {
    const baseApiUrl = process.env.BASE_API_URL;

    it('Creates a new user account via API', async () => {
        const randomNumber = faker.finance.creditCardNumber();
        const user = {
            user_email: faker.internet.exampleEmail().toLowerCase(),
            user_name: faker.person.fullName(),
            user_password: faker.internet.password({ length: 8 })
        };

        const response = await supertest(baseApiUrl)
            .post('/users/register')
            .send({
                name: user.user_name,
                email: user.user_email,
                password: user.user_password
            });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.status).toBe(201);
        expect(response.body.message).toBe('User account created successfully');
        expect(response.body.data.email).toBe(user.user_email);
        expect(response.body.data.name).toBe(user.user_name);


        await fs.writeFile(`test/fixtures/testdata-${randomNumber}.json`, JSON.stringify({
            user_email: user.user_email,
            user_id: response.body.data.id,
            user_name: user.user_name,
            user_password: user.user_password
        }, null, 2));

        await logInUserViaApi(randomNumber);
        await deleteUserViaApi(randomNumber);
        await deleteJsonFile(randomNumber);
    });

    it('Creates a new user account via API - Bad request', async () => {
        const user = {
            user_email: faker.internet.exampleEmail().toLowerCase(),
            user_name: faker.person.fullName(),
            user_password: faker.internet.password({ length: 8 })
        }

        const response = await supertest(baseApiUrl)
            .post('/users/register')
            .send({
                name: user.user_name,
                email: '@' + user.user_email,
                password: user.user_password
            })

        expect(response.status).toBe(400)
        expect(response.body.success).toBe(false)
        expect(response.body.message).toBe('A valid email address is required')
    })

    it('Log in as an existing user via API', async () => {
        const randomNumber = faker.finance.creditCardNumber()
        await createUserViaApi(randomNumber)

        const rawData = await fs.readFile(`test/fixtures/testdata-${randomNumber}.json`, 'utf-8');
        const user = JSON.parse(rawData);

        const response = await supertest(baseApiUrl)
            .post('/users/login')
            .send({
                email: user.user_email,
                password: user.user_password
            })

        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.message).toBe('Login successful')
        expect(response.body.data.email).toBe(user.user_email)
        expect(response.body.data.name).toBe(user.user_name)
        expect(response.body.data.id).toBe(user.user_id)

        user.user_token = response.body.data.token
        await fs.writeFile(`test/fixtures/testdata-${randomNumber}.json`, JSON.stringify(user, null, 2));

        await deleteUserViaApi(randomNumber);
        await deleteJsonFile(randomNumber);
    })

    it('Log in as an existing user via API - Bad request', async () => {
        const randomNumber = faker.finance.creditCardNumber()
        await createUserViaApi(randomNumber)

        const rawData = await fs.readFile(`test/fixtures/testdata-${randomNumber}.json`, 'utf-8');
        const user = JSON.parse(rawData);

        const response = await supertest(baseApiUrl)
            .post('/users/login')
            .send({
                email: '@' + user.user_email,
                password: user.user_password
            })

        expect(response.status).toBe(400)
        expect(response.body.success).toBe(false)
        expect(response.body.message).toBe('A valid email address is required')

        await logInUserViaApi(randomNumber)
        await deleteUserViaApi(randomNumber)
        await deleteJsonFile(randomNumber)
    })

    it('Log in as an existing user via API - Unauthorized Request', async () => {
        const randomNumber = faker.finance.creditCardNumber()
        await createUserViaApi(randomNumber)

        const rawData = await fs.readFile(`test/fixtures/testdata-${randomNumber}.json`, 'utf-8');
        const user = JSON.parse(rawData);

        const response = await supertest(baseApiUrl)
            .post('/users/login')
            .send({
                email: user.user_email,
                password: '@' + user.user_password
            })

        expect(response.status).toBe(401)
        expect(response.body.success).toBe(false)
        expect(response.body.message).toBe('Incorrect email address or password')

        await logInUserViaApi(randomNumber)
        await deleteUserViaApi(randomNumber)
        await deleteJsonFile(randomNumber)
    })

    it('Retrieve user profile information via API', async () => {
        const randomNumber = faker.finance.creditCardNumber()
        await createUserViaApi(randomNumber)
        await logInUserViaApi(randomNumber)

        const rawData = await fs.readFile(`test/fixtures/testdata-${randomNumber}.json`, 'utf-8');
        const user = JSON.parse(rawData);

        const response = await supertest(baseApiUrl)
            .get('/users/profile')
            .set('X-Auth-Token', user.user_token)

        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.message).toBe('Profile successful')
        expect(response.body.data.email).toBe(user.user_email)
        expect(response.body.data.name).toBe(user.user_name)
        expect(response.body.data.id).toBe(user.user_id)

        await deleteUserViaApi(randomNumber)
        await deleteJsonFile(randomNumber)
    })

    it('Retrieve user profile information via API - Bad Request', async () => {
        const randomNumber = faker.finance.creditCardNumber()
        await createUserViaApi(randomNumber)
        await logInUserViaApi(randomNumber)

        const rawData = await fs.readFile(`test/fixtures/testdata-${randomNumber}.json`, 'utf-8');
        const user = JSON.parse(rawData);

        const response = await supertest(baseApiUrl)
            .get('/users/profile')
            .set('X-Auth-Token', user.user_token)
            .set('x-content-format', 'badRequest')

        expect(response.status).toBe(400)
        expect(response.body.success).toBe(false)
        expect(response.body.message).toBe('Invalid X-Content-Format header, Only application/json is supported.')

        await deleteUserViaApi(randomNumber)
        await deleteJsonFile(randomNumber)
    })

    it('Retrieve user profile information via API - Unauthorized Request', async () => {
        const randomNumber = faker.finance.creditCardNumber()
        await createUserViaApi(randomNumber)
        await logInUserViaApi(randomNumber)

        const rawData = await fs.readFile(`test/fixtures/testdata-${randomNumber}.json`, 'utf-8');
        const user = JSON.parse(rawData);

        const response = await supertest(baseApiUrl)
            .get('/users/profile')
            .set('X-Auth-Token', '@' + user.user_token)

        expect(response.status).toBe(401)
        expect(response.body.success).toBe(false)
        expect(response.body.message).toBe('Access token is not valid or has expired, you will need to login')

        await deleteUserViaApi(randomNumber)
        await deleteJsonFile(randomNumber)
    })

    it('Update the user profile information via API', async () => {
        const randomNumber = faker.finance.creditCardNumber()
        await createUserViaApi(randomNumber)
        await logInUserViaApi(randomNumber)

        const rawData = await fs.readFile(`test/fixtures/testdata-${randomNumber}.json`, 'utf-8');
        const user = JSON.parse(rawData);

        const updatedUser = {
            updated_user_name: faker.person.fullName(),
            updated_user_phone: faker.string.numeric({ length: 12 }),
            updated_user_company: faker.internet.userName()
        }

        const response = await supertest(baseApiUrl)
            .patch('/users/profile')
            .set('X-Auth-Token', user.user_token)
            .send({
                name: updatedUser.updated_user_name,
                phone: updatedUser.updated_user_phone,
                company: updatedUser.updated_user_company
            })

        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.message).toBe('Profile updated successful')
        expect(response.body.data.name).toBe(updatedUser.updated_user_name)
        expect(response.body.data.phone).toBe(updatedUser.updated_user_phone)
        expect(response.body.data.company).toBe(updatedUser.updated_user_company)
        expect(response.body.data.email).toBe(user.user_email)
        expect(response.body.data.id).toBe(user.user_id)

        await deleteUserViaApi(randomNumber)
        await deleteJsonFile(randomNumber)
    })

    it('Update the user profile information via API - Bad Request', async () => {
        const randomNumber = faker.finance.creditCardNumber();
        await createUserViaApi(randomNumber);
        await logInUserViaApi(randomNumber);

        const rawData = await fs.readFile(`test/fixtures/testdata-${randomNumber}.json`, 'utf-8');
        const user = JSON.parse(rawData);

        const updatedUser = {
            company: faker.internet.userName(),
            phone: faker.string.numeric({ length: 12 }),
            name: '6@#' // inválido para forçar Bad Request
        };

        const response = await supertest(baseApiUrl)
            .patch('/users/profile')
            .set('X-Auth-Token', user.user_token)
            .type('form')
            .send(updatedUser);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('User name must be between 4 and 30 characters');
        console.log(response.body.message);

        await deleteUserViaApi(randomNumber);
        await deleteJsonFile(randomNumber);
    });

    it('Update the user profile information via API - Unauthorized Request', async () => {
        const randomNumber = faker.finance.creditCardNumber();
        await createUserViaApi(randomNumber);
        await logInUserViaApi(randomNumber);

        const rawData = await fs.readFile(`test/fixtures/testdata-${randomNumber}.json`, 'utf-8');
        const user = JSON.parse(rawData);

        const updatedUser = {
            company: faker.internet.userName(),
            phone: faker.string.numeric({ length: 12 }),
            name: faker.person.fullName()
        };

        const response = await supertest(baseApiUrl)
            .patch('/users/profile')
            .set('X-Auth-Token', '@' + user.user_token) // token inválido para forçar Unauthorized
            .type('form')
            .send(updatedUser);

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Access token is not valid or has expired, you will need to login');
        console.log(response.body.message);

        await deleteUserViaApi(randomNumber);
        await deleteJsonFile(randomNumber);
    });

    it('Change a user\'s password via API', async () => {
        const randomNumber = faker.finance.creditCardNumber();
        await createUserViaApi(randomNumber);
        await logInUserViaApi(randomNumber);

        const rawData = await fs.readFile(`test/fixtures/testdata-${randomNumber}.json`, 'utf-8');
        const user = JSON.parse(rawData);
        const updatedPassword = faker.internet.password({ length: 8 });

        const response = await supertest(baseApiUrl)
            .post('/users/change-password')
            .set('X-Auth-Token', user.user_token)
            .type('form')
            .send({
                currentPassword: user.user_password,
                newPassword: updatedPassword
            });

        expect(user.user_password).not.toBe(updatedPassword);
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('The password was successfully updated');
        console.log(response.body.message);

        await deleteUserViaApi(randomNumber);
        await deleteJsonFile(randomNumber);
    });

    it('Change password - Bad Request', async () => {
        const randomNumber = faker.finance.creditCardNumber();
        await createUserViaApi(randomNumber);
        await logInUserViaApi(randomNumber);

        const rawData = await fs.readFile(`test/fixtures/testdata-${randomNumber}.json`, 'utf-8');
        const user = JSON.parse(rawData);

        const response = await supertest(baseApiUrl)
            .post('/users/change-password')
            .set('X-Auth-Token', user.user_token)
            .type('form')
            .send({
                currentPassword: user.user_password,
                newPassword: '123'
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('New password must be between 6 and 30 characters');
        console.log(response.body.message);

        await deleteUserViaApi(randomNumber);
        await deleteJsonFile(randomNumber);
    });

    it('Change password - Unauthorized Request', async () => {
        const randomNumber = faker.finance.creditCardNumber();
        await createUserViaApi(randomNumber);
        await logInUserViaApi(randomNumber);

        const rawData = await fs.readFile(`test/fixtures/testdata-${randomNumber}.json`, 'utf-8');
        const user = JSON.parse(rawData);
        const updatedPassword = faker.internet.password({ length: 8 });

        const response = await supertest(baseApiUrl)
            .post('/users/change-password')
            .set('X-Auth-Token', '@' + user.user_token)
            .type('form')
            .send({
                currentPassword: user.user_password,
                newPassword: updatedPassword
            });

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Access token is not valid or has expired, you will need to login');
        console.log(response.body.message);

        await deleteUserViaApi(randomNumber);
        await deleteJsonFile(randomNumber);
    });

    it('Logout via API', async () => {
        const randomNumber = faker.finance.creditCardNumber();
        await createUserViaApi(randomNumber);
        await logInUserViaApi(randomNumber);

        const rawData = await fs.readFile(`test/fixtures/testdata-${randomNumber}.json`, 'utf-8');
        const user = JSON.parse(rawData);

        const response = await supertest(baseApiUrl)
            .delete('/users/logout')
            .set('X-Auth-Token', user.user_token)
            .type('form');

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('User has been successfully logged out');
        console.log(response.body.message);

        await logInUserViaApi(randomNumber); // Re-login to delete
        await deleteUserViaApi(randomNumber);
        await deleteJsonFile(randomNumber);
    });

    it('Logout - Bad Request', async () => {
        const randomNumber = faker.finance.creditCardNumber();
        await createUserViaApi(randomNumber);
        await logInUserViaApi(randomNumber);

        const rawData = await fs.readFile(`test/fixtures/testdata-${randomNumber}.json`, 'utf-8');
        const user = JSON.parse(rawData);

        const response = await supertest(baseApiUrl)
            .delete('/users/logout')
            .set('X-Auth-Token', user.user_token)
            .set('x-content-format', 'badRequest')
            .type('form');

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Invalid X-Content-Format header, Only application/json is supported.');
        console.log(response.body.message);

        await deleteUserViaApi(randomNumber);
        await deleteJsonFile(randomNumber);
    });

    it('Logout - Unauthorized Request', async () => {
        const randomNumber = faker.finance.creditCardNumber();
        await createUserViaApi(randomNumber);
        await logInUserViaApi(randomNumber);

        const rawData = await fs.readFile(`test/fixtures/testdata-${randomNumber}.json`, 'utf-8');
        const user = JSON.parse(rawData);

        const response = await supertest(baseApiUrl)
            .delete('/users/logout')
            .set('X-Auth-Token', '@' + user.user_token)
            .type('form');

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Access token is not valid or has expired, you will need to login');
        console.log(response.body.message);

        await deleteUserViaApi(randomNumber);
        await deleteJsonFile(randomNumber);
    });

    it('Delete user account via API', async () => {
        const randomNumber = faker.finance.creditCardNumber();
        await createUserViaApi(randomNumber);
        await logInUserViaApi(randomNumber);

        const rawData = await fs.readFile(`test/fixtures/testdata-${randomNumber}.json`, 'utf-8');
        const user = JSON.parse(rawData);

        const response = await supertest(baseApiUrl)
            .delete('/users/delete-account')
            .set('X-Auth-Token', user.user_token)
            .type('form');

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Account successfully deleted');
        console.log(response.body.message);

        await deleteJsonFile(randomNumber);
    });

    it('Delete user account - Bad Request', async () => {
        const randomNumber = faker.finance.creditCardNumber();
        await createUserViaApi(randomNumber);
        await logInUserViaApi(randomNumber);

        const rawData = await fs.readFile(`test/fixtures/testdata-${randomNumber}.json`, 'utf-8');
        const user = JSON.parse(rawData);

        const response = await supertest(baseApiUrl)
            .delete('/users/delete-account')
            .set('X-Auth-Token', user.user_token)
            .set('x-content-format', 'badRequest')
            .type('form');

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Invalid X-Content-Format header, Only application/json is supported.');
        console.log(response.body.message);

        await deleteUserViaApi(randomNumber);
        await deleteJsonFile(randomNumber);
    });

    it('Delete user account - Unauthorized Request', async () => {
        const randomNumber = faker.finance.creditCardNumber();
        await createUserViaApi(randomNumber);
        await logInUserViaApi(randomNumber);

        const rawData = await fs.readFile(`test/fixtures/testdata-${randomNumber}.json`, 'utf-8');
        const user = JSON.parse(rawData);

        const response = await supertest(baseApiUrl)
            .delete('/users/delete-account')
            .set('X-Auth-Token', '@' + user.user_token)
            .type('form');

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Access token is not valid or has expired, you will need to login');
        console.log(response.body.message);

        await deleteUserViaApi(randomNumber);
        await deleteJsonFile(randomNumber);
    });

});




























