export class TestData {
    // Salesforce Login URL
    public static readonly LOGIN_URL = 'https://login.salesforce.com/?locale=in';

    // Valid Credentials
    public static readonly VALID_EMAIL = 'testuser@salesforce.qa.com';
    public static readonly VALID_PASSWORD = 'Test@Salesforce123';

    // Invalid Credentials - Email Variations
    public static readonly INVALID_EMAIL_FORMAT = 'invalidemail@test';
    public static readonly EMPTY_EMAIL = '';
    public static readonly INVALID_EMAIL = 'nonexistent@salesforce.com';
    public static readonly SPECIAL_CHAR_EMAIL = 'test$$$@salesforce.com';

    // Invalid Credentials - Password Variations
    public static readonly INVALID_PASSWORD = 'WrongPassword123';
    public static readonly EMPTY_PASSWORD = '';
    public static readonly SHORT_PASSWORD = '123';
    public static readonly INVALID_PASSWORD_SPECIAL = 'InvalidP@ss!';

    // Test Data Objects
    public static readonly VALID_LOGIN = {
        email: this.VALID_EMAIL,
        password: this.VALID_PASSWORD,
    };

    public static readonly INVALID_CREDENTIALS = [
        {
            email: this.INVALID_EMAIL,
            password: this.INVALID_PASSWORD,
            description: 'Invalid email and invalid password',
        },
        {
            email: this.VALID_EMAIL,
            password: this.INVALID_PASSWORD,
            description: 'Valid email with invalid password',
        },
        {
            email: this.INVALID_EMAIL,
            password: this.VALID_PASSWORD,
            description: 'Invalid email with valid password',
        },
        {
            email: this.EMPTY_EMAIL,
            password: this.VALID_PASSWORD,
            description: 'Empty email with valid password',
        },
        {
            email: this.VALID_EMAIL,
            password: this.EMPTY_PASSWORD,
            description: 'Valid email with empty password',
        },
        {
            email: this.INVALID_EMAIL_FORMAT,
            password: this.INVALID_PASSWORD,
            description: 'Invalid email format with invalid password',
        },
        {
            email: this.SPECIAL_CHAR_EMAIL,
            password: this.INVALID_PASSWORD,
            description: 'Special characters in email',
        },
    ];

    // Expected Error Messages
    public static readonly ERROR_MESSAGES = {
        INVALID_CREDENTIALS: 'Invalid username, password, security token; or user locked out',
        REQUIRED_FIELD: 'Please check your input',
        INVALID_EMAIL: 'Please include an \'@\' in the email address',
        REQUIRED_EMAIL: 'Please fill out this field',
        REQUIRED_PASSWORD: 'Please fill out this field',
    };

    // UI Element Timeouts
    public static readonly TIMEOUT_SHORT = 5000;
    public static readonly TIMEOUT_MEDIUM = 10000;
    public static readonly TIMEOUT_LONG = 30000;

    // Retry Configuration
    public static readonly MAX_RETRIES = 3;
    public static readonly RETRY_DELAY = 2000;
}
