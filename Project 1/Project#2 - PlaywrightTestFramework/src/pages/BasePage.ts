import { Page, Locator, expect } from '@playwright/test';
import { logger } from '../utils/Logger';
import { TestData } from '../utils/TestData';

export class BasePage {
    protected page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    protected async navigateTo(url: string): Promise<void> {
        try {
            logger.info(`Navigating to URL: ${url}`);
            await this.page.goto(url, { waitUntil: 'networkidle' });
            logger.info(`Successfully navigated to ${url}`);
        } catch (error) {
            logger.error(`Failed to navigate to ${url}: ${error}`);
            throw new Error(`Navigation failed to ${url}`);
        }
    }

    protected async fillInput(locator: Locator, text: string, fieldName: string): Promise<void> {
        try {
            logger.info(`Filling field: ${fieldName} with value`);
            await locator.waitFor({ state: 'visible', timeout: TestData.TIMEOUT_MEDIUM });
            await locator.clear();
            await locator.fill(text);
            logger.info(`Successfully filled ${fieldName}`);
        } catch (error) {
            logger.error(`Failed to fill ${fieldName}: ${error}`);
            throw new Error(`Unable to fill field: ${fieldName}`);
        }
    }

    protected async clickElement(locator: Locator, elementName: string): Promise<void> {
        try {
            logger.info(`Clicking element: ${elementName}`);
            await locator.waitFor({ state: 'visible', timeout: TestData.TIMEOUT_MEDIUM });
            await locator.click();
            logger.info(`Successfully clicked ${elementName}`);
        } catch (error) {
            logger.error(`Failed to click ${elementName}: ${error}`);
            throw new Error(`Unable to click element: ${elementName}`);
        }
    }

    protected async isElementVisible(locator: Locator, elementName: string): Promise<boolean> {
        try {
            logger.info(`Verifying visibility of element: ${elementName}`);
            await locator.waitFor({ state: 'visible', timeout: TestData.TIMEOUT_SHORT });
            logger.info(`${elementName} is visible`);
            return true;
        } catch (error) {
            logger.warn(`${elementName} is not visible: ${error}`);
            return false;
        }
    }

    protected async isElementPresent(locator: Locator, elementName: string): Promise<boolean> {
        try {
            logger.info(`Checking presence of element: ${elementName}`);
            const count = await locator.count();
            const isPresent = count > 0;
            logger.info(`${elementName} presence: ${isPresent}`);
            return isPresent;
        } catch (error) {
            logger.error(`Error checking presence of ${elementName}: ${error}`);
            return false;
        }
    }

    protected async getText(locator: Locator, elementName: string): Promise<string> {
        try {
            logger.info(`Getting text from element: ${elementName}`);
            await locator.waitFor({ state: 'visible', timeout: TestData.TIMEOUT_MEDIUM });
            const text = await locator.textContent();
            logger.info(`Text retrieved from ${elementName}: ${text}`);
            return text || '';
        } catch (error) {
            logger.error(`Failed to get text from ${elementName}: ${error}`);
            throw new Error(`Unable to get text from: ${elementName}`);
        }
    }

    protected async verifyElementText(
        locator: Locator,
        expectedText: string,
        elementName: string
    ): Promise<void> {
        try {
            logger.info(`Verifying text in ${elementName}. Expected: ${expectedText}`);
            await expect(locator).toContainText(expectedText);
            logger.pass(`Text verification passed for ${elementName}`);
        } catch (error) {
            logger.fail(`Text verification for ${elementName}`, `Expected: ${expectedText}`);
            throw new Error(`Text verification failed for ${elementName}`);
        }
    }

    protected async waitForPageLoad(timeout: number = TestData.TIMEOUT_LONG): Promise<void> {
        try {
            logger.info(`Waiting for page to load...`);
            await this.page.waitForLoadState('networkidle', { timeout });
            logger.info(`Page loaded successfully`);
        } catch (error) {
            logger.warn(`Page load timeout or error: ${error}`);
        }
    }

    protected async takeScreenshot(fileName: string): Promise<void> {
        try {
            const screenshotPath = `./screenshots/${fileName}.png`;
            await this.page.screenshot({ path: screenshotPath });
            logger.info(`Screenshot saved: ${screenshotPath}`);
        } catch (error) {
            logger.error(`Failed to take screenshot: ${error}`);
        }
    }

    protected async switchToFrame(frameLocator: Locator): Promise<Page> {
        try {
            logger.info(`Switching to frame`);
            const frame = await frameLocator.contentFrame();
            if (!frame) {
                throw new Error('Frame not found');
            }
            logger.info(`Successfully switched to frame`);
            return frame;
        } catch (error) {
            logger.error(`Failed to switch to frame: ${error}`);
            throw new Error(`Unable to switch to frame`);
        }
    }

    protected async acceptAlert(): Promise<void> {
        try {
            this.page.once('dialog', (dialog) => {
                logger.info(`Alert accepted: ${dialog.message()}`);
                dialog.accept();
            });
        } catch (error) {
            logger.error(`Failed to accept alert: ${error}`);
        }
    }

    protected async dismissAlert(): Promise<void> {
        try {
            this.page.once('dialog', (dialog) => {
                logger.info(`Alert dismissed: ${dialog.message()}`);
                dialog.dismiss();
            });
        } catch (error) {
            logger.error(`Failed to dismiss alert: ${error}`);
        }
    }

    protected getLocator(selector: string): Locator {
        return this.page.locator(selector);
    }

    protected async delay(milliseconds: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, milliseconds));
    }
}
