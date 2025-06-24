These scenarios are designed to be immediately actionable, demonstrating the power of precise prompting and structured output for Task Agents.

---

## 1. Senior/Junior Developer Scenarios

These scenarios highlight the importance of providing comprehensive context, constraints, and best practices to guide a Task Agent, much like a senior developer mentors a junior.

### Scenario 1: Simple Function Generation

**Goal:** Create a JavaScript function to calculate the factorial of a number.

#### The "Junior" Approach (What Not To Do)

**Prompt:**
```
Write a JavaScript function to calculate factorial.
```

**Agent's Initial Response (Junior):**
```javascript
function factorial(n) {
  if (n === 0) {
    return 1;
  }
  return n * factorial(n - 1);
}
// Example usage:
// console.log(factorial(5)); // 120
```

**Critique:**
*   **Lack of Robustness:** No input validation (negative numbers, non-integers).
*   **No Documentation:** No JSDoc or comments explaining usage, parameters, or return values.
*   **No Error Handling:** What happens if `n` is `null` or a string?
*   **No Context:** Assumes a basic environment, doesn't consider performance for large numbers (e.g., iterative vs. recursive stack limits).

#### The "Senior" Approach (Best Practice)

**Prompt:**
```
You are a senior JavaScript developer working on a critical utility library.
Create a highly robust and well-documented `calculateFactorial` function.

**Requirements:**
1.  **Functionality:** Calculate the factorial of a non-negative integer.
2.  **Input Validation:**
    *   Throw an `Error` if the input is not a number.
    *   Throw an `Error` if the input is a negative number.
    *   Handle non-integer inputs by throwing an `Error` or rounding (specify which). Let's throw an error for non-integers.
3.  **Documentation:** Use JSDoc to clearly describe parameters, return value, and potential errors.
4.  **Edge Cases:** Explicitly handle `0!` (which is 1).
5.  **Performance (Implicit):** Consider an iterative approach for better stack safety for larger numbers, or mention the recursive approach's limitations.
6.  **Purity:** The function should be pure (no side effects).

Provide only the function code and its JSDoc.
```

**Agent's Response (Senior):**
```javascript
/**
 * Calculates the factorial of a non-negative integer.
 *
 * @param {number} n - The non-negative integer for which to calculate the factorial.
 * @returns {number} The factorial of `n`.
 * @throws {Error} If `n` is not a number, is negative, or is not an integer.
 */
function calculateFactorial(n) {
  if (typeof n !== 'number') {
    throw new Error('Input must be a number.');
  }
  if (n < 0) {
    throw new Error('Input must be a non-negative number.');
  }
  if (!Number.isInteger(n)) {
    throw new Error('Input must be an integer.');
  }

  if (n === 0) {
    return 1;
  }

  let result = 1;
  for (let i = 1; i <= n; i++) {
    result *= i;
  }
  return result;
}
```

**Expected Results Difference:**
*   **Junior:** A basic, fragile function. Requires multiple follow-up prompts for validation, documentation, and error handling.
*   **Senior:** A production-ready, robust, and well-documented function in a single go.

