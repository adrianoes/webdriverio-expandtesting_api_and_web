// test/support/commands.js
import fs from 'fs/promises';
import path from 'path';
import { faker } from '@faker-js/faker';

const baseAppUrl = process.env.BASE_APP_URL;


// Login com scroll adaptado
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

// Exclusão de usuário com scroll adaptado
browser.addCommand('deleteUserViaWeb', async function () {
  await browser.url(`${baseAppUrl}/profile`);
  await browser.action('wheel').scroll({ deltaY: 99999 }).perform();

  await browser.scrollAndClick('button=Delete Account');
  await browser.scrollAndClick('[data-testid="note-delete-confirm"]');
  await $('[data-testid="alert-message"]').waitForDisplayed();
});

// Exclusão de arquivo JSON (sem scroll necessário)
browser.addCommand('deleteJsonFile', async function (randomNumber) {
  const filePath = path.resolve(`test/fixtures/testdata-${randomNumber}.json`);
  try {
    await fs.unlink(filePath);
  } catch (err) {
    console.warn(`⚠️ Arquivo não encontrado para deletar: ${filePath}`);
  }
});


browser.addCommand('scrollAndClick', async function (selector) {
  const el = await $(selector);
  await el.waitForExist({ timeout: 10000 });
  await el.scrollIntoView({ block: 'center', inline: 'center' });
  await el.waitForDisplayed({ timeout: 5000 });
  await el.click();
});

browser.addCommand('scroll', async function (selector) {
  const el = await $(selector);
  await el.waitForExist({ timeout: 10000 });
  await el.scrollIntoView({ block: 'center', inline: 'center' });
  await el.waitForDisplayed({ timeout: 5000 });
});

browser.addCommand('scrollAndSetValue', async function (selector, value) {
  const el = await $(selector);
  await el.waitForExist({ timeout: 10000 });
  await el.scrollIntoView({ block: 'center', inline: 'center' });
  await el.waitForDisplayed({ timeout: 5000 });
  await el.setValue(value);
});

async function pressArrowDown(times) {
  for (let i = 0; i < times; i++) {
    await browser.keys(['ArrowDown']);
    await browser.pause(200); // Pausa para permitir que o scroll ocorra suavemente
  }
}
