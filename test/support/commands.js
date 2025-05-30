// test/support/commands.js
import fs from 'fs/promises';
import path from 'path';
import { faker } from '@faker-js/faker';
// test/support/commands.js
import supertest from 'supertest';

const baseApiUrl = process.env.BASE_API_URL;

const baseAppUrl = process.env.BASE_APP_URL;

browser.addCommand('createUserViaWeb', async function (randomNumber) {
  const user = {
    name: faker.person.fullName(),
    email: faker.internet.exampleEmail().toLowerCase(),
    password: faker.internet.password({ length: 8 })
  };

  await browser.url(`${baseAppUrl}/register`);
  await expect(browser).toHaveTitle('Notes React Application for Automation Testing Practice');

  // Ativa o interceptor de requisições
  await browser.setupInterceptor();

  // Preenche o formulário de registro
  await browser.scrollAndSetValue('input[name="email"]', user.email);
  await browser.scrollAndSetValue('input[name="name"]', user.name);
  await browser.scrollAndSetValue('input[name="password"]', user.password);
  await browser.scrollAndSetValue('input[name="confirmPassword"]', user.password);
  await browser.scrollAndClick('button=Register');

    // Aguarda a resposta ser exibida na UI
  await $('b=User account created successfully').waitForDisplayed();

  // Aguarda um pouco para garantir que a requisição foi capturada
  await browser.pause(1000);

  // Filtra requisições POST para /register
  const registerRequest = (await browser.getRequests())
    .find(req => req.method === 'POST' && req.url.includes('/register'));

  const userId = registerRequest.response.body.data?.id;

  // Grava os dados em JSON
  const filePath = path.resolve(`test/fixtures/testdata-${randomNumber}.json`);
  await fs.writeFile(filePath, JSON.stringify({
    user_email: user.email,
    user_name: user.name,
    user_password: user.password,
    user_id: userId
  }, null, 2));
});

browser.addCommand('logInUserViaWeb', async function (randomNumber) {
  const filePath = path.resolve(`test/fixtures/testdata-${randomNumber}.json`);
  const user = JSON.parse(await fs.readFile(filePath, 'utf-8'));

  await browser.url(`${baseAppUrl}/login`)

  await browser.scrollAndSetValue('input[name="email"]', user.user_email);
  await browser.scrollAndSetValue('input[name="password"]', user.user_password);  
  await browser.action('wheel').scroll({ deltaY: 99999 }).perform();

  await browser.scrollAndClick('button=Login')  

  await $('input[placeholder="Search notes..."]').waitForDisplayed();

  const token = await browser.execute(() => window.localStorage.getItem('token'));

  await browser.url(`${baseAppUrl}/profile`);
  await $('[data-testid="user-email"]').waitForDisplayed();

  await fs.writeFile(filePath, JSON.stringify({
    ...user,
    user_token: token
  }, null, 2));
});

browser.addCommand('deleteUserViaWeb', async function () {
  await browser.url(`${baseAppUrl}/profile`);
  await browser.action('wheel').scroll({ deltaY: 99999 }).perform();

  await browser.scrollAndClick('button=Delete Account');
  await browser.scrollAndClick('[data-testid="note-delete-confirm"]');
  await $('[data-testid="alert-message"]').waitForDisplayed();
});

browser.addCommand('deleteJsonFile', async function (randomNumber) {
  const filePath = path.resolve(`test/fixtures/testdata-${randomNumber}.json`);
  try {
    await fs.unlink(filePath);
  } catch (err) {
    console.warn(`File not found!: ${filePath}`);
  }
});

browser.addCommand('scrollAndClick', async function (selector) {
  const el = await $(selector);
  await el.waitForExist({ timeout: 10000 });
  await el.scrollIntoView({ block: 'center', inline: 'center' });
  await el.waitForDisplayed({ timeout: 5000 });
  await el.click();
});

browser.addCommand('scrollAndSetValue', async function (selector, value) {
  const el = await $(selector);
  await el.waitForExist({ timeout: 10000 });
  await el.scrollIntoView({ block: 'center', inline: 'center' });
  await el.waitForDisplayed({ timeout: 5000 });
  await el.setValue(value);
});

browser.addCommand('deleteNoteViaWeb', async function (randomNumber, href) {
  await browser.url(`https://practice.expandtesting.com${href}`);
  await browser.scrollAndClick('[data-testid="note-delete"]');
  await browser.scrollAndClick('[data-testid="note-delete-confirm"]');
});