**Token/Iteration Savings:**
*   **Junior:**
    *   Initial prompt: ~10 tokens
    *   Agent response: ~50 tokens
    *   Follow-up 1 (validation): ~50 tokens prompt, ~100 tokens response
    *   Follow-up 2 (JSDoc): ~30 tokens prompt, ~80 tokens response
    *   **Total Iterations: 3-4**
    *   **Total Tokens (approx): 320-400** (including agent's internal processing)
*   **Senior:**
    *   Initial prompt: ~250 tokens
    *   Agent response: ~300 tokens
    *   **Total Iterations: 1**
    *   **Total Tokens (approx): 550-600** (higher initial prompt, but *significantly* fewer overall iterations and less back-and-forth)

**Savings:** While the senior prompt is longer, it leads to a *single, high-quality iteration*, saving significant human review time and subsequent agent calls. The "token savings" here are primarily in *agent-human interaction tokens* and *time*.

---

### Scenario 2: Component with Tests

**Goal:** Create a reusable React Button component with basic styling and a unit test.

#### The "Junior" Approach (What Not To Do)

**Prompt:**
```
Make a React button component.
```

**Agent's Initial Response (Junior):**
```jsx
// Button.js
import React from 'react';

function Button({ children, onClick }) {
  return (
    <button onClick={onClick}>
      {children}
    </button>
  );
}

export default Button;
```

**Critique:**
*   **Missing Styling:** No CSS, no way to customize appearance.
*   **No Props:** Only `children` and `onClick`. What about `variant`, `disabled`, `type`?
*   **No Tests:** Critical for a reusable component.
*   **No TypeScript:** Assumes plain JS, not ideal for modern React.
*   **No Context:** Doesn't know the project's styling conventions (CSS Modules, Styled Components, Tailwind).

#### The "Senior" Approach (Best Practice)

**Prompt:**
```
You are a senior React developer building a component library for our new design system.
Create a reusable `Button` component using **TypeScript** and **CSS Modules**.
Include a basic **Jest unit test** file.

**Component Requirements (Button.tsx):**
1.  **Props:**
    *   `children`: React.ReactNode (content of the button)
    *   `onClick`: () => void (optional click handler)
    *   `variant`: 'primary' | 'secondary' | 'danger' (default: 'primary')
    *   `size`: 'small' | 'medium' | 'large' (default: 'medium')
    *   `disabled`: boolean (optional, default: false)
    *   `type`: 'button' | 'submit' | 'reset' (optional, default: 'button')
    *   `className`: string (optional, for custom styling)
2.  **Styling:** Use CSS Modules (`Button.module.css`).
    *   Define styles for `primary`, `secondary`, `danger` variants.
    *   Define styles for `small`, `medium`, `large` sizes.
    *   Handle `disabled` state styling.
3.  **Accessibility:** Ensure basic accessibility attributes (e.g., `disabled` prop on button element).

**Test Requirements (Button.test.tsx):**
1.  Render the button with basic text.
2.  Test `onClick` handler is called.
3.  Test `disabled` state prevents `onClick`.
4.  Test rendering with different `variant` props (e.g., 'secondary').

**Context Provision:**
*   Assume `react` and `@testing-library/react` are installed.
*   Assume `jest` is configured.

Provide both `Button.tsx`, `Button.module.css`, and `Button.test.tsx` in separate code blocks.
```

**Agent's Response (Senior):**
```tsx
// Button.tsx
import React from 'react';
import styles from './Button.module.css';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  type = 'button',
  className,
}) => {
  const buttonClasses = [
    styles.button,
    styles[variant],
    styles[size],
    disabled ? styles.disabled : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      onClick={onClick}
      className={buttonClasses}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
```

```css
/* Button.module.css */
.button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.2s ease-in-out;
}

.button:hover:not(.disabled) {
  opacity: 0.9;
}

.primary {
  background-color: #007bff;
  color: white;
}

.secondary {
  background-color: #6c757d;
  color: white;
}

.danger {
  background-color: #dc3545;
  color: white;
}

.small {
  padding: 6px 12px;
  font-size: 14px;
}

.medium {
  padding: 8px 16px;
  font-size: 16px;
}

.large {
  padding: 10px 20px;
  font-size: 18px;
}

.disabled {
  background-color: #e0e0e0;
  color: #a0a0a0;
  cursor: not-allowed;
}
```

```tsx
// Button.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';

describe('Button', () => {
  test('renders button with children', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText(/click me/i)).toBeInTheDocument();
  });

  test('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Test Button</Button>);
    fireEvent.click(screen.getByText(/test button/i));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('does not call onClick handler when disabled', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick} disabled>Disabled Button</Button>);
    fireEvent.click(screen.getByText(/disabled button/i));
    expect(handleClick).not.toHaveBeenCalled();
  });

  test('applies secondary variant styles', () => {
    render(<Button variant="secondary">Secondary Button</Button>);
    // This test assumes a specific class name structure from CSS Modules
    // In a real scenario, you might check for computed styles or a specific data-testid
    expect(screen.getByText(/secondary button/i)).toHaveClass(/secondary/);
  });
});
```

**Expected Results Difference:**
*   **Junior:** A barebones component requiring significant manual additions and multiple iterations.
*   **Senior:** A complete, well-structured, typed, styled, and tested component ready for integration, generated in one go.

**Token/Iteration Savings:**
*   **Junior:**
    *   Initial prompt: ~5 tokens
    *   Agent response: ~50 tokens
    *   Follow-up 1 (styling): ~40 tokens prompt, ~150 tokens response (CSS + JS changes)
    *   Follow-up 2 (props): ~60 tokens prompt, ~100 tokens response (JS changes)
    *   Follow-up 3 (tests): ~80 tokens prompt, ~200 tokens response
    *   Follow-up 4 (TypeScript): ~30 tokens prompt, ~150 tokens response
    *   **Total Iterations: 5-6**
    *   **Total Tokens (approx): 1000-1200**
*   **Senior:**
    *   Initial prompt: ~400 tokens
    *   Agent response: ~1000 tokens (for all 3 files)
    *   **Total Iterations: 1**
    *   **Total Tokens (approx): 1400-1500**

**Savings:** The senior approach, despite higher initial token cost, is dramatically more efficient in *developer time* and *total agent calls*. It delivers a production-ready artifact immediately, avoiding the costly back-and-forth of incomplete outputs.

---

### Scenario 3: Full System Refactor

**Goal:** Refactor a legacy, monolithic JavaScript module responsible for user authentication into a more modular, testable structure.

#### The "Junior" Approach (What Not To Do)

**Prompt:**
```
Refactor this user authentication module.
```

**Attached File: `legacyAuth.js`**
```javascript
// legacyAuth.js
const config = {
  apiUrl: 'https://api.example.com/v1',
  jwtSecret: 'supersecretkey', // Bad practice, but common in legacy
  sessionTimeout: 3600
};

let currentUser = null; // Global state, bad!

function initAuth() {
  console.log('Auth module initialized.');
  // Check for existing token in localStorage
  const token = localStorage.getItem('authToken');
  if (token) {
    // Simulate token validation
    if (token.length > 10) { // Very naive validation
      currentUser = { username: 'guest', token: token }; // Placeholder
      console.log('User session restored.');
    } else {
      localStorage.removeItem('authToken');
    }
  }
}

function login(username, password) {
  if (!username || !password) {
    console.error('Username and password are required.');
    return Promise.reject(new Error('Missing credentials'));
  }

  console.log(`Attempting login for ${username}...`);
  return fetch(`${config.apiUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  .then(response => response.json())
  .then(data => {
    if (data.token) {
      localStorage.setItem('authToken', data.token);
      currentUser = { username: data.username || username, token: data.token };
      console.log('Login successful!');
      return currentUser;
    } else {
      console.error('Login failed:', data.message);
      return Promise.reject(new Error(data.message || 'Login failed'));
    }
  })
  .catch(error => {
    console.error('Network error during login:', error);
    return Promise.reject(new Error('Network error or server issue'));
  });
}

function logout() {
  localStorage.removeItem('authToken');
  currentUser = null;
  console.log('User logged out.');
  return Promise.resolve(true);
}

function getCurrentUser() {
  return currentUser;
}

function isAuthenticated() {
  return !!currentUser;
}

// Exposed global functions
window.auth = {
  init: initAuth,
  login: login,
  logout: logout,
  getCurrentUser: getCurrentUser,
  isAuthenticated: isAuthenticated
};

initAuth(); // Auto-initialize
```

**Agent's Initial Response (Junior):**
```javascript
// refactoredAuth.js
// This agent might just reformat the code or make minor changes without structural improvements.
// Or it might try to "fix" things without understanding the full context.

const config = {
  apiUrl: 'https://api.example.com/v1',
  jwtSecret: 'supersecretkey',
  sessionTimeout: 3600
};

let currentUser = null;

function initAuth() {
  // ... (same code, maybe slightly reordered)
}

async function login(username, password) { // Changed to async/await, but still monolithic
  // ... (same logic, just async/await syntax)
}

function logout() {
  // ...
}

function getCurrentUser() {
  return currentUser;
}

function isAuthenticated() {
  return !!currentUser;
}

export { initAuth, login, logout, getCurrentUser, isAuthenticated }; // Changed to ES Modules, but still one file
```

**Critique:**
*   **Superficial Refactor:** Might just change syntax (e.g., `async/await`) or module system (`export`), but doesn't address core architectural issues.
*   **Monolithic:** Still one large file, poor separation of concerns.
*   **Global State:** `currentUser` is still a global mutable variable.
*   **Hardcoded Config:** `jwtSecret` still in client-side code.
*   **Untestable:** Functions are tightly coupled to `localStorage` and `fetch`.
*   **No Guidance:** Agent doesn't know *what* "refactor" means in this context (e.g., modularity, testability, security).

#### The "Senior" Approach (Best Practice)

**Prompt:**
```
You are a senior software architect leading a critical refactoring effort for a legacy JavaScript application.
Your task is to modernize and modularize the attached `legacyAuth.js` module.

**Overarching Goals:**
1.  **Modularity:** Break down the monolithic file into smaller, focused modules (e.g., `authService.js`, `tokenStorage.js`, `authConfig.js`).
2.  **Testability:** Decouple dependencies (like `localStorage` and `fetch`) to make unit testing easier. Use dependency injection or clear interfaces.
3.  **Maintainability:** Improve readability, remove global state, and use modern ES6+ features.
4.  **Security (Conceptual):** Identify and comment on obvious security flaws (e.g., hardcoded secrets) even if not directly fixing them in client-side code.
5.  **Preserve Functionality:** Ensure all existing public functions (`login`, `logout`, `getCurrentUser`, `isAuthenticated`) work exactly as before from the consumer's perspective, though their internal implementation will change.
6.  **Error Handling:** Improve error handling and propagation.

**Specific Deliverables (use markers for files):**
*   `src/auth/authConfig.js`: Configuration (API URL, etc.).
*   `src/auth/tokenStorage.js`: Handles `localStorage` interactions for tokens.
*   `src/auth/authService.js`: Core authentication logic (login, logout, user state).
*   `src/auth/index.js`: Re-exports public API for easy import.
*   `src/auth/__tests__/authService.test.js`: A basic Jest test file for `authService.js` (mocking dependencies).

**Guidance:**
*   Use ES Modules (`import`/`export`).
*   Avoid global variables. Manage user state within `authService` or a dedicated store.
*   For `fetch`, assume a simple `apiClient` or `fetch` wrapper can be injected or passed. For the test, mock `fetch`.
*   For `localStorage`, create a wrapper module (`tokenStorage.js`) that can be easily mocked.
*   Add JSDoc for all public functions.

**Attached File: `legacyAuth.js` (same as above)**
```javascript
// ... (content of legacyAuth.js)
```

```
```

**Agent's Response (Senior - abridged for brevity, but demonstrating structure):**

```javascript
// ---FILE: src/auth/authConfig.js---
const authConfig = {
  apiUrl: 'https://api.example.com/v1',
  // NOTE: jwtSecret should NEVER be hardcoded in client-side code.
  // This should be managed server-side or via environment variables.
  // Keeping it here for functional parity with legacy, but flagging as a security concern.
  jwtSecret: 'supersecretkey',
  sessionTimeout: 3600, // In seconds
};

export default authConfig;
```

```javascript
// ---FILE: src/auth/tokenStorage.js---
/**
 * A utility for managing authentication tokens in local storage.
 */
const TOKEN_KEY = 'authToken';

const tokenStorage = {
  /**
   * Retrieves the authentication token from local storage.
   * @returns {string | null} The stored token or null if not found.
   */
  getToken: () => {
    return localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Stores the authentication token in local storage.
   * @param {string} token - The token to store.
   */
  setToken: (token) => {
    localStorage.setItem(TOKEN_KEY, token);
  },

  /**
   * Removes the authentication token from local storage.
   */
  removeToken: () => {
    localStorage.removeItem(TOKEN_KEY);
  },
};

export default tokenStorage;
```

```javascript
// ---FILE: src/auth/authService.js---
import authConfig from './authConfig';
import tokenStorage from './tokenStorage';

/**
 * Represents the current authenticated user.
 * @typedef {Object} User
 * @property {string} username - The username of the authenticated user.
 * @property {string} token - The authentication token.
 */

let _currentUser = null; // Private module-level state

/**
 * Initializes the authentication service.
 * Checks for an existing token and attempts to restore the user session.
 */
const initAuth = () => {
  console.log('Auth module initialized.');
  const token = tokenStorage.getToken();
  if (token) {
    // Simulate token validation - in a real app, this would involve server-side validation
    if (token.length > 10) { // Naive check for demonstration
      _currentUser = { username: 'guest', token: token }; // Placeholder user
      console.log('User session restored.');
    } else {
      tokenStorage.removeToken();
    }
  }
};

/**
 * Attempts to log in a user with provided credentials.
 * @param {string} username - The user's username.
 * @param {string} password - The user's password.
 * @returns {Promise<User>} A promise that resolves with the user object on success.
 * @throws {Error} If credentials are missing, login fails, or a network error occurs.
 */
const login = async (username, password) => {
  if (!username || !password) {
    throw new Error('Username and password are required.');
  }

  console.log(`Attempting login for ${username}...`);
  try {
    const response = await fetch(`${authConfig.apiUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (response.ok && data.token) {
      tokenStorage.setToken(data.token);
      _currentUser = { username: data.username || username, token: data.token };
      console.log('Login successful!');
      return _currentUser;
    } else {
      const errorMessage = data.message || 'Login failed';
      console.error('Login failed:', errorMessage);
      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error('Network error during login:', error);
    throw new Error('Network error or server issue');
  }
};

/**
 * Logs out the current user.
 * @returns {Promise<boolean>} A promise that resolves to true on successful logout.
 */
const logout = async () => {
  tokenStorage.removeToken();
  _currentUser = null;
  console.log('User logged out.');
  return true;
};

/**
 * Retrieves the current authenticated user.
 * @returns {User | null} The current user object or null if not authenticated.
 */
const getCurrentUser = () => {
  return _currentUser;
};

/**
 * Checks if a user is currently authenticated.
 * @returns {boolean} True if a user is authenticated, false otherwise.
 */
const isAuthenticated = () => {
  return !!_currentUser;
};

export {
  initAuth,
  login,
  logout,
  getCurrentUser,
  isAuthenticated,
};
```

```javascript
// ---FILE: src/auth/index.js---
// This file serves as the public API for the authentication module.
export {
  initAuth,
  login,
  logout,
  getCurrentUser,
  isAuthenticated,
} from './authService';
```

```javascript
// ---FILE: src/auth/__tests__/authService.test.js---
import { initAuth, login, logout, getCurrentUser, isAuthenticated } from '../authService';
import tokenStorage from '../tokenStorage'; // Import the actual module to mock it

// Mock fetch globally for all tests in this file
global.fetch = jest.fn();

// Mock tokenStorage module
jest.mock('../tokenStorage', () => ({
  getToken: jest.fn(),
  setToken: jest.fn(),
  removeToken: jest.fn(),
}));

describe('AuthService', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    // Reset internal state of authService by re-importing or manually setting
    // For simplicity, we'll rely on clearAllMocks and the module's initial state
    // In a more complex scenario, you might need to reset the module's internal state
    // by using `jest.resetModules()` and re-importing.
  });

  describe('initAuth', () => {
    test('should restore session if token exists and is valid', () => {
      tokenStorage.getToken.mockReturnValue('valid-token-12345');
      initAuth();
      expect(getCurrentUser()).toEqual({ username: 'guest', token: 'valid-token-12345' });
      expect(isAuthenticated()).toBe(true);
    });

    test('should not restore session if token is invalid', () => {
      tokenStorage.getToken.mockReturnValue('invalid');
      initAuth();
      expect(getCurrentUser()).toBeNull();
      expect(isAuthenticated()).toBe(false);
      expect(tokenStorage.removeToken).toHaveBeenCalledTimes(1);
    });

    test('should not restore session if no token exists', () => {
      tokenStorage.getToken.mockReturnValue(null);
      initAuth();
      expect(getCurrentUser()).toBeNull();
      expect(isAuthenticated()).toBe(false);
      expect(tokenStorage.removeToken).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    test('should successfully log in and set token', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'new-token-abc', username: 'testuser' }),
      });

      const user = await login('testuser', 'password');
      expect(user).toEqual({ username: 'testuser', token: 'new-token-abc' });
      expect(tokenStorage.setToken).toHaveBeenCalledWith('new-token-abc');
      expect(getCurrentUser()).toEqual({ username: 'testuser', token: 'new-token-abc' });
      expect(isAuthenticated()).toBe(true);
    });

    test('should throw error for missing credentials', async () => {
      await expect(login('', 'password')).rejects.toThrow('Username and password are required.');
      expect(fetch).not.toHaveBeenCalled();
    });

    test('should throw error on failed login (server message)', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Invalid credentials' }),
      });

      await expect(login('wrong', 'pass')).rejects.toThrow('Invalid credentials');
      expect(tokenStorage.setToken).not.toHaveBeenCalled();
      expect(getCurrentUser()).toBeNull();
    });

    test('should throw error on network issue', async () => {
      fetch.mockRejectedValueOnce(new Error('Network down'));

      await expect(login('user', 'pass')).rejects.toThrow('Network error or server issue');
      expect(tokenStorage.setToken).not.toHaveBeenCalled();
      expect(getCurrentUser()).toBeNull();
    });
  });

  describe('logout', () => {
    test('should clear token and user state', async () => {
      // Simulate a logged-in state first
      tokenStorage.getToken.mockReturnValue('valid-token');
      initAuth();
      expect(isAuthenticated()).toBe(true);

      await logout();
      expect(tokenStorage.removeToken).toHaveBeenCalledTimes(1);
      expect(getCurrentUser()).toBeNull();
      expect(isAuthenticated()).toBe(false);
    });
  });
});
```

**Expected Results Difference:**
*   **Junior:** Minimal, superficial changes. The core problems remain. Requires extensive manual intervention and multiple rounds of feedback.
*   **Senior:** A complete, modular, testable, and maintainable refactor. Addresses architectural concerns, provides clear separation of concerns, and includes tests. This is a *transformative* output.

**Token/Iteration Savings:**
*   **Junior:**
    *   Initial prompt: ~10 tokens
    *   Agent response: ~200 tokens (minor changes)
    *   Follow-up 1 (modularity): ~100 tokens prompt, ~500 tokens response (some files, likely incomplete)
    *   Follow-up 2 (testability): ~150 tokens prompt, ~400 tokens response (struggles with mocking)
    *   Follow-up 3 (global state): ~80 tokens prompt, ~200 tokens response
    *   ... (many more iterations for security comments, JSDoc, etc.)
    *   **Total Iterations: 5-10+**
    *   **Total Tokens (approx): 2000-4000+**
*   **Senior:**
    *   Initial prompt: ~800 tokens (including attached file)
    *   Agent response: ~3000 tokens (for 5 files)
    *   **Total Iterations: 1-2** (one for initial, maybe one for minor tweaks)
    *   **Total Tokens (approx): 3800-4500**

**Savings:** The senior approach, while having a much larger initial prompt and response, delivers a *complete, high-quality solution* in a single pass. This saves *days* of developer time compared to the junior approach, where the agent would constantly need correction and guidance on fundamental architectural principles. The "comprehensive guidance" upfront is the key to unlocking this efficiency.

---

## 2. Marker Technique Scenarios

The Marker Technique allows Task Agents to output multiple files within a single response, significantly streamlining the development workflow by eliminating manual copy-pasting and file creation.

**General Extraction Command (Bash):**
Save this script as `extract_files.sh` and make it executable (`chmod +x extract_files.sh`).

```bash
#!/bin/bash

