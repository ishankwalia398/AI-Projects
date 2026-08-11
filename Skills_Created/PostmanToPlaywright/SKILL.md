---
name: PostmanToPlaywright
description: Convert Postman collections to Playwright test scripts. Use when the user provides a Postman collection file (.json) and environment file, or asks to migrate/convert API tests from Postman to Playwright, transform Postman requests into Playwright tests, or generate Playwright scripts from Postman collections.
---

# PostmanToPlaywright

Convert Postman API collections into executable Playwright test scripts that preserve the collection structure, environment variables, pre-request logic, assertions, and sequential dependencies.

## What This Skill Does

Takes a Postman collection JSON file and environment JSON file as input, and generates:
- Organized Playwright TypeScript test files matching the Postman folder structure
- Environment variable configuration
- Converted pre-request scripts (JWT generation, variable setup, etc.)
- Transformed Postman test assertions into Playwright expect statements
- Sequential test execution with proper variable chaining

## Input Requirements

Ask the user to provide:
1. **Postman Collection file path** - The .json export from Postman
2. **Postman Environment file path** - The environment .json with variables

If files are referenced but not provided as paths, ask the user for the explicit file paths.

## Output Structure

Generate a Playwright project with this structure:

```
playwright-tests/
├── tests/
│   ├── PreRequisite.spec.ts
│   ├── VOD-Movie-TVOD.spec.ts
│   ├── VOD-Movie-SVOD.spec.ts
│   └── ... (one file per top-level Postman folder)
├── utils/
│   ├── environment.ts (environment variables)
│   ├── helpers.ts (JWT generation, common functions)
│   └── types.ts (TypeScript interfaces)
├── playwright.config.ts
└── package.json
```

## Conversion Process

### Step 1: Read and Parse Input Files

Read both the Postman collection and environment files. Parse the JSON structure to understand:
- Collection hierarchy (folders and requests)
- Request details (method, URL, headers, body)
- Pre-request scripts
- Test scripts
- Environment variables

### Step 2: Generate Environment Configuration

Create `utils/environment.ts` that exports all environment variables from the Postman environment file:

```typescript
export const environment = {
  url: "https://api.example.com/",
  apiVersion: "",
  partnerId: "",
  // ... all environment variables
};

export function setEnvVar(key: string, value: any) {
  environment[key] = value;
}

export function getEnvVar(key: string) {
  return environment[key];
}
```

### Step 3: Extract and Convert Utilities

Analyze pre-request scripts across the collection for common patterns:
- JWT generation logic → utility function in `helpers.ts`
- Variable setting logic → beforeEach hooks or utility functions
- Timestamp generation → utility functions
- UUID generation → utility functions

Create `utils/helpers.ts` with extracted utility functions:

```typescript
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

export async function generateJWT(payload: any, privateKey: string): Promise<string> {
  // JWT generation logic from pre-request scripts
}

export function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

// ... other utility functions
```

### Step 4: Generate Test Files

For each top-level folder in the Postman collection, create a separate `.spec.ts` file.

**File naming convention**: Use the folder name, replacing spaces with hyphens and making it kebab-case.

Example: "VOD" folder → `VOD.spec.ts`, "PreRequisite" → `PreRequisite.spec.ts`

### Step 5: Convert Request Structure

For each Postman request, create a Playwright test case:

```typescript
import { test, expect } from '@playwright/test';
import { environment, setEnvVar, getEnvVar } from '../utils/environment';
import { generateJWT, getCurrentTimestamp } from '../utils/helpers';

test.describe('Folder Name', () => {
  
  test('Request Name', async ({ request }) => {
    // Pre-request script logic (if any)
    // Convert pm.environment.set() to setEnvVar()
    // Convert pm.environment.get() to getEnvVar()
    
    // Make the API request
    const response = await request.post(`${environment.url}endpoint`, {
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        // request body with {{variables}} replaced
      }
    });
    
    // Convert Postman test assertions
    // pm.test() → expect()
    // pm.expect() → expect()
    // pm.response.text() → await response.text()
    // JSON.parse(responseBody) → await response.json()
    
    const responseBody = await response.json();
    expect(response.status()).toBe(200);
    expect(responseBody.result).toBeDefined();
    
    // Extract and save variables from response (if test script does this)
    if (responseBody.result.id) {
      setEnvVar('userId', responseBody.result.id);
    }
  });
  
});
```

### Step 6: Handle Variable Replacement

