# Salesforce Playwright Automation Framework

## Overview
Enterprise-grade Playwright automation framework for Salesforce login page testing. Built with TypeScript, Playwright, TestNG, and Maven following industry best practices.

## Framework Architecture

### Page Object Model (2 Pages)
- **BasePage.ts** - Base class with reusable methods and exception handling
- **LoginPage.ts** - Salesforce login page object with XPath selectors
- **DashboardPage.ts** - Dashboard page for post-login validation

### Test Scripts (2 TestNG Classes)
- **ValidLoginTest.ts** - 4 valid login test cases
- **InvalidLoginTest.ts** - 8 invalid login test cases

### Utilities
- **Logger.ts** - Comprehensive logging with file output
- **TestData.ts** - Test data constants and credentials

### Configuration Files
- **pom.xml** - Maven dependencies and plugins
- **tsconfig.json** - TypeScript compiler settings
- **package.json** - Node package dependencies
- **playwright.config.ts** - Playwright configuration
- **testng.xml** - TestNG test suite configuration
- **config.properties** - Application configuration

---

## Directory Structure

```
PlaywrightTestFramework/
├── pom.xml
├── tsconfig.json
├── package.json
├── playwright.config.ts
├── testng.xml
├── src/
│   ├── pages/
│   │   ├── BasePage.ts
│   │   ├── LoginPage.ts
│   │   └── DashboardPage.ts
│   ├── tests/
│   │   ├── ValidLoginTest.ts
│   │   └── InvalidLoginTest.ts
│   ├── utils/
│   │   ├── Logger.ts
│   │   └── TestData.ts
│   └── config/
│       └── config.properties
└── README.md
```

---

## Prerequisites

### System Requirements
- Node.js 16+ or Java 11+
- npm or Maven
- macOS / Windows / Linux

### Installation

#### Option 1: Using npm
```bash
npm install
```

#### Option 2: Using Maven
```bash
mvn clean install
```

---

## Test Coverage

### Valid Login Tests (4 tests)
1. ✅ Valid Login with Correct Credentials
2. ✅ Valid Login with Remember Me Functionality
3. ✅ Verify Dashboard Elements After Successful Login
4. ✅ Verify User Display Name After Login

### Invalid Login Tests (8 tests)
1. ❌ Invalid Email and Invalid Password
2. ❌ Valid Email with Invalid Password
3. ❌ Invalid Email with Valid Password
4. ❌ Empty Email with Valid Password
5. ❌ Valid Email with Empty Password
6. ❌ Invalid Email Format with Invalid Password
7. ❌ Special Characters in Email Address
8. ❌ Login Page Elements Remain Visible After Failed Login

**Total: 12 comprehensive test cases**

---

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Valid Login Tests
```bash
npm run test:valid
```

### Run Invalid Login Tests
```bash
npm run test:invalid
```

### Run with Maven
```bash
mvn test
```

---

## Test Execution Flow

### Before Suite
- Browser initialization
- Logging setup

### Before Each Test
- Create new browser page
- Initialize Page Objects
- Navigate to Salesforce login page

### Test Execution
- Perform login actions
- Verify UI elements
- Assert expected results
- Take screenshots on failure

### After Each Test
- Clear cookies and session
- Close browser page
- Clean up resources

### After Suite
- Close browser
- Generate test report

---

## Page Object Model Details

### BasePage.ts Methods
- `navigateTo()` - Navigate to URL with exception handling
- `fillInput()` - Fill input field with wait and validation
- `clickElement()` - Click element with visibility check
- `isElementVisible()` - Verify element visibility
- `isElementPresent()` - Check element presence
- `getText()` - Retrieve text content
- `verifyElementText()` - Assert text content
- `waitForPageLoad()` - Wait for network idle
- `takeScreenshot()` - Capture page screenshot
- `switchToFrame()` - Handle frame switching
- `acceptAlert()` - Accept alert dialog
- `dismissAlert()` - Dismiss alert dialog

### LoginPage.ts Methods
- `navigateToLoginPage()` - Navigate to Salesforce login
- `verifyLoginPageLoaded()` - Verify all login elements
- `verifyErrorMessageDisplayed()` - Check error display
- `getErrorMessage()` - Retrieve error text
- `enterEmail()` - Enter email with validation
- `enterPassword()` - Enter password with validation
- `clickSignInButton()` - Click sign-in button
- `toggleRememberMe()` - Toggle Remember Me checkbox
- `isRememberMeChecked()` - Check Remember Me state
- `performLogin()` - Combined login action
- `performLoginWithRememberMe()` - Login with Remember Me
- `clearCredentials()` - Clear input fields