# Usage: ./extract_files.sh <agent_output_file>
# Example: ./extract_files.sh agent_response.txt

if [ -z "$1" ]; then
  echo "Usage: $0 <agent_output_file>"
  exit 1
fi

input_file="$1"

awk '
/^---FILE: / {
    if (filename != "") {
        close(filename);
    }
    filename = substr($0, 11); # Extract filename after "---FILE: "
    gsub(/---$/, "", filename); # Remove trailing "---"
    
    # Create parent directories if they don't exist
    dir = filename;
    sub(/\/[^\/]*$/, "", dir); # Remove filename part to get directory
    if (dir != "" && dir != filename) { # Ensure it's a directory path, not just a file
        system("mkdir -p \"" dir "\"");
    }
    
    print "Extracting: " filename;
    next;
}
filename != "" {
    print > filename;
}
' "$input_file"
```

### Scenario 1: Basic 2-File Output (Component + Styles)

**Goal:** Generate a simple React `Header` component and its corresponding CSS module.

**Prompt Instruction:**
```
Generate a simple React `Header` component and its corresponding CSS module.
The component should display "My App Header" and have a basic background color.
Use **TypeScript** for the component.
Use the marker technique for outputting both files.

---FILE: src/components/Header.tsx---
// Your Header.tsx content here