browser.addCommand('scrollAndSelect', async function (selector, value) {
  const element = await $(selector);
  await element.scrollIntoView();
  await element.waitForDisplayed();
  await element.selectByVisibleText(value);
});

browser.addCommand('toHaveTextContaining', async function (selector, expectedSubstring) {
  const element = await $(selector);
  await element.waitForDisplayed();
  const text = await element.getText();

  const pass = text.includes(expectedSubstring);
  if (!pass) {
    throw new Error(`Expected element "${selector}" to contain text "${expectedSubstring}", but got "${text}"`);
  }
});

browser.addCommand('createNoteViaWeb', async function(randomNumber, baseAppUrl) {
  const filePath = path.resolve(`test/fixtures/testdata-${randomNumber}.json`);
  const user = JSON.parse(await fs.readFile(filePath, 'utf-8'));

  const note = {
    title: faker.word.words(3),
    description: faker.word.words(5),
    category: faker.helpers.arrayElement(['Home', 'Work', 'Personal']),
    completed: 2
  };

  await browser.url(baseAppUrl);

  await browser.scrollAndClick('button=+ Add Note');
  await browser.scrollAndSelect('select[name="category"]', note.category);
  await browser.scrollAndSetValue('input[name="title"]', note.title);
  await browser.scrollAndSetValue('textarea[name="description"]', note.description);
  await browser.scrollAndClick('button=Create');

  await browser.refresh();

  const titleEl = await $(`[data-testid="note-card-title"]*=${note.title}`);
  await titleEl.waitForDisplayed();

  const descEl = await $(`[data-testid="note-card-description"]*=${note.description}`);
  await descEl.waitForDisplayed();

  const toggleEl = await $('[data-testid="toggle-note-switch"]');
  expect(await toggleEl.isSelected()).toBe(false);

  // Obtém o valor do atributo href do botão de visualização
  const viewBtn = await $('[data-testid="note-view"]');
  const href = await viewBtn.getAttribute('href');
  const noteId = href?.split('/').pop();

  if (!noteId) {
    throw new Error('note_id não pôde ser extraído do href.');
  }

  await fs.writeFile(filePath, JSON.stringify({
    ...user,
    note_id: noteId,
    note_title: note.title,
    note_description: note.description,
    note_category: note.category,
    note_completed: note.completed
  }, null, 2));
  
});

export async function logInUserViaApi(randomNumber) {
    const rawData = await fs.readFile(`test/fixtures/testdata-${randomNumber}.json`, 'utf-8');
    const user = JSON.parse(rawData);

    const response = await supertest(baseApiUrl)
        .post('/users/login')
        .send({
            email: user.user_email,
            password: user.user_password
        });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Login successful');
    expect(response.body.data.email).toBe(user.user_email);
    expect(response.body.data.name).toBe(user.user_name);
    expect(response.body.data.id).toBe(user.user_id);

    await fs.writeFile(`test/fixtures/testdata-${randomNumber}.json`, JSON.stringify({
        ...user,
        user_token: response.body.data.token
    }, null, 2));
}

export async function deleteUserViaApi(randomNumber) {
    const rawData = await fs.readFile(`test/fixtures/testdata-${randomNumber}.json`, 'utf-8');
    const { user_token } = JSON.parse(rawData);

    const response = await supertest(baseApiUrl)
        .delete('/users/delete-account')
        .set('X-Auth-Token', user_token);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Account successfully deleted');
}

export async function deleteJsonFile(randomNumber) {
    try {
        await fs.unlink(`test/fixtures/testdata-${randomNumber}.json`);
    } catch (err) {
        console.warn(`Arquivo testdata-${randomNumber}.json não encontrado ou já deletado.`);
    }
}

export async function createUserViaApi(randomNumber) {
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
}

export async function deleteNoteViaApi(randomNumber) {
    const rawData = await fs.readFile(`test/fixtures/testdata-${randomNumber}.json`, 'utf-8');
    const { note_id, user_token } = JSON.parse(rawData);

    const response = await supertest(baseApiUrl)
        .delete(`/notes/${note_id}`)
        .set('X-Auth-Token', user_token)
        .type('form');

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Note successfully deleted');
}


export async function createNoteViaApi(randomNumber) {
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
}