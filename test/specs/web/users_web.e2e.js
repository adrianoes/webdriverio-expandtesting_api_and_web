// test/specs/web/users_web.e2e.js
import { faker } from '@faker-js/faker';
import fs from 'fs/promises';
import path from 'path';
import '../../support/commands.js';


describe('/users_web', () => {
  const baseAppUrl = process.env.BASE_APP_URL;

  it('Cria, loga e deleta um usuário via WEB', async () => {
    const randomNumber = faker.string.numeric(8);
    const user = {
      name: faker.person.fullName(),
      email: faker.internet.exampleEmail().toLowerCase(),
      password: faker.internet.password({ length: 8 })
    };

    await browser.url(`${baseAppUrl}/register`);

    await expect(browser).toHaveTitle('Notes React Application for Automation Testing Practice');
    await $('.badge').waitForDisplayed();

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

    // Comandos personalizados
    await browser.logInUserViaWeb(randomNumber);
    await browser.deleteUserViaWeb();
    await browser.deleteJsonFile(randomNumber);
  });
});