---FILE: src/components/Header.module.css---
// Your Header.module.css content here
```

**Example Agent Output with Markers:**
```
---FILE: src/components/Header.tsx---
import React from 'react';
import styles from './Header.module.css';

const Header: React.FC = () => {
  return (
    <header className={styles.header}>
      <h1>My App Header</h1>
    </header>
  );
};

export default Header;
---FILE: src/components/Header.module.css---
.header {
  background-color: #333;
  color: white;
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid #555;
}
```

**Extraction Command:**
1.  Save the agent's output to a file, e.g., `header_output.txt`.
2.  Run the extraction script:
    ```bash
    ./extract_files.sh header_output.txt
    ```

**Expected Result:**
Two files created:
*   `src/components/Header.tsx`
*   `src/components/Header.module.css`

**Time Saved Estimate:**
*   **Manual:** ~1-2 minutes (create `src/components` dir, create `Header.tsx`, copy-paste code, create `Header.module.css`, copy-paste code).
*   **Marker Technique:** ~5 seconds (save agent output, run script).
*   **Savings:** ~1-2 minutes per component. Multiplies rapidly for larger projects.

### Scenario 2: Complex Multi-File (5+ files with tests)

**Goal:** Generate a `ProductCard` feature including component, styles, types, a utility function, and tests.

**Prompt Instruction:**
```
You are building a new `ProductCard` feature for an e-commerce application.
Generate all necessary files for a robust, reusable `ProductCard` component.
Use **React**, **TypeScript**, and **CSS Modules**. Include **Jest tests**.

