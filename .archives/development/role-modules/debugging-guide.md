# Debugging Guide for Tales of Claude Agents

This guide is for all bug fixer agents in Tales of Claude. It provides an immediately actionable framework for diagnosing and resolving issues efficiently within our codebase.

---

## 1. The Debugging Mindset & Workflow

Before diving into code, adopt a systematic approach.

1.  **Type-Check First! (`tsc --noEmit`)**
    *   **Always** run `tsc --noEmit` or rely on your IDE's TypeScript integration *before* attempting a fix or even running the app.
    *   **Why?** Many "runtime" errors are caught by TypeScript. Our codebase uses `strict` mode, meaning `null` and `undefined` checks are crucial. A common issue is attempting to access properties on potentially `null` or `undefined` values. Address these type errors first; they often reveal the root cause.
    *   *Action:* Look for `TS2532: Object is possibly 'undefined'`, `TS2345: Argument of type 'X' is not assignable to parameter of type 'Y'`, etc.

2.  **Reproduce the Bug:**
    *   Can you reliably make the bug happen? What are the exact steps?
    *   If not, you can't confirm a fix. Document the reproduction steps clearly.

3.  **Isolate the Problem:**
    *   Where in the code does the error occur? Use browser developer tools (console, network, elements, debugger), `console.log`, or your IDE's debugger.
    *   Comment out unrelated code, simplify inputs, or narrow down the scope to pinpoint the exact line or component.

4.  **Formulate a Hypothesis:**
    *   Based on your observations, what do you *think* is causing the bug?
    *   Example: "The component isn't re-rendering because the prop isn't changing," or "The API call is failing due to incorrect parameters."

5.  **Test Your Hypothesis (Implement a Fix):**
    *   Apply your proposed solution. This is where the compile-fix loop comes in.

6.  **Verify the Fix:**
    *   Does the original bug no longer occur?
    *   Did you introduce any *new* bugs (regressions)? (See Section 6).

---

## 2. Common Error Patterns & Fixes

Familiarize yourself with these frequent culprits:

### 2.1 TypeScript Strict Mode Issues

Our `tsconfig.json` enforces `strict` mode, which is excellent for catching errors early but requires careful coding.

*   **`null`/`undefined` Checks:** You *must* explicitly handle cases where a variable or property might be `null` or `undefined`.
    *   `if (myVar) { myVar.property; }`
    *   `myVar?.property` (optional chaining)
    *   `myVar ?? 'default'` (nullish coalescing)
*   **Type Assertions (`as any`, `!`)**: Use `as any` or the non-null assertion operator (`!`) *sparingly* and only when you are absolutely certain about the type, as they bypass TypeScript's checks. Prefer proper type narrowing.
*   **Missing Properties:** Ensure objects conform to their defined interfaces/types. If a property is optional, handle its absence.

### 2.2 React Hooks Rules

React Hooks have strict rules that, if violated, can lead to subtle and hard-to-debug issues.

*   **Hooks Must Come Before Conditionals:**
    *   **Discovery:** "React hooks must come before conditionals." This is critical. You *cannot* call `useState`, `useEffect`, `useMemo`, `useCallback`, etc., inside `if` statements, loops, or nested functions.
    *   **Why?** React relies on the consistent order of Hook calls across renders to correctly associate state with specific `useState` calls. Conditional calls break this order.
    *   *Fix:* Move Hook calls to the top level of your functional component. Use conditionals *inside* the Hook's callback (e.g., inside `useEffect`'s body).