Replace Postman variables in requests:
- `{{variableName}}` → `${environment.variableName}` or `${getEnvVar('variableName')}`
- `{{$timestamp}}` → `Date.now()` or `getCurrentTimestamp()`
- `{{$randomInt}}` → `Math.floor(Math.random() * 1000000)`
- `{{$guid}}` → `uuidv4()`

### Step 7: Convert Postman Test Scripts

Transform Postman test assertions into Playwright assertions:

**Postman pattern** → **Playwright equivalent**

```javascript
// No error check
pm.test("noError", function () {
  pm.expect(pm.response.text()).to.not.include("error");
});
```
↓
```typescript
const responseText = await response.text();
expect(responseText).not.toContain("error");
```

---

```javascript
// Response validation
pm.test("validatingResponse", function () {
  var data = JSON.parse(responseBody);
  pm.expect(data.result.loginSession.ks).to.not.eq(null);
});
```
↓
```typescript
const data = await response.json();
expect(data.result.loginSession.ks).not.toBeNull();
expect(data.result.loginSession.ks).toBeDefined();
```

---

```javascript
// Saving variables
pm.test("savingUserDetails", function(){
  var data = JSON.parse(responseBody);
  pm.environment.set("userName", data.result.username);
  pm.environment.set("userId", data.result.id);
});
```
↓
```typescript
const data = await response.json();
setEnvVar('userName', data.result.username);
setEnvVar('userId', data.result.id);
```

---

```javascript
// Nested tests
pm.test("outer", function () {
  if (pm.expect(condition)) {
    pm.test("inner", function() {
      // assertions
    });
  }
});
```
↓
```typescript
// Flatten nested tests into sequential assertions
if (condition) {
  // assertions
}
```

### Step 8: Convert Pre-request Scripts

Transform pre-request script patterns:

**Setting variables**:
```javascript
pm.environment.set("userName", "MFAAdmin");
pm.environment.set("password", "Qwer@12345678!!");
```
↓
```typescript
test.beforeEach(async () => {
  setEnvVar('userName', 'MFAAdmin');
  setEnvVar('password', 'Qwer@12345678!!');
});
```

**JWT generation**:
Extract the entire JWT generation logic into `utils/helpers.ts` and call it:
```typescript
const jwtToken = await generateJWT({
  sub: getEnvVar('userName'),
  iss: 'APIGateway',
  aud: 'Kaltura',
  // ... payload
}, getEnvVar('jwt_private'));
setEnvVar('assertionToken', jwtToken);
```

**Complex logic**:
For complex pre-request scripts, convert them directly inline before the request:
```typescript
// Original pre-request logic converted to TypeScript
const env = environment.name?.substring(0, 4).toUpperCase();
if (env === "PRD1") {
  setEnvVar("userName", "MFAAdmin");
  setEnvVar("password", "Qwer@12345678!!");
}
```

### Step 9: Maintain Sequential Dependencies

Since Postman tests run sequentially and later tests depend on variables set by earlier tests, ensure Playwright tests maintain this order:

1. Use `test.describe.serial()` instead of `test.describe()` for test groups where order matters
2. Keep the same execution order as the Postman collection
3. Preserve variable setting/getting across tests within the same file

```typescript
test.describe.serial('User Flow', () => {
  test('register user', async ({ request }) => {
    // ... creates user, sets userId
    setEnvVar('userId', data.result.id);
  });
  
  test('login user', async ({ request }) => {
    // ... uses userId from previous test
    const userId = getEnvVar('userId');
  });
});
```

### Step 10: Handle Nested Folders

For nested folders in Postman, create nested describe blocks:

```typescript
test.describe('Parent Folder', () => {
  test.describe('Child Folder', () => {
    test('request name', async ({ request }) => {
      // test logic
    });
  });
});
```

Alternatively, if nesting is deep, create separate files with names like `ParentFolder-ChildFolder.spec.ts`.

### Step 11: Generate Configuration Files

**playwright.config.ts**:
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  retries: 0,
  workers: 1, // Sequential execution
  use: {
    baseURL: 'https://api.example.com',
    extraHTTPHeaders: {
      'Accept': 'application/json',
    },
  },
});
```

**package.json**:
```json
{
  "name": "postman-to-playwright",
  "version": "1.0.0",
  "scripts": {
    "test": "playwright test",
    "test:ui": "playwright test --ui"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  },
  "dependencies": {
    "jsonwebtoken": "^9.0.0",
    "uuid": "^9.0.0"
  }
}
```

**tsconfig.json**:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["tests/**/*", "utils/**/*"]
}
```

## Implementation Guidelines

### Organization
- Create one test file per top-level Postman folder
- Use descriptive test names matching the Postman request names
- Group related requests using `test.describe()`
- Use `test.describe.serial()` when execution order matters