**Files to generate using the marker technique:**
1.  `src/features/products/components/ProductCard.tsx`
2.  `src/features/products/components/ProductCard.module.css`
3.  `src/features/products/types.ts` (for Product interface)
4.  `src/features/products/utils/formatPrice.ts` (a simple utility)
5.  `src/features/products/__tests__/ProductCard.test.tsx`

**Requirements:**
*   `ProductCard.tsx`: Display product image, name, price, and a "Add to Cart" button. Accept a `Product` prop.
*   `Product.ts`: Define `interface Product { id: string; name: string; price: number; imageUrl: string; }`
*   `formatPrice.ts`: Function to format a number as USD currency.
*   `ProductCard.module.css`: Basic styling for the card.
*   `ProductCard.test.tsx`: Test rendering product details and button click.

---FILE: src/features/products/types.ts---
// Your types.ts content

---FILE: src/features/products/utils/formatPrice.ts---
// Your formatPrice.ts content

---FILE: src/features/products/components/ProductCard.tsx---
// Your ProductCard.tsx content

---FILE: src/features/products/components/ProductCard.module.css---
// Your ProductCard.module.css content

---FILE: src/features/products/__tests__/ProductCard.test.tsx---
// Your ProductCard.test.tsx content
```

**Example Agent Output with Markers (Abridged):**
```
---FILE: src/features/products/types.ts---
export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
}
---FILE: src/features/products/utils/formatPrice.ts---
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
};
---FILE: src/features/products/components/ProductCard.tsx---
import React from 'react';
import { Product } from '../types';
import { formatPrice } from '../utils/formatPrice';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  product: Product;
  onAddToCart: (productId: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  return (
    <div className={styles.card}>
      <img src={product.imageUrl} alt={product.name} className={styles.image} />
      <h3 className={styles.name}>{product.name}</h3>
      <p className={styles.price}>{formatPrice(product.price)}</p>
      <button className={styles.button} onClick={() => onAddToCart(product.id)}>
        Add to Cart
      </button>
    </div>
  );
};

export default ProductCard;
---FILE: src/features/products/components/ProductCard.module.css---
.card { /* ... styles ... */ }
.image { /* ... styles ... */ }
.name { /* ... styles ... */ }
.price { /* ... styles ... */ }
.button { /* ... styles ... */ }
---FILE: src/features/products/__tests__/ProductCard.test.tsx---
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProductCard from '../components/ProductCard';
import { Product } from '../types';

const mockProduct: Product = {
  id: '1',
  name: 'Test Product',
  price: 29.99,
  imageUrl: 'http://example.com/image.jpg',
};

describe('ProductCard', () => {
  test('renders product details correctly', () => {
    render(<ProductCard product={mockProduct} onAddToCart={() => {}} />);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$29.99')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /test product/i })).toHaveAttribute('src', mockProduct.imageUrl);
  });

  test('calls onAddToCart when button is clicked', () => {
    const handleAddToCart = jest.fn();
    render(<ProductCard product={mockProduct} onAddToCart={handleAddToCart} />);
    fireEvent.click(screen.getByRole('button', { name: /add to cart/i }));
    expect(handleAddToCart).toHaveBeenCalledTimes(1);
    expect(handleAddToCart).toHaveBeenCalledWith('1');
  });
});
```

**Extraction Command:**
1.  Save the agent's output to `product_card_output.txt`.
2.  Run: `./extract_files.sh product_card_output.txt`

**Expected Result:**
A structured directory `src/features/products/` with all 5 files correctly placed and named.

**Time Saved Estimate:**
*   **Manual:** ~5-10 minutes (create nested directories, create 5 files, copy-paste code into each).
*   **Marker Technique:** ~10 seconds.
*   **Savings:** ~5-10 minutes per complex feature. This is where the technique truly shines.

### Scenario 3: Full Feature Generation (10+ files)

**Goal:** Generate a complete "User Dashboard" feature including multiple components, services, types, and tests, organized into a logical directory structure.

**Prompt Instruction:**
```
You are tasked with generating a complete "User Dashboard" feature for a web application.
This feature will display user profile information, recent activity, and allow basic profile editing.
Use **React**, **TypeScript**, **CSS Modules**, and **Jest** for testing.
Assume a mock API service for data fetching.

