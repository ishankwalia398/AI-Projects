import { test, expect, Browser, Page } from '@playwright/test';
import { chromium } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { TestData } from '../utils/TestData';
import { logger } from '../utils/Logger';

/**
 * Invalid Login Test Suite
 * Tests invalid login scenarios for Salesforce
 */

let browser: Browser;
let page: Page;
let loginPage: LoginPage;

// Before Suite - Browser Setup
async function beforeSuite(): Promise<void> {
    try {
        logger.info('========== TEST SUITE STARTED: INVALID LOGIN TESTS ==========');
        browser = await chromium.launch({ headless: false });
        logger.info('Browser launched successfully');
    } catch (error) {
        logger.error(`Failed to launch browser: ${error}`);
        throw new Error('Browser launch failed');
    }
}

// After Suite - Browser Cleanup
async function afterSuite(): Promise<void> {
    try {
        if (browser) {
            await browser.close();
            logger.info('Browser closed successfully');
        }
        logger.info('========== TEST SUITE COMPLETED: INVALID LOGIN TESTS ==========');
    } catch (error) {
        logger.error(`Error closing browser: ${error}`);
    }
}

// Before Test - Navigate to Login Page
async function beforeTest(): Promise<void> {
    try {
        page = await browser.newPage();
        logger.info('New browser page created');
        loginPage = new LoginPage(page);
        await loginPage.navigateToLoginPage();
        logger.info('Login page loaded successfully');
    } catch (error) {
        logger.error(`Failed in beforeTest setup: ${error}`);
        throw new Error('Test setup failed');
    }
}

// After Test - Cleanup
async function afterTest(): Promise<void> {
    try {
        if (page) {
            // Clear cookies and storage
            await page.context().clearCookies();
            await page.close();
            logger.info('Browser page closed and cookies cleared');
        }
    } catch (error) {
        logger.error(`Error in afterTest cleanup: ${error}`);
    }
}

// Test 1: Invalid Email and Invalid Password
test('Test 1: Invalid Email and Invalid Password', async () => {
    try {
        await beforeTest();
        logger.info('TEST: Invalid Email and Invalid Password');

        const testData = TestData.INVALID_CREDENTIALS[0];
        logger.info(`Test Data: ${testData.description}`);

        // Verify login page loaded
        const isLoginPageLoaded = await loginPage.verifyLoginPageLoaded();
        expect(isLoginPageLoaded).toBe(true);

        // Perform login with invalid credentials
        await loginPage.performLogin(testData.email, testData.password);

        // Verify error message is displayed
        const isErrorDisplayed = await loginPage.verifyErrorMessageDisplayed();
        expect(isErrorDisplayed).toBe(true);
        logger.pass('Invalid Email and Password Test');

        await afterTest();
    } catch (error) {
        logger.fail('Invalid Email and Password Test', error as string);
        await afterTest();
        throw error;
    }
});

// Test 2: Valid Email with Invalid Password
test('Test 2: Valid Email with Invalid Password', async () => {
    try {
        await beforeTest();
        logger.info('TEST: Valid Email with Invalid Password');

        const testData = TestData.INVALID_CREDENTIALS[1];
        logger.info(`Test Data: ${testData.description}`);

        // Verify login page loaded
        const isLoginPageLoaded = await loginPage.verifyLoginPageLoaded();
        expect(isLoginPageLoaded).toBe(true);

        // Perform login
        await loginPage.performLogin(testData.email, testData.password);

        // Verify error message
        const isErrorDisplayed = await loginPage.verifyErrorMessageDisplayed();
        expect(isErrorDisplayed).toBe(true);
        logger.info('Error message displayed for invalid password');

        const errorMessage = await loginPage.getErrorMessage();
        expect(errorMessage).toBeTruthy();
        logger.pass('Valid Email with Invalid Password Test');

        await afterTest();
    } catch (error) {
        logger.fail('Valid Email with Invalid Password Test', error as string);
        await afterTest();
        throw error;
    }
});

// Test 3: Invalid Email with Valid Password
test('Test 3: Invalid Email with Valid Password', async () => {
    try {
        await beforeTest();
        logger.info('TEST: Invalid Email with Valid Password');

        const testData = TestData.INVALID_CREDENTIALS[2];
        logger.info(`Test Data: ${testData.description}`);

        // Verify login page loaded
        const isLoginPageLoaded = await loginPage.verifyLoginPageLoaded();
        expect(isLoginPageLoaded).toBe(true);

        // Perform login
        await loginPage.performLogin(testData.email, testData.password);

        // Verify error message
        const isErrorDisplayed = await loginPage.verifyErrorMessageDisplayed();
        expect(isErrorDisplayed).toBe(true);
        logger.pass('Invalid Email with Valid Password Test');

        await afterTest();
    } catch (error) {
        logger.fail('Invalid Email with Valid Password Test', error as string);
        await afterTest();
        throw error;
    }
});

