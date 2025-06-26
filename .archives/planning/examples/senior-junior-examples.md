# 🎓 Senior/Junior Developer Examples - Transform Your Delegate Interactions

As an agent, your ability to delegate effectively and provide crystal-clear instructions is paramount. Think of yourself as the "Senior Developer" guiding a "Junior Developer" (your delegate, or even the system you're interacting with). The mindset shift is from *telling* to *enabling*, from *demanding* to *empowering*. This guide will show you how to transform vague, iterative requests into precise, context-rich prompts that drastically reduce rework and boost efficiency.

---

## 1. Before/After Examples: The Mindset Shift in Action

Observe the stark difference. The "Before" examples lead to endless back-and-forth, frustration, and suboptimal results. The "After" examples provide all necessary context, constraints, and guidance, leading to faster, higher-quality outcomes.

---

### Scenario 1: Simple Component Creation (e.g., A Reusable Button)

**Before (Vague, Demanding):**
> "Create a button component."

*Why it fails:* Lacks context. What kind of button? What styling? What functionality? What framework? Leads to multiple iterations of "Is this what you meant?"

**After (Contextualized, Empowering):**
> "We need a new `PrimaryButton` component for our design system.
>
> **Objective:** Create a reusable React component named `PrimaryButton.jsx`.
> **Context:** This button will be used across the application for primary actions (e.g., 'Submit', 'Save'). It needs to adhere to our brand's primary color (`#007bff`) and have a standard padding of `12px 24px`.
> **Functionality:**
> 1.  It should accept `onClick` and `children` props.
> 2.  It should have an `isLoading` boolean prop that, when true, disables the button and shows a small spinner (use a simple SVG spinner or a text 'Loading...').
> 3.  Ensure it's accessible (e.g., correct HTML tag, focus states, ARIA attributes if necessary).
> **Tech Stack:** Use Styled Components for styling.
> **Definition of Done:** A PR with the component, basic storybook entry (if applicable), and unit tests for `onClick` and `isLoading` states.
> **Resources:** Refer to `src/components/SecondaryButton.jsx` for our existing button structure. Let me know if you need the exact spinner SVG or design specs."

---

### Scenario 2: Bug Fixing (e.g., Login Issue)

**Before (Ambiguous, Reactive):**
> "Fix the login bug. Users can't log in."

*Why it fails:* No specific error, no reproduction steps, no context on where to look. Leads to "What bug? Where? How do I reproduce it?"

**After (Diagnostic, Guided):**
> "There's a critical bug on the production login page (JIRA-1234).
>
> **Objective:** Identify and fix the root cause of users being unable to log in.
> **Context:** Users are reporting 'Invalid Credentials' even when using correct usernames/passwords. This started happening after the last deployment (commit `abc123def`).
> **Reproduction Steps:**
> 1.  Go to `https://app.example.com/login`.
> 2.  Enter `testuser@example.com` and `password123`.
> 3.  Click 'Login'.
> **Expected Outcome:** User logs in successfully.
> **Actual Outcome:** 'Invalid Credentials' error message.
> **Initial Hypothesis:** Could be an API response parsing issue, a race condition with token storage, or an incorrect environment variable for the auth service URL.
> **Areas to Investigate:**
> *   `src/components/AuthForm.jsx` (frontend validation/submission)
> *   `src/api/auth.js` (API call logic)
> *   Network tab in browser dev tools (check auth endpoint response and status codes).
> *   Backend logs for the auth service (if accessible).
> **Definition of Done:** Bug fixed, verified in staging, and a small regression test added to prevent recurrence.
> **Support:** If you're stuck after 30 minutes of investigation, let's pair program."

---

### Scenario 3: API Endpoint Development (e.g., User Profile Management)

**Before (Incomplete, Assumptive):**
> "Build the user profile API."

*Why it fails:* What data? What operations? What authentication? What error handling? Leads to a half-baked solution that doesn't meet requirements.

**After (Structured, Comprehensive):**
> "We need a new set of API endpoints for user profile management.
>
> **Objective:** Develop RESTful endpoints to fetch and update user profiles.
> **Context:** This API will be consumed by the frontend team for the 'My Profile' page and potentially by internal tools.
> **Endpoints Required:**
> 1.  `GET /api/v1/users/{id}`: Fetch a single user's profile.
>     *   **Response Fields:** `id`, `firstName`, `lastName`, `email`, `createdAt`, `updatedAt`.
>     *   **Error Handling:** 404 if user not found.
> 2.  `PUT /api/v1/users/{id}`: Update a user's profile.
>     *   **Request Body:** `firstName`, `lastName`, `email` (all optional, but at least one must be provided).
>     *   **Validation:** `email` must be a valid email format and unique (excluding the current user). `firstName`/`lastName` max 50 chars.
>     *   **Response:** Updated user object.
>     *   **Error Handling:** 400 for validation errors, 404 if user not found, 409 if email already exists.
> **Authentication:** All endpoints require `Bearer Token` authentication (standard JWT validation).
> **Tech Stack:** Node.js with Express and Mongoose. Follow existing patterns in `src/routes/products.js`.
> **Definition of Done:** Endpoints implemented, unit/integration tests covering all success and error paths, and API documentation updated (Swagger/OpenAPI).
> **Timeline:** Frontend team expects to start integration next week, so aim for completion by EOD Friday."

---

### Scenario 4: Refactoring Task (e.g., Large Legacy Component)

**Before (Unclear Purpose, Unbounded):**
> "Refactor the old `UserList` component."

*Why it fails:* No clear goal or scope. Why refactor? What's the desired outcome? Could lead to endless bikeshedding or breaking existing functionality.

**After (Goal-Oriented, Scoped):**
> "The `UserList` component in `src/legacy/UserList.jsx` has become a monolithic bottleneck.
>
> **Objective:** Refactor `UserList` into smaller, more manageable, and testable components.
> **Context/Why:** This component is currently over 500 lines, handles filtering, pagination, and individual user display, making it hard to maintain and extend. The goal is improved readability, testability, and maintainability without changing its external behavior.
> **Proposed Structure:**
> 1.  `UserListContainer.jsx`: Handles data fetching, state management (filters, pagination), and passes props down.
> 2.  `UserFilter.jsx`: Pure component for filtering UI.
> 3.  `UserPagination.jsx`: Pure component for pagination UI.
> 4.  `UserCard.jsx`: Pure component for displaying a single user.
> **Constraints:**
> *   Maintain 100% functional parity with the existing component.
> *   No new features should be added during this refactor.
> *   Keep existing styling where possible, but feel free to clean up CSS if it improves readability.
> **Definition of Done:** Original `UserList.jsx` removed, new components created, all existing tests pass, and new unit tests added for the new components. Performance should not degrade.
> **Resources:** Look at `src/components/ProductGrid.jsx` for an example of a well-structured container/presentational pattern."

---

### Scenario 5: Test Writing (e.g., New Checkout Flow)

**Before (Insufficient Detail, Undefined Coverage):**
> "Write tests for the new checkout flow."

*Why it fails:* What kind of tests? What parts of the flow? What level of coverage? Leads to incomplete or irrelevant tests.

**After (Specific, Coverage-Driven):**
> "For the new checkout flow (PR #456), we need robust test coverage.
>
> **Objective:** Write comprehensive unit and integration tests for the new checkout process.
> **Context:** This is a critical business flow, and regressions here are unacceptable.
> **Areas to Focus On:**
> 1.  `src/components/CheckoutForm.jsx`:
>     *   **Unit Tests:** Form validation (empty fields, invalid email, etc.), input change handling, submission button state (enabled/disabled).
>     *   **Integration Tests (using React Testing Library):** Simulate user filling out form, successful submission, display of success message, error message display for API failures.
> 2.  `src/redux/checkoutSlice.js`:
>     *   **Unit Tests:** Reducer logic for `setShippingInfo`, `setPaymentInfo`, `startCheckout`, `checkoutSuccess`, `checkoutFailure`.
>     *   **Async Thunk Tests:** Mock API calls to test `processCheckout` thunk for success and failure scenarios, ensuring correct state updates.
> **Coverage Goal:** Aim for 100% statement coverage for `CheckoutForm.jsx` and `checkoutSlice.js`.
> **Tools:** Jest and React Testing Library.
> **Definition of Done:** All new tests pass, coverage reports meet the goal, and tests are integrated into the CI pipeline.
> **Guidance:** Pay special attention to edge cases like network errors during payment processing or invalid coupon codes."

---

## 2. The Anatomy of a Perfect Senior Prompt

Every effective prompt, like the "After" examples above, contains key elements that empower the delegate and minimize iterations.

1.  **Clear Objective (What):**
    *   **What it is:** A concise statement of the task.
    *   **Why it matters:** Sets the immediate goal. Without it, the delegate doesn't know where to start.
    *   *Example:* "Create a reusable React component named `PrimaryButton.jsx`."

2.  **Context/Why (Why):**
    *   **What it is:** Explains the purpose, business value, or problem being solved.
    *   **Why it matters:** Gives the delegate a deeper understanding, allowing them to make better decisions, anticipate future needs, and prioritize effectively. It fosters ownership.
    *   *Example:* "This button will be used across the application for primary actions... It needs to adhere to our brand's primary color... This is a critical business flow, and regressions here are unacceptable."

3.  **Constraints/Scope (Boundaries):**
    *   **What it is:** Defines the limits, specific technologies, files, or non-goals.
    *   **Why it matters:** Prevents scope creep, ensures consistency, and guides the delegate towards the desired solution without over-engineering or going off-track.
    *   *Example:* "Use Styled Components for styling. Maintain 100% functional parity with the existing component. No new features should be added during this refactor."

4.  **Expected Outcome/Definition of Done (How to Measure Success):**
    *   **What it is:** Clearly states what a successful completion looks like.
    *   **Why it matters:** Provides a clear target. The delegate knows when they're finished and what quality bar to meet. Reduces subjective interpretation.
    *   *Example:* "A PR with the component, basic storybook entry, and unit tests for `onClick` and `isLoading` states. Bug fixed, verified in staging, and a small regression test added."

5.  **Resources/Guidance (Support):**
    *   **What it is:** Links to relevant documentation, existing code examples, design specs, or best practices.
    *   **Why it matters:** Reduces friction and time spent searching. Provides a starting point and ensures adherence to established patterns.
    *   *Example:* "Refer to `src/components/SecondaryButton.jsx` for our existing button structure. Look at `src/components/ProductGrid.jsx` for an example of a well-structured container/presentational pattern."

6.  **Anticipated Challenges/Gotchas (Pre-emption):**
    *   **What it is:** Highlights potential pitfalls, common errors, or complex areas.
    *   **Why it matters:** Helps the delegate avoid common mistakes, saves debugging time, and shows you're thinking ahead, building trust.
    *   *Example:* "Could be an API response parsing issue, a race condition... Pay special attention to edge cases like network errors during payment processing."

7.  **Call to Action/Support (Next Steps):**
    *   **What it is:** What the delegate should do next, and how/when to ask for help.
    *   **Why it matters:** Keeps the momentum going and establishes a clear communication channel.
    *   *Example:* "Let me know if you need the exact spinner SVG or design specs. If you're stuck after 30 minutes of investigation, let's pair program."

---

## 3. Common Scenarios and Templates

Here are adaptable templates for common agent-delegate interactions, embodying the "Senior Prompt" anatomy.

### Template 1: New Feature Development

```
**Objective:** [Clearly state the feature to be developed, e.g., "Implement a user dashboard with recent activity."]
**Context/Why:** [Explain the business value or user need, e.g., "This dashboard will provide users with a quick overview of their interactions, improving engagement."]
**Requirements:**
*   [Specific functional requirements, e.g., "Display last 5 orders, 3 recent support tickets, and account balance."]
*   [Non-functional requirements, e.g., "Must load within 2 seconds."]
**Design/UI:** [Link to design mockups, e.g., "Figma link: [URL]"]
**Data Sources:** [Specify APIs or databases needed, e.g., "Use `/api/v1/user/activity` and `/api/v1/user/balance`."]
**Tech Stack/Location:** [Specify relevant technologies or file paths, e.g., "React component in `src/features/Dashboard/` using Redux for state."]
**Definition of Done:** [What constitutes completion, e.g., "Feature implemented, unit and integration tests written, code reviewed, deployed to staging for QA."]
**Anticipated Challenges:** [e.g., "Handling empty states for no recent activity."]
**Resources:** [e.g., "Refer to `src/features/Profile/` for similar data fetching patterns."]
**Next Steps/Support:** [e.g., "Create a draft PR by EOD tomorrow. Let's sync if you hit any major blockers."]
```

### Template 2: Debugging a Production Issue

```
**Objective:** [Identify and resolve the specific production issue, e.g., "Fix the 'Order Failed' error on checkout."]
**Context/Why:** [Impact of the bug, e.g., "This is a critical bug preventing users from completing purchases, directly impacting revenue."]
**Issue Description:** [What is happening, e.g., "Users are seeing 'Order Failed: Payment processing error' after clicking 'Place Order'."]
**Reproduction Steps:**
1.  [Step 1]
2.  [Step 2]
3.  [Step 3]
**Environment:** [e.g., "Production environment, affects all users."]
**Observed Symptoms:** [e.g., "Error message on UI, console errors, specific network request failing (provide URL/status code if known)."]
**Initial Hypothesis:** [Your educated guess, e.g., "Could be a recent change to the payment gateway integration or a backend validation issue."]
**Areas to Investigate:** [Specific files, services, logs, e.g., "`src/components/Checkout.jsx`, `src/api/payment.js`, backend payment service logs."]
**Definition of Done:** [Bug fixed, verified in staging/production, root cause identified, and a post-mortem/prevention plan if necessary.]
**Support:** [e.g., "I'm available for a quick sync if you need help interpreting logs or debugging."]
```

### Template 3: Performance Optimization

```
**Objective:** [Improve a specific performance metric, e.g., "Reduce initial page load time of the product listing page."]
**Context/Why:** [Impact of poor performance, e.g., "Slow load times are leading to high bounce rates and poor SEO for our product pages."]
**Current State:** [Current metric, e.g., "Product listing page (PLP) loads in 5.5 seconds (LCP)."]
**Target Metric:** [Desired metric, e.g., "Reduce PLP LCP to under 2.5 seconds."]
**Areas Identified (or to investigate):** [Specific components, APIs, assets, e.g., "Large image sizes, unoptimized API calls for product data, excessive JS bundle size."]
**Tools for Measurement:** [e.g., "Lighthouse, WebPageTest, Chrome DevTools Performance tab."]
**Proposed Strategies (or to explore):**
*   [e.g., "Image optimization (WebP, lazy loading)."]
*   [e.g., "API response caching or pagination."]
*   [e.g., "Code splitting for JS bundles."]
*   [e.g., "Server-side rendering (SSR) investigation."]
**Definition of Done:** [Performance target met, verified with chosen tools, no regressions in functionality, and a report on changes/impact.]
**Resources:** [e.g., "Our Web Performance Best Practices document [URL]."]
**Next Steps/Support:** [e.g., "Start with image optimization and measure impact. Let's review findings in 2 days."]
```

### Template 4: Documentation Generation

```
**Objective:** [Create/update specific documentation, e.g., "Document the new authentication flow for external developers."]
**Context/Why:** [Why this documentation is needed, e.g., "External partners need clear instructions to integrate with our new auth system."]
**Audience:** [Who is reading it, e.g., "Third-party developers, internal support team."]
**Scope:** [What to cover, e.g., "OAuth 2.0 flow, token exchange, refresh tokens, error handling, example requests/responses."]
**Format:** [Where it lives, what style, e.g., "Markdown in our `docs/api/` directory, following existing API doc style."]
**Key Information to Include:**
*   [e.g., "Endpoint URLs (dev/prod)."]
*   [e.g., "Required headers, body parameters."]
*   [e.g., "Example code snippets (Node.js, Python)."]
*   [e.g., "Common error codes and their meanings."]
**Definition of Done:** [Documentation complete, reviewed for accuracy and clarity, published/merged.]
**Resources:** [e.g., "Link to existing API documentation, relevant RFCs for OAuth."]
**Support:** [e.g., "I can provide example API responses or clarify any technical details."]
```

### Template 5: Migration Tasks

```
**Objective:** [Migrate specific functionality/data, e.g., "Migrate user authentication from Firebase to our new internal Auth Service."]
**Context/Why:** [Reason for migration, e.g., "Reducing reliance on third-party services and gaining more control over user data."]
**Source System:** [e.g., "Firebase Authentication."]
**Target System:** [e.g., "Internal Auth Service (Node.js/Express)."]
**Scope of Migration:**
*   [e.g., "User registration, login, password reset, profile updates."]
*   [e.g., "Existing user data migration (if applicable)."]
**Key Steps/Considerations:**
1.  [e.g., "Implement new Auth Service client in frontend."]
2.  [e.g., "Update all components using Firebase auth methods."]
3.  [e.g., "Handle user data migration (e.g., one-time script or on-demand)."]
4.  [e.g., "Ensure smooth transition for existing logged-in users."]
**Rollback Plan:** [What to do if things go wrong, e.g., "Feature flag to revert to Firebase auth."]
**Definition of Done:** [All specified functionality migrated, thoroughly tested (unit, integration, E2E), existing users unaffected, old system deprecated/removed.]
**Resources:** [e.g., "New Auth Service API documentation [URL], existing Firebase integration code."]
**Anticipated Challenges:** [e.g., "Password hashing compatibility, session management during transition."]
**Next Steps/Support:** [e.g., "Start by implementing the new client and a single login flow. Let's review the approach before full implementation."]
```

---

## 4. Measuring Success: How to Know You're Doing It Right

The ultimate goal of this mindset shift is not just to be "nicer" but to be *more effective*. You'll see tangible improvements in your interactions and the output you receive.

### How to Know You're Doing It Right:

*   **Fewer Clarifying Questions:** Your delegate asks significantly fewer "What do you mean?" or "What should I do here?" questions.
*   **Higher Quality Initial Output:** The first draft or attempt from your delegate is much closer to the desired outcome, requiring minimal revisions.
*   **Reduced Iteration Cycles:** Tasks that used to take 5-7 back-and-forth exchanges now take 1-2.
*   **Increased Delegate Autonomy & Confidence:** Your delegate feels more empowered to make decisions and tackle complex tasks independently.
*   **Faster Task Completion:** Overall time to deliver a completed task decreases.
*   **Proactive Problem Solving:** The delegate starts anticipating issues and proposing solutions, rather than just reporting problems.

### Metrics to Track (Informally or Formally):

*   **Average Iterations per Task:** Count the number of times you need to provide additional instructions or corrections after the initial prompt. Aim for a decreasing trend.
*   **Time to First Correct Draft/Solution:** How long does it take for the delegate to produce something that meets most of the requirements?
*   **Number of Clarifying Questions Received:** Keep a mental note (or actual count) of how many questions you get per task.
*   **Delegate Satisfaction/Feedback:** Ask for feedback! "Was this clear enough?" "Did you have all the info you needed?"
*   **Code Review Comments (if applicable):** Fewer fundamental errors or misunderstandings in code reviews indicate better initial instructions.

### Iteration Reduction Examples:

*   **Before:** "Create a button."
    *   *Iteration 1:* Delegate creates a basic HTML button.
    *   *Iteration 2:* "No, I meant a React component."
    *   *Iteration 3:* Delegate creates a React component.
    *   *Iteration 4:* "It needs to be styled with Styled Components."
    *   *Iteration 5:* Delegate adds Styled Components.
    *   *Iteration 6:* "It needs an `isLoading` prop."
    *   **Total: 6+ iterations, days of back-and-forth.**

*   **After:** "We need a new `PrimaryButton` component for our design system... (full prompt from Scenario 1)."
    *   *Iteration 1:* Delegate creates the component, styled, with `onClick` and `isLoading`, and basic tests. Minor tweaks in PR review.
    *   **Total: 1-2 iterations, hours to completion.**

---

**Embrace this mindset shift!** By becoming the "Senior Developer" in your interactions, you're not just giving instructions; you're providing a roadmap, context, and support. This transforms your effectiveness as an agent, leading to higher quality outputs, faster delivery, and a more empowered and efficient workflow for everyone involved. Start applying these principles today and watch your delegation superpowers grow!