**Generate the following files using the marker technique, ensuring correct relative imports:**

*   `src/features/dashboard/index.ts` (Entry point for the feature)
*   `src/features/dashboard/components/DashboardLayout.tsx` (Main layout component)
*   `src/features/dashboard/components/UserProfileCard.tsx` (Displays user profile)
*   `src/features/dashboard/components/RecentActivityList.tsx` (Lists recent user actions)
*   `src/features/dashboard/components/forms/EditProfileForm.tsx` (Form for editing profile)
*   `src/features/dashboard/services/userService.ts` (Mock API service for user data)
*   `src/features/dashboard/types/user.ts` (TypeScript interfaces for User and Activity)
*   `src/features/dashboard/styles/Dashboard.module.css` (Main dashboard styles)
*   `src/features/dashboard/styles/UserProfileCard.module.css` (User profile card styles)
*   `src/features/dashboard/__tests__/UserProfileCard.test.tsx` (Test for UserProfileCard)
*   `src/features/dashboard/__tests__/EditProfileForm.test.tsx` (Test for EditProfileForm)

**Key Requirements for each:**
*   **DashboardLayout:** Orchestrates other components.
*   **UserProfileCard:** Takes a `User` prop, displays name, email, avatar.
*   **RecentActivityList:** Takes `Activity[]` prop, displays list items.
*   **EditProfileForm:** Takes `User` prop, `onSave` callback. Form fields for name, email.
*   **userService:** Mock `fetchUser`, `updateUser`, `fetchRecentActivity` functions returning Promises.
*   **types/user.ts:** Define `User` and `Activity` interfaces.
*   **Tests:** Basic rendering and interaction tests for specified components.

---FILE: src/features/dashboard/types/user.ts---
// ...
---FILE: src/features/dashboard/services/userService.ts---
// ...
---FILE: src/features/dashboard/components/UserProfileCard.tsx---
// ...
---FILE: src/features/dashboard/styles/UserProfileCard.module.css---
// ...
---FILE: src/features/dashboard/__tests__/UserProfileCard.test.tsx---
// ...
---FILE: src/features/dashboard/components/RecentActivityList.tsx---
// ...
---FILE: src/features/dashboard/components/forms/EditProfileForm.tsx---
// ...
---FILE: src/features/dashboard/__tests__/EditProfileForm.test.tsx---
// ...
---FILE: src/features/dashboard/components/DashboardLayout.tsx---
// ...
---FILE: src/features/dashboard/styles/Dashboard.module.css---
// ...
---FILE: src/features/dashboard/index.ts---
// ...
```

**Example Agent Output with Markers (Highly Abridged):**
```
---FILE: src/features/dashboard/types/user.ts---
export interface User { /* ... */ }
export interface Activity { /* ... */ }
---FILE: src/features/dashboard/services/userService.ts---
import { User, Activity } from '../types/user';
// ... mock functions ...
---FILE: src/features/dashboard/components/UserProfileCard.tsx---
import React from 'react';
import { User } from '../../types/user';
import styles from '../../styles/UserProfileCard.module.css';
// ... component code ...
---FILE: src/features/dashboard/styles/UserProfileCard.module.css---
/* ... styles ... */
---FILE: src/features/dashboard/__tests__/UserProfileCard.test.tsx---
import React from 'react';
import { render, screen } from '@testing-library/react';
import UserProfileCard from '../components/UserProfileCard';
// ... test code ...
---FILE: src/features/dashboard/components/RecentActivityList.tsx---
import React from 'react';
import { Activity } from '../../types/user';
// ... component code ...
---FILE: src/features/dashboard/components/forms/EditProfileForm.tsx---
import React, { useState } from 'react';
import { User } from '../../../types/user';
// ... form code ...
---FILE: src/features/dashboard/__tests__/EditProfileForm.test.tsx---
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EditProfileForm from '../components/forms/EditProfileForm';
// ... test code ...
---FILE: src/features/dashboard/components/DashboardLayout.tsx---
import React, { useEffect, useState } from 'react';
import { userService } from '../services/userService';
import { User, Activity } from '../types/user';
import UserProfileCard from './UserProfileCard';
import RecentActivityList from './RecentActivityList';
import EditProfileForm from './forms/EditProfileForm';
import styles from '../styles/Dashboard.module.css';
// ... layout code ...
---FILE: src/features/dashboard/styles/Dashboard.module.css---
/* ... styles ... */
---FILE: src/features/dashboard/index.ts---
export { default as DashboardLayout } from './components/DashboardLayout';
export { userService } from './services/userService';
export type { User, Activity } from './types/user';
```

**Extraction Command:**
1.  Save the agent's output to `dashboard_output.txt`.
2.  Run: `./extract_files.sh dashboard_output.txt`

**Expected Result:**
A complete `src/features/dashboard/` directory structure with all 11 files correctly placed, named, and containing their respective code.

**Time Saved Estimate:**
*   **Manual:** ~30-60 minutes (planning directory structure, creating 11 files, creating nested directories, copy-pasting code, fixing relative imports manually).
*   **Marker Technique:** ~15-20 seconds.
*   **Savings:** ~30-60 minutes per feature. This is a *massive* productivity boost for feature generation.

---

## 3. Combined Technique Mastery

This scenario demonstrates the synergy of providing senior-level guidance with the efficiency of multi-file marker output.

**Goal:** Implement a new "Shopping Cart" feature for an e-commerce application, including components, a state management service, types, and tests.

**Scenario:**
You are a senior frontend architect. The team needs a new Shopping Cart feature. It should allow users to add/remove items, view total, and persist cart state.

**Prompt Instruction (Combines Senior Guidance & Marker Instructions):**
```
You are a senior frontend architect tasked with implementing a new "Shopping Cart" feature for our React/TypeScript e-commerce application.
The feature needs to be robust, testable, and follow best practices for state management and component design.

**Senior Guidance & Requirements:**
1.  **Architecture:** Implement a simple, local state management service (`cartService.ts`) using a singleton pattern or simple exports, responsible for cart logic (add, remove, get items, get total, persist to localStorage). Components should interact with this service.
2.  **Component Design:**
    *   `CartPage.tsx`: The main page component, renders `CartItemList` and `CartSummary`.
    *   `CartItemList.tsx`: Displays individual cart items. Each item should have a remove button.
    *   `CartSummary.tsx`: Displays total items and total price.