*   **Dependency Arrays (`useEffect`, `useMemo`, `useCallback`):**
    *   Ensure all values from the component scope used within a Hook (that aren't state setters or stable functions) are included in its dependency array.
    *   Missing dependencies cause stale closures or incorrect re-runs.
    *   Excessive dependencies cause unnecessary re-renders/re-calculations.

### 2.3 CSS Modules Quirks

We use CSS Modules for scoped styling.

*   **`composes` Only Works with Simple Selectors:**
    *   **Discovery:** "CSS modules `composes` only works with simple selectors." This means you can't `composes` from a class that's part of a complex selector (e.g., `div > .myClass`, `.myClass:hover`, `.myClass + .anotherClass`).
    *   *Fix:* Ensure the class you are composing from is a standalone class selector (e.g., `.baseButton`). If you need to apply styles from a complex selector, you might need to duplicate or refactor your CSS.
*   **Global vs. Local Scope:** Remember that `.module.css` files are locally scoped by default. Use `:global()` to apply styles globally if absolutely necessary.

### 2.4 Asynchronous Operations

*   **Unhandled Promises:** Always `await` promises or attach `.catch()` handlers to prevent unhandled promise rejections.
*   **Race Conditions:** Be aware of multiple async operations completing in an unexpected order. Use cleanup functions in `useEffect` or state to manage pending requests.
*   **Loading States & Error Handling:** Ensure your UI correctly reflects loading states and displays appropriate error messages for failed API calls.

---

## 3. The Compile-Fix Loop with Delegate

Our development environment supports rapid iteration.

1.  **Make a Change:** Implement your proposed fix in the code.
2.  **Observe:**
    *   **Hot Module Reloading (HMR):** For most component-level changes, HMR will automatically update your browser without a full refresh.
    *   **Full Refresh:** For changes to global styles, routing, or certain configuration files, you might need to manually refresh the browser (Ctrl+R / Cmd+R).
    *   **Multiple Dev Servers:**
        *   **Discovery:** "Multiple dev servers on ports 5173-5175." Be aware that different parts of the application or different feature branches might be running on distinct ports. Ensure you are checking the correct instance of the application for your changes.
        *   Confirm which port your current `npm run dev` instance is using.
3.  **Delegate System:** Our internal `delegate` system allows you to quickly test changes by deploying them to a staging environment or specific test instances. Learn how to use it to push your fixes for broader testing without a full release. This is crucial for verifying fixes in a production-like environment.

---

## 4. Common Gotchas

*   **Stale Browser Cache:** Often, a bug persists because your browser is serving an old version of the code. **Always try a hard refresh (Ctrl+Shift+R or Cmd+Shift+R)** or clear your browser cache if changes aren't appearing.
*   **Incorrect Environment Variables:** Ensure `.env` files are correctly configured and variables are accessed properly (e.g., `import.meta.env.VITE_API_URL`).
*   **Misunderstanding Component Lifecycle:** For complex interactions, ensure you understand when components mount, update, and unmount, and how state/props changes trigger re-renders.

---

## 5. Where to Find Previous Fixes

Don't reinvent the wheel. Leverage our existing knowledge base.

*   **Version Control (Git):**
    *   `git log -S "error message"`: Search commit messages and code changes for specific error messages or keywords.
    *   `git blame <file>`: See who last modified a line and in which commit, providing context.
*   **Issue Tracker (Jira/Linear/etc.):** Search for similar bug reports by keywords, error messages, or affected components. Often, a bug has been encountered and fixed before.
*   **Codebase Search:** Use your IDE's global search (Ctrl+Shift+F / Cmd+Shift+F) for error messages, function names, or problematic patterns you've identified.

---

## 6. Testing Fixes Properly

A fix isn't complete until it's thoroughly tested.

1.  **Reproduce Original Bug:** Confirm the original bug is gone.
2.  **Regression Testing:** Check related functionalities and areas of the application that might be affected by your change. Did your fix break something else?
3.  **Edge Cases:** Test boundary conditions (e.g., empty inputs, very long strings, zero values, maximum limits).
4.  **Code Review:** Submit your fix for code review. A second pair of eyes can catch issues you missed and ensure code quality.

---

By following this guide, you'll be well-equipped to tackle bugs efficiently and contribute to the stability and quality of Tales of Claude. Happy debugging!