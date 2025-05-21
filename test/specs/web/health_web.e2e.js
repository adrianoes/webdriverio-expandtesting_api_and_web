// test/specs/web/health_web.e2e.js
import { browser, $ } from '@wdio/globals';

describe('Health Check - WEB', () => {
    it('Deve verificar o título e mensagem de boas-vindas', async () => {
        const url = process.env.BASE_APP_URL;
        if (!url) {
            throw new Error('⚠️ BASE_APP_URL não está definida no .env');
        }

        await browser.url(url);

        const title = await browser.getTitle();
        expect(title).toBe('Notes React Application for Automation Testing Practice');

        const welcomeMessage = await $('.fw-bold');

        const welcomeText = await welcomeMessage.getText();
        expect(welcomeText).toBe('Welcome to Notes App');

        const isVisible = await welcomeMessage.isDisplayed();
        expect(isVisible).toBe(true);
    });
});
