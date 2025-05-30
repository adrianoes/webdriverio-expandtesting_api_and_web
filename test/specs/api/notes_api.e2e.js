// test/specs/api/notes_api.e2e.js
import supertest from 'supertest';
import { faker } from '@faker-js/faker';
import {
    createUserViaApi,
    logInUserViaApi,
    deleteUserViaApi,
    deleteNoteViaApi,
    deleteJsonFile,
    createNoteViaApi
} from '../../support/commands.js';
import fs from 'fs/promises';

describe('/notes_api', () => {
    const baseApiUrl = process.env.BASE_API_URL;

    it('Creates a new note via API', async () => {
        const randomNumber = faker.finance.creditCardNumber();
        await createUserViaApi(randomNumber);
        await logInUserViaApi(randomNumber);

        const rawData = await fs.readFile(`test/fixtures/testdata-${randomNumber}.json`, 'utf-8');
        const user = JSON.parse(rawData);

        const note = {
            note_title: faker.word.words(3),
            note_description: faker.word.words(5),
            note_category: faker.helpers.arrayElement(['Home', 'Work', 'Personal'])
        };

        const response = await supertest(baseApiUrl)
            .post('/notes')
            .set('X-Auth-Token', user.user_token)
            .type('form')
            .send({
                title: note.note_title,
                description: note.note_description,
                category: note.note_category
            });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Note successfully created');
        expect(response.body.data.title).toBe(note.note_title);
        expect(response.body.data.description).toBe(note.note_description);
        expect(response.body.data.category).toBe(note.note_category);
        expect(response.body.data.user_id).toBe(user.user_id);

        console.log(response.body.message);

        await fs.writeFile(`test/fixtures/testdata-${randomNumber}.json`, JSON.stringify({
            ...user,
            note_id: response.body.data.id,
            note_title: response.body.data.title,
            note_description: response.body.data.description,
            note_completed: response.body.data.completed,
            note_category: response.body.data.category
        }, null, 2));

        await deleteNoteViaApi(randomNumber);
        await deleteUserViaApi(randomNumber);
        await deleteJsonFile(randomNumber);
    });

    it('Creates a new note via API - Bad request', async () => {
        const randomNumber = faker.finance.creditCardNumber();
        await createUserViaApi(randomNumber);
        await logInUserViaApi(randomNumber);

        const rawData = await fs.readFile(`test/fixtures/testdata-${randomNumber}.json`, 'utf-8');
        const user = JSON.parse(rawData);

        const note = {
            note_title: faker.word.words(3),
            note_description: faker.word.words(5)
        };

        const response = await supertest(baseApiUrl)
            .post('/notes')
            .set('X-Auth-Token', user.user_token)
            .type('form')
            .send({
                title: note.note_title,
                description: note.note_description,
                category: 'a' // categoria inválida
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Category must be one of the categories: Home, Work, Personal');

        console.log(response.body.message);

        await deleteUserViaApi(randomNumber);
        await deleteJsonFile(randomNumber);
    });

    it('Creates a new note via API - Unauthorized request', async () => {
        const randomNumber = faker.finance.creditCardNumber();
        await createUserViaApi(randomNumber);
        await logInUserViaApi(randomNumber);

        const rawData = await fs.readFile(`test/fixtures/testdata-${randomNumber}.json`, 'utf-8');
        const user = JSON.parse(rawData);

        const note = {
            note_title: faker.word.words(3),
            note_description: faker.word.words(5),
            note_category: faker.helpers.arrayElement(['Home', 'Work', 'Personal'])
        };

        const response = await supertest(baseApiUrl)
            .post('/notes')
            .set('X-Auth-Token', '@' + user.user_token) // token inválido
            .type('form')
            .send({
                title: note.note_title,
                description: note.note_description,
                category: note.note_category
            });

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Access token is not valid or has expired, you will need to login');

        console.log(response.body.message);

        await deleteUserViaApi(randomNumber);
        await deleteJsonFile(randomNumber);
    });

    it('Get all notes via API', async () => {
        const randomNumber = faker.finance.creditCardNumber();

        await createUserViaApi(randomNumber);
        await logInUserViaApi(randomNumber);

        const rawData = await fs.readFile(`test/fixtures/testdata-${randomNumber}.json`, 'utf-8');
        const user = JSON.parse(rawData);

        const arrayCategory = [
            faker.helpers.arrayElement(['Home', 'Work', 'Personal']),
            'Home',
            'Work',
            'Personal',
        ];
        const arrayCompleted = [false, false, false, true];
        const arrayTitle = [
            faker.word.words(3),
            faker.word.words(3),
            faker.word.words(3),
            faker.word.words(3),
        ];
        const arrayDescription = [
            faker.word.words(5),
            faker.word.words(5),
            faker.word.words(5),
            faker.word.words(5),
        ];
        const arrayNoteId = [];

        // Cria 4 notas
        for (let k = 0; k < 4; k++) {
            const createResponse = await supertest(baseApiUrl)
                .post('/notes')
                .set('X-Auth-Token', user.user_token)
                .type('form')
                .send({
                    category: arrayCategory[k],
                    completed: arrayCompleted[k],
                    description: arrayDescription[k],
                    title: arrayTitle[k],
                });

            expect(createResponse.status).toBe(200);
            expect(createResponse.body.message).toBe('Note successfully created');
            expect(createResponse.body.data.category).toBe(arrayCategory[k]);
            expect(createResponse.body.data.completed).toBe(arrayCompleted[k]);
            expect(createResponse.body.data.description).toBe(arrayDescription[k]);
            expect(createResponse.body.data.title).toBe(arrayTitle[k]);
            expect(createResponse.body.data.user_id).toBe(user.user_id);

            arrayNoteId[k] = createResponse.body.data.id;
        }

        // Busca todas as notas
        const getResponse = await supertest(baseApiUrl)
            .get('/notes')
            .set('X-Auth-Token', user.user_token);

        expect(getResponse.status).toBe(200);
        expect(getResponse.body.message).toBe('Notes successfully retrieved');

        // Valida ordem reversa das notas
        for (let k = 0; k < 4; k++) {
            const note = getResponse.body.data[k];
            const expectedIndex = 3 - k;

            expect(note.category).toBe(arrayCategory[expectedIndex]);
            expect(note.completed).toBe(arrayCompleted[expectedIndex]);
            expect(note.description).toBe(arrayDescription[expectedIndex]);
            expect(note.title).toBe(arrayTitle[expectedIndex]);
            expect(note.user_id).toBe(user.user_id);
            expect(note.id).toBe(arrayNoteId[expectedIndex]);
        }

        await deleteUserViaApi(randomNumber);
        await deleteJsonFile(randomNumber);
    });

    it('Get all notes via API - Bad request', async () => {
        const randomNumber = faker.finance.creditCardNumber();
        await createUserViaApi(randomNumber);
        await logInUserViaApi(randomNumber);

        const rawData = await fs.readFile(`test/fixtures/testdata-${randomNumber}.json`, 'utf-8');
        const user = JSON.parse(rawData);

        const categories = [faker.helpers.arrayElement(['Home', 'Work', 'Personal']), 'Home', 'Work', 'Personal'];
        const completions = [false, false, false, true];
        const titles = Array(4).fill().map(() => faker.word.words(3));
        const descriptions = Array(4).fill().map(() => faker.word.words(5));

        for (let i = 0; i < 4; i++) {
            const response = await supertest(baseApiUrl)
                .post('/notes')
                .set('X-Auth-Token', user.user_token)
                .type('form')
                .send({
                    category: categories[i],
                    completed: completions[i],
                    description: descriptions[i],
                    title: titles[i]
                });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Note successfully created');
        }

        for (let i = 0; i < 4; i++) {
            const response = await supertest(baseApiUrl)
                .get('/notes/')
                .set('X-Auth-Token', user.user_token)
                .set('x-content-format', 'badRequest')
                .type('form');

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Invalid X-Content-Format header, Only application/json is supported.');
        }

        await deleteUserViaApi(randomNumber);
        await deleteJsonFile(randomNumber);
    });

    it('Get all notes via API - Unauthorized request', async () => {
        const randomNumber = faker.finance.creditCardNumber();
        await createUserViaApi(randomNumber);
        await logInUserViaApi(randomNumber);

        const rawData = await fs.readFile(`test/fixtures/testdata-${randomNumber}.json`, 'utf-8');
        const user = JSON.parse(rawData);

        const categories = [faker.helpers.arrayElement(['Home', 'Work', 'Personal']), 'Home', 'Work', 'Personal'];
        const completions = [false, false, false, true];
        const titles = Array(4).fill().map(() => faker.word.words(3));
        const descriptions = Array(4).fill().map(() => faker.word.words(5));

        for (let i = 0; i < 4; i++) {
            const response = await supertest(baseApiUrl)
                .post('/notes')
                .set('X-Auth-Token', user.user_token)
                .type('form')
                .send({
                    category: categories[i],
                    completed: completions[i],
                    description: descriptions[i],
                    title: titles[i]
                });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Note successfully created');
        }

        for (let i = 0; i < 4; i++) {
            const response = await supertest(baseApiUrl)
                .get('/notes/')
                .set('X-Auth-Token', '@' + user.user_token) // Token inválido
                .type('form');

            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Access token is not valid or has expired, you will need to login');
        }

        await deleteUserViaApi(randomNumber);
        await deleteJsonFile(randomNumber);
    });

    it('Get note by ID via API', async () => {
        const randomNumber = faker.finance.creditCardNumber();
        await createUserViaApi(randomNumber);
        await logInUserViaApi(randomNumber);
        await createNoteViaApi(randomNumber);

        const rawData = await fs.readFile(`test/fixtures/testdata-${randomNumber}.json`, 'utf-8');
        const { user_id, user_token, note_id, note_title, note_description, note_category } = JSON.parse(rawData);

        const response = await supertest(baseApiUrl)
            .get(`/notes/${note_id}`)
            .set('X-Auth-Token', user_token)
            .type('form');

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Note successfully retrieved');
        expect(response.body.data.id).toBe(note_id);
        expect(response.body.data.title).toBe(note_title);
        expect(response.body.data.description).toBe(note_description);
        expect(response.body.data.category).toBe(note_category);
        expect(response.body.data.user_id).toBe(user_id);

        await deleteUserViaApi(randomNumber);
        await deleteJsonFile(randomNumber);
    });

    it('Get note by ID via API - Bad request', async () => {
        const randomNumber = faker.finance.creditCardNumber();
        await createUserViaApi(randomNumber);
        await logInUserViaApi(randomNumber);
        await createNoteViaApi(randomNumber);

        const rawData = await fs.readFile(`test/fixtures/testdata-${randomNumber}.json`, 'utf-8');
        const { user_token, note_id } = JSON.parse(rawData);

        const response = await supertest(baseApiUrl)
            .get(`/notes/${note_id}`)
            .set('X-Auth-Token', user_token)
            .set('x-content-format', 'badRequest')
            .type('form');

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Invalid X-Content-Format header, Only application/json is supported.');

        await deleteUserViaApi(randomNumber);
        await deleteJsonFile(randomNumber);
    });

    it('Get note by ID via API - Unauthorized request', async () => {
        const randomNumber = faker.finance.creditCardNumber();
        await createUserViaApi(randomNumber);
        await logInUserViaApi(randomNumber);
        await createNoteViaApi(randomNumber);

        const rawData = await fs.readFile(`test/fixtures/testdata-${randomNumber}.json`, 'utf-8');
        const { user_token, note_id } = JSON.parse(rawData);

        const response = await supertest(baseApiUrl)
            .get(`/notes/${note_id}`)
            .set('X-Auth-Token', '@' + user_token) // Token inválido
            .type('form');

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Access token is not valid or has expired, you will need to login');

        await deleteUserViaApi(randomNumber);
        await deleteJsonFile(randomNumber);
    });

    it('Update an existing note', async () => {
        const randomNumber = faker.finance.creditCardNumber();
        await createUserViaApi(randomNumber);
        await logInUserViaApi(randomNumber);
        await createNoteViaApi(randomNumber);

        const rawData = await fs.readFile(`test/fixtures/testdata-${randomNumber}.json`, 'utf-8');
        const user = JSON.parse(rawData);

        const updatedNote = {
            note_description: faker.word.words(5),
            note_title: faker.word.words(3),
        };

        const response = await supertest(baseApiUrl)
            .put(`/notes/${user.note_id}`)
            .set('X-Auth-Token', user.user_token)
            .type('form')
            .send({
                category: user.note_category,
                completed: user.note_completed ? 'true' : 'false',
                description: updatedNote.note_description,
                title: updatedNote.note_title,
            });


        console.log('Response status:', response.status);
        console.log('Response body:', JSON.stringify(response.body, null, 2)); // <-- log útil

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Note successfully Updated');
        expect(response.body.data.title).toBe(updatedNote.note_title);
        expect(response.body.data.description).toBe(updatedNote.note_description);
        expect(response.body.data.category).toBe(user.note_category);
        expect(response.body.data.completed).toBe(user.note_completed);
        expect(response.body.data.id).toBe(user.note_id);
        expect(response.body.data.user_id).toBe(user.user_id);

        await deleteUserViaApi(randomNumber);
        await deleteJsonFile(randomNumber);
    });

    it('Update an existing note - Bad request', async () => {
        const randomNumber = faker.finance.creditCardNumber();
        await createUserViaApi(randomNumber);
        await logInUserViaApi(randomNumber);
        await createNoteViaApi(randomNumber);

        const rawData = await fs.readFile(`test/fixtures/testdata-${randomNumber}.json`, 'utf-8');
        const user = JSON.parse(rawData);

        const response = await supertest(baseApiUrl)
            .put(`/notes/${user.note_id}`)
            .set('X-Auth-Token', user.user_token)
            .type('form')
            .send({
                category: 'a',
                completed: user.note_completed,
                description: faker.word.words(5),
                title: faker.word.words(3),
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Category must be one of the categories: Home, Work, Personal');

        await deleteUserViaApi(randomNumber);
        await deleteJsonFile(randomNumber);
    });

    it('Update an existing note - Unauthorized request', async () => {
        const randomNumber = faker.finance.creditCardNumber();
        await createUserViaApi(randomNumber);
        await logInUserViaApi(randomNumber);
        await createNoteViaApi(randomNumber);

        const rawData = await fs.readFile(`test/fixtures/testdata-${randomNumber}.json`, 'utf-8');
        const user = JSON.parse(rawData);
        const invalidToken = '@' + user.user_token;

        const response = await supertest(baseApiUrl)
            .put(`/notes/${user.note_id}`)
            .set('X-Auth-Token', invalidToken)
            .type('form')
            .send({
                category: user.note_category,
                completed: user.note_completed,
                description: faker.word.words(5),
                title: faker.word.words(3),
            });

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Access token is not valid or has expired, you will need to login');

        await deleteUserViaApi(randomNumber);
        await deleteJsonFile(randomNumber);
    });

    it('Update note status', async () => {
        const randomNumber = faker.finance.creditCardNumber();
        await createUserViaApi(randomNumber);
        await logInUserViaApi(randomNumber);
        await createNoteViaApi(randomNumber);

        const rawData = await fs.readFile(`test/fixtures/testdata-${randomNumber}.json`, 'utf-8');
        const user = JSON.parse(rawData);

        const response = await supertest(baseApiUrl)
            .patch(`/notes/${user.note_id}`)
            .set('X-Auth-Token', user.user_token)
            .type('form')
            .send({ completed: false });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Note successfully Updated');
        expect(response.body.data.completed).toBe(false);
        expect(response.body.data.category).toBe(user.note_category);
        expect(response.body.data.description).toBe(user.note_description);
        expect(response.body.data.title).toBe(user.note_title);
        expect(response.body.data.user_id).toBe(user.user_id);

        await deleteUserViaApi(randomNumber);
        await deleteJsonFile(randomNumber);
    });

    it('Update note status - Bad request', async () => {
        const randomNumber = faker.finance.creditCardNumber();
        await createUserViaApi(randomNumber);
        await logInUserViaApi(randomNumber);
        await createNoteViaApi(randomNumber);

        const rawData = await fs.readFile(`test/fixtures/testdata-${randomNumber}.json`, 'utf-8');
        const user = JSON.parse(rawData);

        const response = await supertest(baseApiUrl)
            .patch(`/notes/${user.note_id}`)
            .set('X-Auth-Token', user.user_token)
            .type('form')
            .send({ completed: 'a' });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Note completed status must be boolean');

        await deleteUserViaApi(randomNumber);
        await deleteJsonFile(randomNumber);
    });

    it('Update note status - Unauthorized request', async () => {
        const randomNumber = faker.finance.creditCardNumber();
        await createUserViaApi(randomNumber);
        await logInUserViaApi(randomNumber);
        await createNoteViaApi(randomNumber);

        const rawData = await fs.readFile(`test/fixtures/testdata-${randomNumber}.json`, 'utf-8');
        const user = JSON.parse(rawData);
        const invalidToken = '@' + user.user_token;

        const response = await supertest(baseApiUrl)
            .patch(`/notes/${user.note_id}`)
            .set('X-Auth-Token', invalidToken)
            .type('form')
            .send({ completed: false });

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Access token is not valid or has expired, you will need to login');

        await deleteUserViaApi(randomNumber);
        await deleteJsonFile(randomNumber);
    });

    it('Delete a note by ID', async () => {
        const randomNumber = faker.finance.creditCardNumber();
        await createUserViaApi(randomNumber);
        await logInUserViaApi(randomNumber);
        await createNoteViaApi(randomNumber);

        const rawData = await fs.readFile(`test/fixtures/testdata-${randomNumber}.json`, 'utf-8');
        const user = JSON.parse(rawData);

        const response = await supertest(baseApiUrl)
            .delete(`/notes/${user.note_id}`)
            .set('X-Auth-Token', user.user_token)
            .type('form');

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Note successfully deleted');

        await deleteUserViaApi(randomNumber);
        await deleteJsonFile(randomNumber);
    });

    it('Delete a note by ID - Bad request', async () => {
        const randomNumber = faker.finance.creditCardNumber();
        await createUserViaApi(randomNumber);
        await logInUserViaApi(randomNumber);
        await createNoteViaApi(randomNumber);

        const rawData = await fs.readFile(`test/fixtures/testdata-${randomNumber}.json`, 'utf-8');
        const user = JSON.parse(rawData);
        const invalidNoteId = user.note_id + 2;

        const response = await supertest(baseApiUrl)
            .delete(`/notes/${invalidNoteId}`)
            .set('X-Auth-Token', user.user_token)
            .type('form');

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Note ID must be a valid ID');

        await deleteUserViaApi(randomNumber);
        await deleteJsonFile(randomNumber);
    });

    it('Delete a note by ID - Unauthorized request', async () => {
        const randomNumber = faker.finance.creditCardNumber();
        await createUserViaApi(randomNumber);
        await logInUserViaApi(randomNumber);
        await createNoteViaApi(randomNumber);

        const rawData = await fs.readFile(`test/fixtures/testdata-${randomNumber}.json`, 'utf-8');
        const user = JSON.parse(rawData);
        const invalidToken = '@' + user.user_token;

        const response = await supertest(baseApiUrl)
            .delete(`/notes/${user.note_id}`)
            .set('X-Auth-Token', invalidToken)
            .type('form');

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Access token is not valid or has expired, you will need to login');

        await deleteUserViaApi(randomNumber);
        await deleteJsonFile(randomNumber);
    });

});