3.  **Data Types:** Define clear TypeScript interfaces for `CartItem` and `Product`.
4.  **Persistence:** The `cartService` must persist the cart state to `localStorage` on every change and load it on initialization.
5.  **Error Handling:** Basic error handling for `localStorage` operations.
6.  **Testing:** Include Jest unit tests for `cartService.ts` and `CartItemList.tsx`.
7.  **Styling:** Use CSS Modules.

**Files to Generate (use marker technique):**
*   `src/features/cart/types.ts`
*   `src/features/cart/services/cartService.ts`
*   `src/features/cart/components/CartItemList.tsx`
*   `src/features/cart/components/CartSummary.tsx`
*   `src/features/cart/pages/CartPage.tsx`
*   `src/features/cart/styles/Cart.module.css` (for CartPage)
*   `src/features/cart/styles/CartItemList.module.css`
*   `src/features/cart/__tests__/cartService.test.ts`
*   `src/features/cart/__tests__/CartItemList.test.tsx`

---FILE: src/features/cart/types.ts---
// Your types content

---FILE: src/features/cart/services/cartService.ts---
// Your cart service content

---FILE: src/features/cart/components/CartItemList.tsx---
// Your CartItemList content

---FILE: src/features/cart/styles/CartItemList.module.css---
// Your CartItemList styles

---FILE: src/features/cart/__tests__/CartItemList.test.tsx---
// Your CartItemList test content

---FILE: src/features/cart/components/CartSummary.tsx---
// Your CartSummary content

---FILE: src/features/cart/pages/CartPage.tsx---
// Your CartPage content

---FILE: src/features/cart/styles/Cart.module.css---
// Your CartPage styles

---FILE: src/features/cart/__tests__/cartService.test.ts---
// Your cart service test content
```

**Agent's Response (Highly Abridged, but showing structure):**
```
---FILE: src/features/cart/types.ts---
export interface Product { /* ... */ }
export interface CartItem extends Product { quantity: number; }
---FILE: src/features/cart/services/cartService.ts---
import { CartItem, Product } from '../types';
// ... cart logic with localStorage persistence ...
// Uses a simple pub-sub for component updates
---FILE: src/features/cart/components/CartItemList.tsx---
import React from 'react';
import { CartItem } from '../types';
import styles from '../styles/CartItemList.module.css';
// ... component code ...
---FILE: src/features/cart/styles/CartItemList.module.css---
/* ... styles ... */
---FILE: src/features/cart/__tests__/CartItemList.test.tsx---
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CartItemList from '../components/CartItemList';
// ... test code ...
---FILE: src/features/cart/components/CartSummary.tsx---
import React from 'react';
import { CartItem } from '../types';
// ... component code ...
---FILE: src/features/cart/pages/CartPage.tsx---
import React, { useEffect, useState } from 'react';
import { cartService } from '../services/cartService';
import CartItemList from '../components/CartItemList';
import CartSummary from '../components/CartSummary';
import styles from '../styles/Cart.module.css';
// ... page component code ...
---FILE: src/features/cart/styles/Cart.module.css---
/* ... styles ... */
---FILE: src/features/cart/__tests__/cartService.test.ts---
import { cartService } from '../services/cartService';
// Mock localStorage
const localStorageMock = (() => { /* ... */ })();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });
// ... test code ...
```

**Full Extraction Workflow:**
1.  **Save Agent Output:** Copy the entire agent response (including all markers and code) into a file, e.g., `cart_feature.txt`.
2.  **Run Extraction Script:** Execute the previously defined `extract_files.sh` script:
    ```bash
    ./extract_files.sh cart_feature.txt
    ```
3.  **Review & Integrate:**
    *   Open the newly created `src/features/cart/` directory.
    *   Review each file for correctness, adherence to requirements, and potential improvements.
    *   Run tests: `npm test src/features/cart/__tests__/cartService.test.ts` and `npm test src/features/cart/__tests__/CartItemList.test.tsx`.
    *   Integrate `CartPage.tsx` into your application's routing.

**Real Metrics on Efficiency Gains:**
*   **Time to First Working Draft:**
    *   **Manual (Junior Approach):** Days of planning, coding, debugging, and refactoring. Likely 2-3 days for a feature of this complexity, including setting up tests and state management.
    *   **Combined Technique (Senior Agent):** 5-10 minutes for prompt creation + 1-2 minutes for agent generation + 30 seconds for extraction. **Total: ~15 minutes.**
*   **Quality of Output:**
    *   **Manual:** Highly variable, prone to architectural inconsistencies, bugs, and missing tests.
    *   **Combined Technique:** High-quality, well-structured, tested, and adheres to specified patterns (e.g., service-component separation, localStorage persistence).
*   **Iteration Count:**
    *   **Manual:** Countless internal iterations (developer thinking, coding, testing, debugging).
    *   **Combined Technique:** Typically 1-2 agent iterations for the core feature, followed by human fine-tuning.
*   **Token/Compute Savings (Indirect):** By getting a near-perfect first draft, the need for extensive human-agent feedback loops (which consume tokens and time) is drastically reduced. The agent's initial "thought" process is more efficient due to the detailed prompt, leading to less "exploratory" token usage.

**Overall Impact:** This combined approach transforms feature development from a multi-day, error-prone process into a rapid, high-quality scaffolding operation, allowing developers to focus on higher-level integration and business logic rather than boilerplate.

---

## 4. Common Pitfalls & Solutions

Task Agents, while powerful, can exhibit predictable weaknesses. Here are 5 common mistakes and practical solutions.

### 1. Not Providing Enough Context

**Mistake:** The agent generates generic code that doesn't fit the project's specific conventions, tech stack, or architectural patterns.

**Example:**
*   **Prompt:** "Create a user registration form."
*   **Agent Output:** A basic HTML form with inline JavaScript, or a React component without TypeScript, or using a different styling approach than the project.

**Solution:**
**Be a "Senior Developer" in your prompt.** Provide explicit details about:
*   **Role:** "You are a senior React developer..."
*   **Tech Stack:** "Use React, TypeScript, Tailwind CSS, and Formik."
*   **Architectural Patterns:** "Implement a service layer for API calls," "Use a Redux slice for state management," "Ensure component separation of concerns."
*   **Conventions:** "Follow our BEM naming convention for CSS classes," "Use `camelCase` for all variables."
*   **Existing Code/Context:** Attach relevant files (e.g., `tsconfig.json`, `package.json`, existing component examples) and instruct the agent to *analyze* them.

**Revised Prompt Example:**
```
You are a senior React developer. Create a user registration form component (`RegistrationForm.tsx`).
**Project Context:**
*   **Framework:** React (functional components)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS (apply classes directly)
*   **Form Management:** Use `react-hook-form` for form state and validation.
*   **API Integration:** Assume an `authService.ts` exists with a `register(data: RegisterData)` method.
*   **Error Handling:** Display validation errors below fields. Display a general error message for API failures.
*   **Success State:** Redirect to `/dashboard` on successful registration.
```

### 2. Forgetting Marker Instructions

**Mistake:** The agent outputs a single large block of code, even when multiple files were implicitly requested or would be logical. This forces manual parsing and file creation.

**Example:**
*   **Prompt:** "Generate a React component for a user profile and its CSS."
*   **Agent Output:** A single code block containing both JSX and CSS, or two separate code blocks without file names.

**Solution:**
**Explicitly state the marker format and desired file paths.** Include the markers in your prompt as a template.

**Revised Prompt Example:**
```
Generate a React `UserProfile` component and its corresponding CSS module.
Use the marker technique for outputting both files.

