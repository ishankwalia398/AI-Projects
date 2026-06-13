import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { logger } from '../utils/Logger';
import { TestData } from '../utils/TestData';

export class DashboardPage extends BasePage {
    // XPath Locators for Dashboard Elements
    private dashboardHeaderXPath: string = "//h1[contains(text(), 'Home')]";
    private userMenuXPath: string = "//div[@id='userNav']";
    private userNameDisplayXPath: string = "//span[@id='userFullName']";
    private logoutLinkXPath: string = "//a[@onclick='return logout()']";
    private welcomeMessageXPath: string = "//div[@class='welcomeText']";
    private tabsXPath: string = "//div[@id='tabs']";
    private recentItemsXPath: string = "//div[@id='recentItems']";

    constructor(page: Page) {
        super(page);
    }

    // Element Getters
    private getDashboardHeader(): Locator {
        return this.getLocator(this.dashboardHeaderXPath);
    }

    private getUserMenu(): Locator {
        return this.getLocator(this.userMenuXPath);
    }

    private getUserNameDisplay(): Locator {
        return this.getLocator(this.userNameDisplayXPath);
    }

    private getLogoutLink(): Locator {
        return this.getLocator(this.logoutLinkXPath);
    }

    private getWelcomeMessage(): Locator {
        return this.getLocator(this.welcomeMessageXPath);
    }

    private getTabsSection(): Locator {
        return this.getLocator(this.tabsXPath);
    }

    private getRecentItems(): Locator {
        return this.getLocator(this.recentItemsXPath);
    }

    // Verification Methods
    public async verifyDashboardLoaded(): Promise<boolean> {
        try {
            logger.info('Verifying dashboard page is loaded');
            const isDashboardHeaderVisible = await this.isElementVisible(
                this.getDashboardHeader(),
                'Dashboard Header'
            );
            const isUserMenuVisible = await this.isElementVisible(
                this.getUserMenu(),
                'User Menu'
            );

            if (isDashboardHeaderVisible && isUserMenuVisible) {
                logger.pass('Dashboard verification');
                return true;
            } else {
                logger.fail('Dashboard verification', 'Dashboard elements not visible');
                return false;
            }
        } catch (error) {
            logger.error(`Error verifying dashboard: ${error}`);
            return false;
        }
    }

    public async verifyUserLoggedIn(): Promise<boolean> {
        try {
            logger.info('Verifying user is logged in');
            const isUserMenuPresent = await this.isElementPresent(
                this.getUserMenu(),
                'User Menu'
            );

            if (isUserMenuPresent) {
                logger.info('User is logged in successfully');
                return true;
            } else {
                logger.info('User menu not found - login may have failed');
                return false;
            }
        } catch (error) {
            logger.error(`Error verifying user login: ${error}`);
            return false;
        }
    }

    public async getUserDisplayName(): Promise<string> {
        try {
            logger.info('Retrieving user display name');
            const userName = await this.getText(
                this.getUserNameDisplay(),
                'User Name Display'
            );
            logger.info(`User name retrieved: ${userName}`);
            return userName;
        } catch (error) {
            logger.error(`Failed to get user name: ${error}`);
            return '';
        }
    }

    public async verifyWelcomeMessageDisplayed(): Promise<boolean> {
        try {
            logger.info('Checking if welcome message is displayed');
            const isVisible = await this.isElementVisible(
                this.getWelcomeMessage(),
                'Welcome Message'
            );

            if (isVisible) {
                const welcomeText = await this.getText(
                    this.getWelcomeMessage(),
                    'Welcome Message'
                );
                logger.info(`Welcome message: ${welcomeText}`);
            }

            return isVisible;
        } catch (error) {
            logger.error(`Error checking welcome message: ${error}`);
            return false;
        }
    }

    public async verifyTabsSectionPresent(): Promise<boolean> {
        try {
            logger.info('Verifying tabs section is present');
            const isPresent = await this.isElementPresent(
                this.getTabsSection(),
                'Tabs Section'
            );
            logger.info(`Tabs section present: ${isPresent}`);
            return isPresent;
        } catch (error) {
            logger.error(`Error verifying tabs section: ${error}`);
            return false;
        }
    }

    public async verifyRecentItemsPresent(): Promise<boolean> {
        try {
            logger.info('Verifying recent items section is present');
            const isPresent = await this.isElementPresent(
                this.getRecentItems(),
                'Recent Items'
            );
            logger.info(`Recent items present: ${isPresent}`);
            return isPresent;
        } catch (error) {
            logger.error(`Error verifying recent items: ${error}`);
            return false;
        }
    }

    // Action Methods
    public async clickUserMenu(): Promise<void> {
        try {
            logger.info('Clicking user menu');
            await this.clickElement(this.getUserMenu(), 'User Menu');
        } catch (error) {
            logger.error(`Failed to click user menu: ${error}`);
            throw new Error('Unable to click user menu');
        }
    }

    public async logout(): Promise<void> {
        try {
            logger.info('Logging out from dashboard');
            await this.clickUserMenu();
            await this.delay(500);
            await this.clickElement(this.getLogoutLink(), 'Logout Link');
            await this.waitForPageLoad(TestData.TIMEOUT_MEDIUM);
            logger.pass('Logout completed');
        } catch (error) {
            logger.error(`Failed to logout: ${error}`);
            throw new Error('Unable to logout');
        }
    }

    public async verifyPageTitle(): Promise<boolean> {
        try {
            logger.info('Verifying dashboard page title');
            const title = this.page.title();
            const titleStr = await title;
            logger.info(`Page title: ${titleStr}`);
            return titleStr.includes('Salesforce') || titleStr.includes('Home');
        } catch (error) {
            logger.error(`Error verifying page title: ${error}`);
            return false;
        }
    }

    public async verifyURL(): Promise<boolean> {
        try {
            logger.info('Verifying dashboard URL');
            const url = this.page.url();
            logger.info(`Current URL: ${url}`);
            return url.includes('home.salesforce.com') || url.includes('lightning');
        } catch (error) {
            logger.error(`Error verifying URL: ${error}`);
            return false;
        }
    }

    public async takeDashboardScreenshot(): Promise<void> {
        try {
            logger.info('Taking dashboard screenshot');
            await this.takeScreenshot('dashboard-screenshot');
        } catch (error) {
            logger.error(`Failed to take dashboard screenshot: ${error}`);
        }
    }
}
