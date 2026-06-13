import { test, expect, Browser, Page } from '@playwright/test';
import { chromium } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { TestData } from '../utils/TestData';
import { logger } from '../utils/Logger';

/**
 * Valid Login Test Suite
 * Tests valid login scenarios for Salesforce
 */

let browser: Browser;
let page: Page;
let loginPage: LoginPage;
let dashboardPage: DashboardPage;

// Before Suite - Browser Setup
async function beforeSuite(): Promise<void> {
    try {
        logger.info('========== TEST SUITE STARTED: VALID LOGIN TESTS ==========');
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
        logger.info('========== TEST SUITE COMPLETED: VALID LOGIN TESTS ==========');
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
        dashboardPage = new DashboardPage(page);
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
            await page.close();
            logger.info('Browser page closed');
        }
    } catch (error) {
        logger.error(`Error in afterTest cleanup: ${error}`);
    }
}

// Test 1: Valid Login
test('Test 1: Valid Login with Correct Credentials', async () => {
    try {
        await beforeTest();
        logger.info('TEST: Valid Login with Correct Credentials');

        // Verify login page loaded
        const isLoginPageLoaded = await loginPage.verifyLoginPageLoaded();
        expect(isLoginPageLoaded).toBe(true);
        logger.info('Login page verified');

        // Perform login
        await loginPage.performLogin(TestData.VALID_EMAIL, TestData.VALID_PASSWORD);
        logger.info('Login action completed');

        // Wait for dashboard to load
        await loginPage.waitForPageLoad(TestData.TIMEOUT_LONG);

        // Verify dashboard loaded
        const isDashboardLoaded = await dashboardPage.verifyDashboardLoaded();
        expect(isDashboardLoaded).toBe(true);
        logger.pass('Valid Login Test');

        await afterTest();
    } catch (error) {
        logger.fail('Valid Login Test', error as string);
        await afterTest();
        throw error;
    }
});

// Test 2: Valid Login with Remember Me
test('Test 2: Valid Login with Remember Me Functionality', async () => {
    try {
        await beforeTest();
        logger.info('TEST: Valid Login with Remember Me');

        // Verify login page loaded
        const isLoginPageLoaded = await loginPage.verifyLoginPageLoaded();
        expect(isLoginPageLoaded).toBe(true);
        logger.info('Login page verified');

        // Perform login with Remember Me
        await loginPage.performLoginWithRememberMe(
            TestData.VALID_EMAIL,
            TestData.VALID_PASSWORD
        );
        logger.info('Login with Remember Me completed');

        // Wait for dashboard to load
        await loginPage.waitForPageLoad(TestData.TIMEOUT_LONG);

        // Verify dashboard loaded
        const isDashboardLoaded = await dashboardPage.verifyDashboardLoaded();
        expect(isDashboardLoaded).toBe(true);
        logger.info('Dashboard loaded after Remember Me login');

        // Verify user is logged in
        const isUserLoggedIn = await dashboardPage.verifyUserLoggedIn();
        expect(isUserLoggedIn).toBe(true);
        logger.pass('Valid Login with Remember Me Test');

        await afterTest();
    } catch (error) {
        logger.fail('Valid Login with Remember Me Test', error as string);
        await afterTest();
        throw error;
    }
});

// Test 3: Dashboard Elements Verification
test('Test 3: Verify Dashboard Elements After Successful Login', async () => {
    try {
        await beforeTest();
        logger.info('TEST: Dashboard Elements Verification');

        // Perform login
        await loginPage.performLogin(TestData.VALID_EMAIL, TestData.VALID_PASSWORD);
        logger.info('Login action completed');

        // Wait for dashboard
        await loginPage.waitForPageLoad(TestData.TIMEOUT_LONG);

        // Verify all dashboard elements
        const isDashboardLoaded = await dashboardPage.verifyDashboardLoaded();
        expect(isDashboardLoaded).toBe(true);
        logger.info('Dashboard loaded');

        const isUserLoggedIn = await dashboardPage.verifyUserLoggedIn();
        expect(isUserLoggedIn).toBe(true);
        logger.info('User verified as logged in');

        const hasTabsSection = await dashboardPage.verifyTabsSectionPresent();
        expect(hasTabsSection).toBe(true);
        logger.info('Tabs section present');

        const hasRecentItems = await dashboardPage.verifyRecentItemsPresent();
        expect(hasRecentItems).toBe(true);
        logger.info('Recent items section present');

        // Take screenshot
        await dashboardPage.takeDashboardScreenshot();

        logger.pass('Dashboard Elements Verification Test');

        await afterTest();
    } catch (error) {
        logger.fail('Dashboard Elements Verification Test', error as string);
        await afterTest();
        throw error;
    }
});

// Test 4: User Display Name Verification
test('Test 4: Verify User Display Name After Login', async () => {
    try {
        await beforeTest();
        logger.info('TEST: User Display Name Verification');

        // Perform login
        await loginPage.performLogin(TestData.VALID_EMAIL, TestData.VALID_PASSWORD);
        logger.info('Login action completed');

        // Wait for dashboard
        await loginPage.waitForPageLoad(TestData.TIMEOUT_LONG);

        // Get user display name
        const userName = await dashboardPage.getUserDisplayName();
        expect(userName).toBeTruthy();
        logger.info(`User name retrieved: ${userName}`);

        // Verify page title
        const isTitleCorrect = await dashboardPage.verifyPageTitle();
        expect(isTitleCorrect).toBe(true);
        logger.info('Page title verified');

        logger.pass('User Display Name Verification Test');

        await afterTest();
    } catch (error) {
        logger.fail('User Display Name Verification Test', error as string);
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