---FILE: src/components/UserProfile.tsx---
// Your UserProfile.tsx content here

---FILE: src/components/UserProfile.module.css---
// Your UserProfile.module.css content here
```
**Tip:** For complex scenarios, provide a list of *all* expected files with their markers at the end of the prompt.

### 3. Inconsistent File Paths

**Mistake:** The agent generates files with incorrect or inconsistent relative paths, leading to broken imports when extracted.

**Example:**
*   Agent generates `src/components/Button.tsx` but then in `src/pages/HomePage.tsx` it imports `../Button` instead of `../components/Button`.
*   Or it uses absolute paths like `@/components/Button` when the project doesn't have path aliases configured.

**Solution:**
**Provide a clear root context and consistent pathing examples.**
*   **Define the project root:** "Assume the project root is `/my-app/`."
*   **Specify full relative paths:** "All files should be relative to `src/`."
*   **Provide examples:** "For a component in `src/components/`, an import from `src/utils/` should be `../utils/myUtil`."
*   **Instruct on imports:** "Ensure all internal imports between generated files use correct relative paths."
*   **If using aliases:** "Our project uses path aliases. `@/components` maps to `src/components`. Use these aliases where appropriate."

**Revised Prompt Example:**
```
Generate the following files for a new `ProductDetail` feature.
All files should be placed under `src/features/product-detail/`.
Ensure all imports between these files use correct relative paths based on this structure.

---FILE: src/features/product-detail/ProductDetail.tsx---
import { Product } from '../types/product'; // Example of expected relative import
import { fetchProduct } from './services/productService'; // Example of expected relative import
// ...
```

### 4. Missing Attached Files / Ignoring Context

**Mistake:** The agent hallucinates code or ignores provided context files (e.g., a `schema.json`, an existing `api.ts` file), leading to incompatible or redundant output.

**Example:**
*   **Prompt:** "Refactor the attached `old_component.js` to use hooks."
*   **Agent Output:** Generates a new component from scratch, or makes changes that don't align with the provided `old_component.js`.

**Solution:**
**Explicitly instruct the agent to *use* the attached files and reference them.**
*   **Direct Instruction:** "Analyze the attached `schema.json` and generate TypeScript interfaces *based on it*."
*   **Reference in Prompt:** "Your task is to refactor the `legacyAuth.js` file provided. Do not generate new files unless explicitly requested. Focus on improving the *existing* code."
*   **Confirmation:** Ask the agent to confirm it has processed the attached files: "Before generating code, briefly summarize your understanding of `legacyAuth.js`." (This can be an initial prompt, then follow up with the main task).

**Revised Prompt Example:**
```
**Attached File: `existingApi.ts`**
```typescript
// existingApi.ts content
export const fetchUser = (id: string) => Promise<User>;
export const updateUser = (user: User) => Promise<User>;
```

**Prompt:**
```
You are a senior developer. Create a `UserProfilePage.tsx` component.
**Crucially, use the `fetchUser` and `updateUser` functions from the attached `existingApi.ts` for data fetching.**
Do not redefine these functions. Import them directly.
```

### 5. Poor Iteration Feedback

**Mistake:** When the agent's initial output is not perfect, the user provides vague feedback, leading to more suboptimal iterations.

**Example:**
*   **User:** "This isn't quite right. Fix it."
*   **Agent:** Makes arbitrary changes, potentially introducing new issues or missing the user's true intent.

**Solution:**
**Provide specific, actionable, and constructive feedback.** Treat the agent like a junior developer who needs clear instructions.
*   **Identify the specific issue:** "The `login` function doesn't handle network errors."
*   **Suggest a solution/approach:** "Add a `try...catch` block around the `fetch` call and throw a more descriptive error."
*   **Specify location:** "In `src/services/authService.ts`, modify the `login` function."
*   **Provide examples (if complex):** "For the `variant` prop, ensure the CSS class applied is `styles.variantName`."
*   **Prioritize:** "First, fix the input validation. Then, add JSDoc."

**Revised Feedback Example:**
```
Thanks for the initial `UserProfileCard.tsx`.
I have a few specific adjustments:
1.  **Styling:** The `avatar` image is too large. In `UserProfileCard.module.css`, reduce the `width` and `height` of `.avatar` to `80px`.
2.  **Accessibility:** Add an `alt` attribute to the `img` tag in `UserProfileCard.tsx` using `user.name` for the value.
3.  **Conditional Rendering:** If `user.email` is not provided, do not render the email paragraph.
4.  **Test Coverage:** In `UserProfileCard.test.tsx`, add a test case to verify that the email is not rendered when `user.email` is null.

Please provide the updated `UserProfileCard.tsx`, `UserProfileCard.module.css`, and `UserProfileCard.test.tsx` using the marker technique.
```