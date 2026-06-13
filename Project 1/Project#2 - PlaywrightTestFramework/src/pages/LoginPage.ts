import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { logger } from '../utils/Logger';
import { TestData } from '../utils/TestData';

export class LoginPage extends BasePage {
    // XPath Locators
    private emailInputXPath: string = "//input[@id='username']";
    private passwordInputXPath: string = "//input[@id='password']";
    private signInButtonXPath: string = "//input[@id='Login']";
    private rememberMeCheckboxXPath: string = "//input[@id='rememberUn']";
    private loginPageHeadingXPath: string = "//h1[contains(text(), 'Login')]";
    private errorMessageXPath: string = "//div[@id='error']";
    private forgotPasswordLinkXPath: string = "//a[@id='forgot_password_link']";
    private copyrightTextXPath: string = "//p[@id='copyright']";

    constructor(page: Page) {
        super(page);
    }

    // Navigation
    public async navigateToLoginPage(): Promise<void> {
        try {
            logger.info('Navigating to Salesforce login page');
            await this.navigateTo(TestData.LOGIN_URL);
            await this.waitForPageLoad(TestData.TIMEOUT_LONG);
            logger.info('Login page loaded successfully');
        } catch (error) {
            logger.error(`Failed to navigate to login page: ${error}`);
            throw new Error('Unable to navigate to Salesforce login page');
        }
    }

    // Element Getters
    private getEmailInput(): Locator {
        return this.getLocator(this.emailInputXPath);
    }

    private getPasswordInput(): Locator {
        return this.getLocator(this.passwordInputXPath);
    }

    private getSignInButton(): Locator {
        return this.getLocator(this.signInButtonXPath);
    }

    private getRememberMeCheckbox(): Locator {
        return this.getLocator(this.rememberMeCheckboxXPath);
    }

    private getErrorMessage(): Locator {
        return this.getLocator(this.errorMessageXPath);
    }

    private getLoginPageHeading(): Locator {
        return this.getLocator(this.loginPageHeadingXPath);
    }

    private getForgotPasswordLink(): Locator {
        return this.getLocator(this.forgotPasswordLinkXPath);
    }

    // Verification Methods
    public async verifyLoginPageLoaded(): Promise<boolean> {
        try {
            logger.info('Verifying login page is loaded');
            const isLoginHeadingVisible = await this.isElementVisible(
                this.getLoginPageHeading(),
                'Login Page Heading'
            );
            const isEmailInputVisible = await this.isElementVisible(
                this.getEmailInput(),
                'Email Input Field'
            );
            const isPasswordInputVisible = await this.isElementVisible(
                this.getPasswordInput(),
                'Password Input Field'
            );
            const isSignInButtonVisible = await this.isElementVisible(
                this.getSignInButton(),
                'Sign In Button'
            );

            const allElementsVisible =
                isLoginHeadingVisible &&
                isEmailInputVisible &&
                isPasswordInputVisible &&
                isSignInButtonVisible;

            if (allElementsVisible) {
                logger.pass('Login page verification');
            } else {
                logger.fail('Login page verification', 'Not all required elements are visible');
            }

            return allElementsVisible;
        } catch (error) {
            logger.error(`Error verifying login page: ${error}`);
            return false;
        }
    }

    public async verifyErrorMessageDisplayed(): Promise<boolean> {
        try {
            logger.info('Checking if error message is displayed');
            const isVisible = await this.isElementVisible(
                this.getErrorMessage(),
                'Error Message'
            );
            if (isVisible) {
                const errorText = await this.getText(
                    this.getErrorMessage(),
                    'Error Message Text'
                );
                logger.info(`Error message displayed: ${errorText}`);
            }
            return isVisible;
        } catch (error) {
            logger.error(`Error checking error message: ${error}`);
            return false;
        }
    }

    public async getErrorMessage(): Promise<string> {
        try {
            logger.info('Retrieving error message text');
            const errorText = await this.getText(
                this.getErrorMessage(),
                'Error Message'
            );
            return errorText;
        } catch (error) {
            logger.error(`Failed to get error message: ${error}`);
            return '';
        }
    }

    // Action Methods
    public async enterEmail(email: string): Promise<void> {
        try {
            logger.info('Entering email address');
            await this.fillInput(this.getEmailInput(), email, 'Email');
        } catch (error) {
            logger.error(`Failed to enter email: ${error}`);
            throw new Error('Unable to enter email address');
        }
    }

    public async enterPassword(password: string): Promise<void> {
        try {
            logger.info('Entering password');
            await this.fillInput(this.getPasswordInput(), password, 'Password');
        } catch (error) {
            logger.error(`Failed to enter password: ${error}`);
            throw new Error('Unable to enter password');
        }
    }

    public async clickSignInButton(): Promise<void> {
        try {
            logger.info('Clicking Sign In button');
            await this.clickElement(this.getSignInButton(), 'Sign In Button');
            await this.waitForPageLoad(TestData.TIMEOUT_LONG);
            logger.info('Sign In button clicked and page loaded');
        } catch (error) {
            logger.error(`Failed to click Sign In button: ${error}`);
            throw new Error('Unable to click Sign In button');
        }
    }

    public async toggleRememberMe(): Promise<void> {
        try {
            logger.info('Toggling Remember Me checkbox');
            await this.clickElement(this.getRememberMeCheckbox(), 'Remember Me Checkbox');
            logger.info('Remember Me checkbox toggled');
        } catch (error) {
            logger.error(`Failed to toggle Remember Me: ${error}`);
            throw new Error('Unable to toggle Remember Me checkbox');
        }
    }

    public async isRememberMeChecked(): Promise<boolean> {
        try {
            logger.info('Checking if Remember Me is checked');
            const isChecked = await this.getRememberMeCheckbox().isChecked();
            logger.info(`Remember Me checkbox state: ${isChecked}`);
            return isChecked;
        } catch (error) {
            logger.error(`Failed to check Remember Me state: ${error}`);
            return false;
        }
    }

    public async clickForgotPasswordLink(): Promise<void> {
        try {
            logger.info('Clicking Forgot Password link');
            await this.clickElement(this.getForgotPasswordLink(), 'Forgot Password Link');
        } catch (error) {
            logger.error(`Failed to click Forgot Password link: ${error}`);
            throw new Error('Unable to click Forgot Password link');
        }
    }

    // Combined Login Action
    public async performLogin(email: string, password: string): Promise<void> {
        try {
            logger.info(`Performing login with email: ${email}`);
            await this.enterEmail(email);
            await this.enterPassword(password);
            await this.clickSignInButton();
            logger.pass('Login action completed');
        } catch (error) {
            logger.fail('Login action', error as string);
            throw new Error('Login action failed');
        }
    }

    public async performLoginWithRememberMe(email: string, password: string): Promise<void> {
        try {
            logger.info(`Performing login with Remember Me for email: ${email}`);
            await this.enterEmail(email);
            await this.enterPassword(password);
            await this.toggleRememberMe();
            await this.clickSignInButton();
            logger.pass('Login with Remember Me completed');
        } catch (error) {
            logger.fail('Login with Remember Me', error as string);
            throw new Error('Login with Remember Me failed');
        }
    }

    public async clearCredentials(): Promise<void> {
        try {
            logger.info('Clearing email and password fields');
            await this.getEmailInput().clear();
            await this.getPasswordInput().clear();
            logger.info('Fields cleared successfully');
        } catch (error) {
            logger.error(`Failed to clear fields: ${error}`);
            throw new Error('Unable to clear input fields');
        }
    }
}