// Test 4: Empty Email with Valid Password
test('Test 4: Empty Email with Valid Password', async () => {
    try {
        await beforeTest();
        logger.info('TEST: Empty Email with Valid Password');

        const testData = TestData.INVALID_CREDENTIALS[3];
        logger.info(`Test Data: ${testData.description}`);

        // Verify login page loaded
        const isLoginPageLoaded = await loginPage.verifyLoginPageLoaded();
        expect(isLoginPageLoaded).toBe(true);

        // Perform login with empty email
        await loginPage.enterEmail(testData.email);
        await loginPage.enterPassword(testData.password);
        await loginPage.clickSignInButton();

        // Verify error or validation message
        const isErrorDisplayed = await loginPage.verifyErrorMessageDisplayed();
        if (isErrorDisplayed) {
            const errorMessage = await loginPage.getErrorMessage();
            expect(errorMessage).toBeTruthy();
            logger.info(`Error message: ${errorMessage}`);
        }
        logger.pass('Empty Email with Valid Password Test');

        await afterTest();
    } catch (error) {
        logger.fail('Empty Email with Valid Password Test', error as string);
        await afterTest();
        throw error;
    }
});

// Test 5: Valid Email with Empty Password
test('Test 5: Valid Email with Empty Password', async () => {
    try {
        await beforeTest();
        logger.info('TEST: Valid Email with Empty Password');

        const testData = TestData.INVALID_CREDENTIALS[4];
        logger.info(`Test Data: ${testData.description}`);

        // Verify login page loaded
        const isLoginPageLoaded = await loginPage.verifyLoginPageLoaded();
        expect(isLoginPageLoaded).toBe(true);

        // Perform login with empty password
        await loginPage.enterEmail(testData.email);
        await loginPage.enterPassword(testData.password);
        await loginPage.clickSignInButton();

        // Verify error or validation message
        const isErrorDisplayed = await loginPage.verifyErrorMessageDisplayed();
        if (isErrorDisplayed) {
            const errorMessage = await loginPage.getErrorMessage();
            expect(errorMessage).toBeTruthy();
            logger.info(`Error message: ${errorMessage}`);
        }
        logger.pass('Valid Email with Empty Password Test');

        await afterTest();
    } catch (error) {
        logger.fail('Valid Email with Empty Password Test', error as string);
        await afterTest();
        throw error;
    }
});

// Test 6: Invalid Email Format with Invalid Password
test('Test 6: Invalid Email Format with Invalid Password', async () => {
    try {
        await beforeTest();
        logger.info('TEST: Invalid Email Format with Invalid Password');

        const testData = TestData.INVALID_CREDENTIALS[5];
        logger.info(`Test Data: ${testData.description}`);

        // Verify login page loaded
        const isLoginPageLoaded = await loginPage.verifyLoginPageLoaded();
        expect(isLoginPageLoaded).toBe(true);

        // Perform login
        await loginPage.performLogin(testData.email, testData.password);

        // Verify error message
        const isErrorDisplayed = await loginPage.verifyErrorMessageDisplayed();
        expect(isErrorDisplayed).toBe(true);
        logger.pass('Invalid Email Format with Invalid Password Test');

        await afterTest();
    } catch (error) {
        logger.fail('Invalid Email Format with Invalid Password Test', error as string);
        await afterTest();
        throw error;
    }
});

// Test 7: Special Characters in Email
test('Test 7: Special Characters in Email Address', async () => {
    try {
        await beforeTest();
        logger.info('TEST: Special Characters in Email Address');

        const testData = TestData.INVALID_CREDENTIALS[6];
        logger.info(`Test Data: ${testData.description}`);

        // Verify login page loaded
        const isLoginPageLoaded = await loginPage.verifyLoginPageLoaded();
        expect(isLoginPageLoaded).toBe(true);

        // Perform login
        await loginPage.performLogin(testData.email, testData.password);

        // Verify error message
        const isErrorDisplayed = await loginPage.verifyErrorMessageDisplayed();
        expect(isErrorDisplayed).toBe(true);
        logger.info('Error displayed for special characters in email');
        logger.pass('Special Characters in Email Test');

        await afterTest();
    } catch (error) {
        logger.fail('Special Characters in Email Test', error as string);
        await afterTest();
        throw error;
    }
});

// Test 8: Login Page Elements Remain Visible After Failed Attempt
test('Test 8: Login Page Elements Remain Visible After Failed Login', async () => {
    try {
        await beforeTest();
        logger.info('TEST: Login Page Elements After Failed Attempt');

        // Perform invalid login
        await loginPage.performLogin(
            TestData.INVALID_EMAIL,
            TestData.INVALID_PASSWORD
        );

        // Verify login page elements are still visible
        const isEmailFieldVisible = await loginPage.verifyLoginPageLoaded();
        expect(isEmailFieldVisible).toBe(true);
        logger.info('Login page elements remain visible after failed attempt');

        // Verify error message is displayed
        const isErrorDisplayed = await loginPage.verifyErrorMessageDisplayed();
        expect(isErrorDisplayed).toBe(true);

        logger.pass('Login Page Elements After Failed Attempt Test');

        await afterTest();
    } catch (error) {
        logger.fail('Login Page Elements After Failed Attempt Test', error as string);
        await afterTest();
        throw error;
    }
});

// Run all tests
beforeSuite().catch((error) => {
    logger.error(`Suite setup failed: ${error}`);
    process.exit(1);
});

test.afterAll(async () => {
    await afterSuite();
});
