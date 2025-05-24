// test/support/commands.js
import fs from 'fs/promises';
import path from 'path';
import { faker } from '@faker-js/faker';

const baseAppUrl = process.env.BASE_APP_URL;

browser.addCommand('createUserViaWeb', async function (randomNumber) {
    const user = {
      name: faker.person.fullName(),
      email: faker.internet.exampleEmail().toLowerCase(),
      password: faker.internet.password({ length: 8 })
    };

    await browser.url(`${baseAppUrl}/register`);

    await expect(browser).toHaveTitle('Notes React Application for Automation Testing Practice');

    await browser.scrollAndSetValue('input[name="email"]', user.email);
    await browser.scrollAndSetValue('input[name="name"]', user.name);
    await browser.scrollAndSetValue('input[name="password"]', user.password);
    await browser.scrollAndSetValue('input[name="confirmPassword"]', user.password);
    await browser.scrollAndClick('button=Register')

    await expect(browser).toHaveTitle('Notes React Application for Automation Testing Practice');
    await $('b=User account created successfully').waitForDisplayed();

    const userId = await browser.execute(() => window.localStorage.getItem('user_id'));

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




