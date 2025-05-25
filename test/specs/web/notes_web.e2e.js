import { faker } from '@faker-js/faker';
import fs from 'fs/promises';
import path from 'path';
import '../../support/commands.js';

describe('/notes_web', () => {
  const baseAppUrl = process.env.BASE_APP_URL;

  it('create note via web', async () => {
    const randomNumber = faker.string.numeric(8);

    await browser.createUserViaWeb(randomNumber);
    await browser.logInUserViaWeb(randomNumber);

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

    const titleEl = await $(`[data-testid="note-card-title"]*=${note.title}`);
    await titleEl.waitForDisplayed();
    const descEl = await $(`[data-testid="note-card-description"]*=${note.description}`);
    await descEl.waitForDisplayed();

    const toggleEl = await $('[data-testid="toggle-note-switch"]');
    expect(await toggleEl.isSelected()).toBe(false);

    await browser.scrollAndClick('[data-testid="note-view"]');
    await browser.toHaveTextContaining('[data-testid="note-card-title"]', note.title);
    await browser.toHaveTextContaining('[data-testid="note-card-description"]', note.description);

    expect(await $('[data-testid="toggle-note-switch"]').isSelected()).toBe(false);

    const currentUrl = await browser.getUrl();
    const urlParts = currentUrl.split('/');
    const noteId = urlParts[4];

    await fs.writeFile(filePath, JSON.stringify({
        ...user,
        note_id: noteId,
        note_title: note.title,
        note_description: note.description,
        note_category: note.category,
        note_completed: note.completed
    }));

    // await browser.deleteNoteViaWeb(randomNumber);
    await browser.deleteUserViaWeb();
    await browser.deleteJsonFile(randomNumber);
  });

  it('update note via web', async () => {
    const randomNumber = faker.string.numeric(8);

    await browser.createUserViaWeb(randomNumber);
    await browser.logInUserViaWeb(randomNumber);
    await browser.createNoteViaWeb(randomNumber, baseAppUrl);
    const filePath = path.resolve(`test/fixtures/testdata-${randomNumber}.json`);
    const noteData = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    await browser.refresh();

    await browser.scrollAndClick('button=Edit');

    const note = {
        title: faker.word.words(3),
        description: faker.word.words(5),
        category: faker.helpers.arrayElement(['Home', 'Work', 'Personal']),
        completed: faker.number.int({ min: 1, max: 2 }),
    };

    await browser.scrollAndSelect('select[name="category"]', note.category);
    await browser.scrollAndClick('[data-testid="note-completed"]');

    await browser.scrollAndSetValue('input[name="title"]', note.title);
    await browser.scrollAndSetValue('textarea[name="description"]', note.description);

    await browser.scrollAndClick('button=Save');

    const titleEl = await $(`[data-testid="note-card-title"]*=${note.title}`);
    await titleEl.waitForDisplayed();
    const descEl = await $(`[data-testid="note-card-description"]*=${note.description}`);
    await descEl.waitForDisplayed();

    await fs.writeFile(filePath, JSON.stringify({
        ...noteData,
        note_title: note.title,
        note_description: note.description,
        note_category: note.category,
        note_completed: note.completed,
    }));

    await browser.deleteUserViaWeb();
    await browser.deleteJsonFile(randomNumber);
  });

  it('update note status via web', async () => {
    const randomNumber = faker.string.numeric(8);

    await browser.createUserViaWeb(randomNumber);
    await browser.logInUserViaWeb(randomNumber);
    await browser.createNoteViaWeb(randomNumber, baseAppUrl);

    await browser.refresh();

    await browser.scrollAndClick('button=Edit');

    await browser.scrollAndClick('[data-testid="note-completed"]');

    await browser.scrollAndClick('button=Save');

    const toggleEl = await $('[data-testid="toggle-note-switch"]');
    await browser.waitUntil(async () => await toggleEl.isSelected() === true, {
    timeout: 5000,
    timeoutMsg: 'Expected toggle-note-switch to be selected after update',
    });

    await browser.deleteUserViaWeb();
    await browser.deleteJsonFile(randomNumber);
  });





});