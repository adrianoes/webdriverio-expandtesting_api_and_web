import { faker } from '@faker-js/faker';
import fs from 'fs/promises';
import path from 'path';
// import '../../support/commands.js';
import {
    createUserViaApi,
    logInUserViaApi,
    deleteUserViaApi,
    deleteNoteViaApi,
    deleteJsonFile,
    createNoteViaApi
} from '../../support/commands.js';


describe('/users_api_and_web', () => {
  const baseAppUrl = process.env.BASE_APP_URL;

  it('create user via api and web', async () => {
    const randomNumber = faker.string.numeric(8);
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

    // Executa ações subsequentes
    await logInUserViaApi(randomNumber);
    await deleteUserViaApi(randomNumber);
    await browser.deleteJsonFile(randomNumber);
  });

  it('login user via api and web', async () => {
    const randomNumber = faker.string.numeric(8);
    await createUserViaApi(randomNumber);
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

    await deleteUserViaApi(randomNumber);
    await browser.deleteJsonFile(randomNumber);
  });

  it('login user via api and web - wrong password', async () => {
    const randomNumber = faker.string.numeric(8);

    await createUserViaApi(randomNumber);
    const filePath = path.resolve(`test/fixtures/testdata-${randomNumber}.json`);
    const user = JSON.parse(await fs.readFile(filePath, 'utf-8'));

    await browser.url(`${baseAppUrl}/login`);

    await browser.scrollAndSetValue('input[name="email"]', user.user_email);
    await browser.scrollAndSetValue('input[name="password"]', 'e' + user.user_password);
    await browser.scrollAndClick('button=Login');

    const alert = await $('[data-testid="alert-message"]');
    await alert.waitForDisplayed();

    const alertText = await alert.getText();
    expect(alertText.includes('Incorrect email address or password')).toBe(true);

    // Cleanup
    await logInUserViaApi(randomNumber);
    await deleteUserViaApi(randomNumber);
    await browser.deleteJsonFile(randomNumber);
  });

  it('login user via api and web - invalid email', async () => {
    const randomNumber = faker.string.numeric(8);

    await createUserViaApi(randomNumber);
    const filePath = path.resolve(`test/fixtures/testdata-${randomNumber}.json`);
    const user = JSON.parse(await fs.readFile(filePath, 'utf-8'));

    await browser.url(`${baseAppUrl}/login`);

    await browser.scrollAndSetValue('input[name="email"]', 'e' + user.user_email);
    await browser.scrollAndSetValue('input[name="password"]', user.user_password);
    await browser.scrollAndClick('button=Login');

    const alert = await $('[data-testid="alert-message"]');
    await alert.waitForDisplayed();

    const alertText = await alert.getText();
    expect(alertText.includes('Incorrect email address or password')).toBe(true);

    // Cleanup
    await logInUserViaApi(randomNumber);
    await deleteUserViaApi(randomNumber);
    await browser.deleteJsonFile(randomNumber);
  });

  it('retrieve user via api and web', async () => {
    const randomNumber = faker.string.numeric(8);

    await createUserViaApi(randomNumber);
    await browser.logInUserViaWeb(randomNumber);

    await browser.scrollAndClick('a[href="/notes/app/profile"]');

    await deleteUserViaApi(randomNumber);
    await browser.deleteJsonFile(randomNumber);
  });

  it('update user via api and web', async () => {
    const randomNumber = faker.string.numeric(8);

    await createUserViaApi(randomNumber);
    await browser.logInUserViaWeb(randomNumber);

    await browser.scrollAndClick('a[href="/notes/app/profile"]');
    await browser.scrollAndSetValue('input[name="phone"]', faker.string.numeric(12));
    await browser.scrollAndSetValue('input[name="company"]', faker.internet.userName());
    await browser.action('wheel').scroll({ deltaY: 99999 }).perform();
    await browser.scrollAndClick('button=Update profile');

    const successAlert = await $('[data-testid="alert-message"]');
    await successAlert.waitForDisplayed();
    const alertText = await successAlert.getText();
    expect(alertText).toContain('Profile updated successful');

    await deleteUserViaApi(randomNumber);
    await browser.deleteJsonFile(randomNumber);
  });

  it('update user via api and web - invalid company name', async () => {
    const randomNumber = faker.string.numeric(8);

    await createUserViaApi(randomNumber);
    await browser.logInUserViaWeb(randomNumber);

    await browser.scrollAndClick('a[href="/notes/app/profile"]');
    await browser.scrollAndSetValue('input[name="phone"]', faker.string.numeric(12));
    await browser.scrollAndSetValue('input[name="company"]', 'e');
    await browser.action('wheel').scroll({ deltaY: 99999 }).perform();
    await browser.scrollAndClick('button=Update profile');

    const errorMessage = await $('.mb-4 > .invalid-feedback');
    await errorMessage.waitForDisplayed();

    const errorText = await errorMessage.getText();
    expect(errorText.includes('company name should be between 4 and 30 characters')).toBe(true);

    await deleteUserViaApi(randomNumber);
    await browser.deleteJsonFile(randomNumber);
  });

  it('update user via api and web - invalid phone number', async () => {
    const randomNumber = faker.string.numeric(8);

    await createUserViaApi(randomNumber);
    await browser.logInUserViaWeb(randomNumber);

    await browser.scrollAndClick('a[href="/notes/app/profile"]');
    await browser.scrollAndSetValue('input[name="phone"]', faker.string.numeric(2));
    await browser.scrollAndSetValue('input[name="company"]', faker.internet.userName());
    await browser.action('wheel').scroll({ deltaY: 99999 }).perform();
    await browser.scrollAndClick('button=Update profile');

    const errorMessage = await $(':nth-child(2) > .mb-2 > .invalid-feedback');
    await errorMessage.waitForDisplayed();

    const errorText = await errorMessage.getText();
    expect(errorText.includes('Phone number should be between 8 and 20 digits')).toBe(true);

    await deleteUserViaApi(randomNumber);
    await browser.deleteJsonFile(randomNumber);
  });

  it("update user's password via api and web", async () => {
    const randomNumber = faker.string.numeric(8);

    await createUserViaApi(randomNumber);
    await browser.logInUserViaWeb(randomNumber);

    const filePath = path.resolve(`test/fixtures/testdata-${randomNumber}.json`);
    const userData = JSON.parse(await fs.readFile(filePath, 'utf-8'));

    const user = {
      user_password: userData.user_password,
      new_password: faker.internet.password(8),
    };

    await browser.scrollAndClick('a[href="/notes/app/profile"]');
    await browser.scrollAndClick('[data-testid="change-password"]');
    await browser.scrollAndSetValue('input[data-testid="current-password"]', user.user_password);
    await browser.scrollAndSetValue('input[data-testid="new-password"]', user.new_password);
    await browser.scrollAndSetValue('input[data-testid="confirm-password"]', user.new_password);
    await browser.scrollAndClick('button=Update password');

    const successAlert = await $('[data-testid="alert-message"]');
    await successAlert.waitForDisplayed();
    const alertText = await successAlert.getText();
    expect(alertText).toContain('The password was successfully updated');

    await deleteUserViaApi(randomNumber);
    await browser.deleteJsonFile(randomNumber);
  });

  it("update user's password via api and web - same password", async () => {
    const randomNumber = faker.string.numeric(8);

    await createUserViaApi(randomNumber);
    await browser.logInUserViaWeb(randomNumber);

    const filePath = path.resolve(`test/fixtures/testdata-${randomNumber}.json`);
    const userData = JSON.parse(await fs.readFile(filePath, 'utf-8'));

    const user = {
      user_password: userData.user_password,
    };

    await browser.scrollAndClick('a[href="/notes/app/profile"]');
    await browser.scrollAndClick('[data-testid="change-password"]');
    await browser.scrollAndSetValue('input[data-testid="current-password"]', user.user_password);
    await browser.scrollAndSetValue('input[data-testid="new-password"]', user.user_password);
    await browser.scrollAndSetValue('input[data-testid="confirm-password"]', user.user_password);
    await browser.scrollAndClick('button=Update password');

    const alert = await $('[data-testid="alert-message"]');
    await alert.waitForDisplayed();
    const alertText = await alert.getText();
    expect(alertText).toContain('The new password should be different from the current password');

    await deleteUserViaApi(randomNumber);
    await browser.deleteJsonFile(randomNumber);
  });

  it("logout user via api and web", async () => {
    const randomNumber = faker.string.numeric(8);

    await createUserViaApi(randomNumber);
    await browser.logInUserViaWeb(randomNumber);

    await browser.scrollAndClick('button=Logout');

    const loginLink = await $('a[href="/notes/app/login"]');
    await loginLink.waitForDisplayed();
    const loginText = await loginLink.getText();
    expect(loginText).toContain('Login');

    await logInUserViaApi(randomNumber);
    await deleteUserViaApi(randomNumber);
    await browser.deleteJsonFile(randomNumber);
  });

  it('delete user via api and web', async () => {
    const randomNumber = faker.string.numeric(8);

    await createUserViaApi(randomNumber);
    await browser.logInUserViaWeb(randomNumber);

    await browser.url(`${baseAppUrl}/profile`);
    await browser.action('wheel').scroll({ deltaY: 99999 }).perform();
    await browser.scrollAndClick('button=Delete Account');
    await browser.scrollAndClick('[data-testid="note-delete-confirm"]');
    await $('[data-testid="alert-message"]').waitForDisplayed();
    await browser.deleteJsonFile(randomNumber);
  });


});
