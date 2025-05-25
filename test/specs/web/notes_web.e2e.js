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

  it.only('get all notes via web', async () => {
    const randomNumber = faker.string.numeric(8);

    await browser.createUserViaWeb(randomNumber);
    await browser.logInUserViaWeb(randomNumber);

    const filePath = path.resolve(`test/fixtures/testdata-${randomNumber}.json`);
    const userData = JSON.parse(await fs.readFile(filePath, 'utf-8'));

    // Arrays para armazenar dados das notas
    const arrayTitle = [
      faker.word.words(3),
      faker.word.words(3),
      faker.word.words(3),
      faker.word.words(3)
    ];
    const arrayDescription = [
      faker.word.words(5),
      faker.word.words(5),
      faker.word.words(5),
      faker.word.words(5)
    ];
    const arrayCategory = [
      faker.helpers.arrayElement(['Home', 'Work', 'Personal']),
      'Home',
      'Work',
      'Personal'
    ];

    // Criar 4 notas em sequência
    for (let k = 0; k < 4; k++) {
      await browser.url(baseAppUrl);
      await browser.scrollAndClick('button=+ Add Note');
      await browser.scrollAndSetValue('input[name="title"]', arrayTitle[k]);
      await browser.scrollAndSetValue('textarea[name="description"]', arrayDescription[k]);
      await browser.scrollAndSelect('select[name="category"]', arrayCategory[k]);
      await browser.scrollAndClick('button=Create');
      // Espera a nota aparecer para garantir criação
      const titleEl = await $(`[data-testid="note-card-title"]*=${arrayTitle[k]}`);
      await titleEl.waitForDisplayed();
    }

    // Marcar a última nota (4ª) como concluída
    const lastNoteToggleSelector = ':nth-child(5) > [data-testid="note-card"] > .card-footer > [data-testid="toggle-note-switch"]';
    await browser.scrollAndClick(lastNoteToggleSelector);

    // Índices dos elementos no DOM para validação (ajustar conforme estrutura real)
    const arrayIndex = [2, 3, 4, 5];

    // Estado esperado para cada nota (4ª está marcada)
    const arrayCompleted = [false, false, false, true];

    // Cores esperadas (copiar os valores CSS do projeto)
    const arrayColor = ['rgba(50,140,160,1)', 'rgba(92,107,192,1)', 'rgba(255,145,0,1)', 'rgba(40,46,41,0.6)'];

    // Validar cada nota (reverso, como no Cypress original)
    for (let k = 0; k < 4; k++) {
      const index = arrayIndex[k];
      const reverseIndex = 3 - k;

      const titleSelector = `:nth-child(${index}) > [data-testid="note-card"] > [data-testid="note-card-title"]`;
      const descSelector = `:nth-child(${index}) > [data-testid="note-card"] > .card-body > [data-testid="note-card-description"]`;
      const toggleSelector = `:nth-child(${index}) > [data-testid="note-card"] > .card-footer > [data-testid="toggle-note-switch"]`;

      // Valida título e descrição visíveis
      const titleEl = await $(titleSelector);
      await titleEl.waitForDisplayed();
      expect(await titleEl.getText()).toEqual(arrayTitle[reverseIndex]);

      const descEl = await $(descSelector);
      await descEl.waitForDisplayed();
      expect(await descEl.getText()).toContain(arrayDescription[reverseIndex]);

      // Validar toggle selecionado (checked) ou não
      const toggleEl = await $(toggleSelector);
      expect(await toggleEl.isSelected()).toBe(arrayCompleted[k]);

      // Validar cor do título
      expect(await titleEl.getCSSProperty('background-color')).toHaveProperty('value', arrayColor[k]);
    }

    // Validar texto de progresso
    const progressInfo = await $('[data-testid="progress-info"]');
    await progressInfo.waitForDisplayed();
    expect(await progressInfo.getText()).toContain('You have 1/4 notes completed in the all categories');

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