### DashboardPage.ts Methods
- `verifyDashboardLoaded()` - Verify dashboard elements
- `verifyUserLoggedIn()` - Check user login status
- `getUserDisplayName()` - Get user name
- `verifyWelcomeMessageDisplayed()` - Check welcome message
- `verifyTabsSectionPresent()` - Verify tabs section
- `verifyRecentItemsPresent()` - Verify recent items
- `clickUserMenu()` - Click user menu
- `logout()` - Logout functionality
- `verifyPageTitle()` - Verify page title
- `verifyURL()` - Verify current URL

---

## XPath Locators Used

### LoginPage
- Email Input: `//input[@id='username']`
- Password Input: `//input[@id='password']`
- Sign In Button: `//input[@id='Login']`
- Remember Me Checkbox: `//input[@id='rememberUn']`
- Error Message: `//div[@id='error']`
- Forgot Password Link: `//a[@id='forgot_password_link']`

### DashboardPage
- Dashboard Header: `//h1[contains(text(), 'Home')]`
- User Menu: `//div[@id='userNav']`
- User Name Display: `//span[@id='userFullName']`
- Logout Link: `//a[@onclick='return logout()']`

---

## Exception Handling

### Implemented Error Handling
- **Navigation Errors** - Timeout and network issues
- **Element Interaction Errors** - Click, fill, text extraction
- **Element Visibility Errors** - Wait timeout exceptions
- **Frame Switching Errors** - Frame not found exceptions
- **Alert Handling Errors** - Dialog interaction errors

All errors are logged with detailed messages and stack traces.

---

## Logging

### Log Levels
- **INFO** - Informational messages
- **WARN** - Warning messages
- **ERROR** - Error messages
- **DEBUG** - Debug information
- **PASS** - Test passed
- **FAIL** - Test failed

### Log Output
- Console output (real-time)
- File output: `./logs/automation.log`

---

## Test Data

### Valid Credentials
```
Email: testuser@salesforce.qa.com
Password: Test@Salesforce123
```

### Invalid Test Credentials
- Invalid email formats
- Invalid passwords
- Empty credentials
- Special characters
- Format validation errors

---

## Configuration

### Update Credentials
Edit `src/config/config.properties`:
```properties
login.url=https://login.salesforce.com/?locale=in
login.email.valid=your_email@company.com
login.password.valid=your_password
```

Or update `src/utils/TestData.ts`:
```typescript
public static readonly VALID_EMAIL = 'your_email@company.com';
public static readonly VALID_PASSWORD = 'your_password';
```

---

## Browser Configuration

### Supported Browsers
- Chromium (default)
- Firefox
- WebKit (Safari)

### Configuration in `playwright.config.ts`
```typescript
baseURL: 'https://login.salesforce.com/'
timeout: 30 * 1000
headless: false
```

---

## Screenshots and Videos

### Capture Locations
- Screenshots: `./screenshots/`
- Videos: `./videos/`
- Reports: `./test-results/`

### Automatic Capture
- Screenshots on failure
- Videos on failure
- HTML reports

---

## Performance Considerations

### Timeouts
- Short Timeout: 5 seconds
- Medium Timeout: 10 seconds
- Long Timeout: 30 seconds

### Retries
- Max Retries: 3
- Retry Delay: 2000ms

---

## CI/CD Integration

### GitHub Actions
```yaml
- name: Run Tests
  run: npm test
```

### Jenkins
```bash
mvn clean test
```

---

## Troubleshooting

### Issue: Tests Fail to Connect
**Solution:** Verify Salesforce URL and network connectivity

### Issue: Element Not Found
**Solution:** Verify XPath selectors against Salesforce UI

### Issue: Timeout Errors
**Solution:** Increase timeout values in `TestData.ts`

### Issue: Logger File Not Created
**Solution:** Ensure `./logs` directory exists

---

## Best Practices Implemented

✅ Page Object Model (POM) pattern
✅ XPath selectors only (no CSS)
✅ Robust exception handling
✅ Comprehensive logging
✅ TestNG annotations
✅ Reusable methods
✅ Type-safe TypeScript
✅ Enterprise-grade structure
✅ Zero hard-coded values
✅ Production-ready error handling

---

## Maintenance

### Adding New Tests
1. Create new test method in test class
2. Use existing Page Objects
3. Follow naming convention
4. Add logging statements
5. Update testng.xml

### Adding New Pages
1. Create new class extending BasePage
2. Define XPath selectors
3. Implement verification methods
4. Add action methods
5. Import and use in tests

---

## Support

For issues or questions, refer to:
- [Playwright Documentation](https://playwright.dev)
- [TestNG Documentation](https://testng.org)
- [Salesforce Testing Guide](https://developer.salesforce.com)

---

## Version History

**v1.0.0** - Initial Release
- 2 Page Objects
- 12 Test Cases
- Enterprise-grade framework
- Full exception handling
- Comprehensive logging

---

## Author

QA Automation Team

## License

MIT
