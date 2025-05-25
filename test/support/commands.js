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

browser.addCommand('deleteNoteViaWeb', async function (randomNumber) {
  await browser.scrollAndClick('button=Delete');

  const filePath = path.resolve(`test/fixtures/testdata-${randomNumber}.json`);
  const note = JSON.parse(await fs.readFile(filePath, 'utf-8'));

  const modal = await $('.modal-content');
  const noteElement = await modal.$(`*=${note.note_title}`);
  await noteElement.waitForClickable();
  await noteElement.click();

  const confirmButton = await $('[data-testid="note-delete-confirm"]');
  await confirmButton.waitForClickable();
  await confirmButton.click();
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
    completed: 2,
  };

  await this.url(baseAppUrl);

  await this.scrollAndClick('button=+ Add Note');
  await this.scrollAndSelect('select[name="category"]', note.category);

  await this.scrollAndSetValue('input[name="title"]', note.title);
  await this.scrollAndSetValue('textarea[name="description"]', note.description);
  await this.scrollAndClick('button=Create');

  const titleEl = await $(`[data-testid="note-card-title"]*=${note.title}`);
  await titleEl.waitForDisplayed();
  const descEl = await $(`[data-testid="note-card-description"]*=${note.description}`);
  await descEl.waitForDisplayed();

  const toggleEl = await $('[data-testid="toggle-note-switch"]');
  if (await toggleEl.isSelected()) {
    throw new Error('Expected toggle note switch to be unselected (false)');
  }

  await this.scrollAndClick('[data-testid="note-view"]');
  await this.toHaveTextContaining('[data-testid="note-card-title"]', note.title);
  await this.toHaveTextContaining('[data-testid="note-card-description"]', note.description);

  if (await $('[data-testid="toggle-note-switch"]').isSelected()) {
    throw new Error('Expected toggle note switch to be unselected (false)');
  }

  const currentUrl = await this.getUrl();
  const urlParts = currentUrl.split('/');
  const noteId = urlParts[4];

  await fs.writeFile(filePath, JSON.stringify({
    ...user,
    note_id: noteId,
    note_title: note.title,
    note_description: note.description,
    note_category: note.category,
    note_completed: note.completed,
  }));
  
});