### Variable Handling
- Initialize all environment variables in `utils/environment.ts`
- Use `setEnvVar()` and `getEnvVar()` consistently
- Document which tests set variables that other tests depend on

### Comments
- Add comments indicating the original Postman folder/request structure
- Note any complex conversion logic
- Highlight areas where manual review might be needed (e.g., complex assertions)

### Error Handling
- Preserve error checking from Postman tests
- Add try-catch blocks for complex pre-request logic
- Log meaningful error messages

### Best Practices
- Use TypeScript for type safety
- Extract repeated logic into utility functions
- Use async/await consistently
- Format code with Prettier or similar

## Special Cases

### Dynamic Postman Variables
- `{{$timestamp}}` → `Date.now()`
- `{{$randomInt}}` → `Math.floor(Math.random() * 1000000)`
- `{{$guid}}` → `uuidv4()` (import from 'uuid' package)

### JWT/Token Generation
Extract complex JWT logic into a utility function rather than inlining in every test. Pass the required parameters and return the token.

### Conditional Logic
Preserve conditional logic from pre-request and test scripts:
```javascript
if (env == "PRD1") { ... }
```
→
```typescript
if (env === "PRD1") { ... }
```

### Response Validation
For complex response validations (e.g., checking nested properties, arrays), create helper assertion functions in `utils/helpers.ts`.

### Base64 Decoding
Postman: `atob(token.split('.')[1])`
Playwright: `Buffer.from(token.split('.')[1], 'base64').toString('utf-8')`

### Request Retries
If Postman collection has retry logic, implement it using Playwright's built-in retry mechanism or custom retry logic.

## Output Format

After conversion, provide:
1. A summary of what was converted
2. The complete file structure
3. List any manual steps needed (e.g., installing dependencies, reviewing complex logic)
4. Instructions to run the tests:
   ```bash
   npm install
   npx playwright test
   ```

Present the generated files to the user, organized by directory. For large collections, offer to write files directly to disk rather than displaying all content inline.

## Validation

Before presenting the final output:
- Verify all Postman requests are converted
- Check that variable dependencies are maintained
- Ensure all test assertions are converted
- Validate that the TypeScript syntax is correct
- Confirm that all required utility functions are created

## Example Conversion

**Postman Request**:
```json
{
  "name": "ottuser/action/login",
  "request": {
    "method": "POST",
    "header": [{"key": "Content-Type", "value": "application/json"}],
    "body": {
      "mode": "raw",
      "raw": "{\n  \"apiVersion\": \"{{apiVersion}}\",\n  \"partnerId\": \"{{partnerId}}\",\n  \"username\": \"{{userName}}\",\n  \"password\": \"{{password}}\"\n}"
    },
    "url": {
      "raw": "{{url}}ottuser/action/login"
    }
  },
  "event": [
    {
      "listen": "test",
      "script": {
        "exec": [
          "pm.test(\"noError\", function () {",
          "   if (pm.expect(pm.response.text()).to.not.include(\"error\"))",
          "   {",
          "        var data = JSON.parse(responseBody);",
          "        pm.test(\"validatingResponse\", function(){",
          "            pm.expect(data.result.loginSession.ks).to.not.be.equal(null);",
          "        });",
          "        pm.test(\"savingUserDetails\", function(){",
          "            pm.environment.set(\"ks\", data.result.loginSession.ks);",
          "        });",
          "   }",
          "});"
        ]
      }
    }
  ]
}
```

**Converted Playwright Test**:
```typescript
test('ottuser/action/login', async ({ request }) => {
  const response = await request.post(`${environment.url}ottuser/action/login`, {
    headers: {
      'Content-Type': 'application/json'
    },
    data: {
      apiVersion: getEnvVar('apiVersion'),
      partnerId: getEnvVar('partnerId'),
      username: getEnvVar('userName'),
      password: getEnvVar('password')
    }
  });

  const responseText = await response.text();
  expect(responseText).not.toContain('error');
  
  const data = await response.json();
  expect(data.result.loginSession.ks).not.toBeNull();
  expect(data.result.loginSession.ks).toBeDefined();
  
  setEnvVar('ks', data.result.loginSession.ks);
});
```

## Notes

- The generated Playwright tests maintain the same sequential execution as Postman
- Complex JavaScript in pre-request scripts may require manual review
- Some Postman-specific features (like visualizations) won't be converted
- Generated tests are immediately runnable after `npm install`
- TypeScript provides better type safety than Postman's JavaScript environment
