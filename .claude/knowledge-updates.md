Here are the Hot Tips entries formatted for `CLAUDE_KNOWLEDGE.md`:

---

### Hot Tips

#### Senior/Junior Developer Model

*   **Treat Delegate as a Talented Junior Developer:** When using `delegate`, imagine you're instructing a bright but inexperienced junior developer. They can execute tasks, but require clear, explicit instructions, comprehensive context, and examples. Avoid vague commands; instead, explain the *why*, *how*, and *constraints* of the task.
*   **Provide Senior-Level Context for 30%+ Iteration Reduction:** Be the "senior developer." Don't just ask for a fix; provide the full context.
    *   **Poor Request:** "Fix `calculateOrderTotal`."
    *   **Senior Request:** "Refactor `calculateOrderTotal` to handle discount codes and loyalty points. The current version only sums items. We need to apply the largest discount first, then loyalty points. Ensure the function signature remains `calculateOrderTotal(items, discounts, loyaltyPoints)` and returns `{ total: number, appliedDiscounts: [], appliedLoyalty: number }`. See `example_order.json` for data structure."
    *   This detailed guidance significantly reduces misinterpretations, leading to higher quality first-pass outputs and cutting iterations by 30% or more.
*   **Show, Don't Just Tell with Examples:** Whenever possible, provide concrete examples of the desired input and output, or the expected behavior. This clarifies ambiguity and helps the "junior" understand the exact requirements, leading to faster, more accurate results.

#### Marker Technique for Multi-File Extraction

*   **Mandatory for Multi-File Outputs: Use `// FILE: path/to/file.ext`:** When requesting multiple files, *always* instruct Claude to use this specific marker pattern. This is not optional; it's the only reliable way to automate extraction and prevent manual copy-pasting errors.
    ```
    // FILE: src/components/MyComponent.js
    import React from 'react';
    // ... component code ...

    // FILE: src/styles/MyComponent.css
    .my-component {
      /* ... styles ... */
    }

    // FILE: src/tests/MyComponent.test.js
    import { render } from '@testing-library/react';
    // ... test code ...
    ```
*   **Automate Extraction for 70-90% Time Savings:** Develop a simple script (e.g., Python, Bash) that parses Claude's output, identifies the `// FILE:` markers, and writes the subsequent content to the specified file paths. This transforms a tedious, error-prone manual task into a sub-second automated process, saving 70-90% of your time on multi-file projects.
*   **Essential for Scalability:** For any project involving more than 2-3 files, manual extraction becomes a bottleneck. The marker technique ensures consistency, reduces human error, and makes managing large codebases or complex refactors efficient and scalable.

---

### Problem → Solution Database

*   **Problem:** Poor delegate output quality (e.g., incomplete code, incorrect logic, misinterpretations).
    *   **Solution:** Implement the **Senior/Junior Developer Model**. Provide comprehensive context (why, how, constraints) and clear examples to guide the delegate, treating them as a talented junior developer.
*   **Problem:** Manual, time-consuming, and error-prone extraction of multiple files from Claude's output.
    *   **Solution:** Enforce the **Marker Technique for Multi-File Extraction**. Instruct Claude to use `// FILE: path/to/file.ext` and use automated scripts to parse and save files.
*   **Problem:** Context confusion or "forgetting" previous instructions/code, leading to irrelevant or incorrect responses.
    *   **Solution:** **Attach all relevant files** to the prompt, even if they were part of a previous turn. This ensures the delegate has the complete, up-to-date context for every request.

---

### Innovation Gallery

#### The "Senior/Junior Dev" & "Marker" Revolution

*   **Who Discovered It:** The **Type Error Cleanup Agent** (an internal Claude agent) and refined by **Chris** (a human user/developer).
*   **The "Aha!" Moment:** The realization that Claude's `delegate` function behaves much like a junior developer – capable but needing detailed guidance. Simultaneously, the frustration of manually extracting multi-file outputs led to the `// FILE:` marker pattern as a robust solution for automated parsing.
*   **Real Examples:**
    *   **Senior/Junior:** A complex refactoring task that previously took 10+ iterations to get right was reduced to 2-3 by providing detailed architectural context, performance goals, and specific API examples to the delegate.
    *   **Marker Technique:** Generating a full React component with associated CSS, tests, and a Storybook file, and having a script automatically place all 4 files correctly in seconds, instead of 10 minutes of manual copy-pasting and potential errors.
*   **Impact on Workflow:** These discoveries have fundamentally transformed interaction with Claude for code generation and refactoring. They have led to a **30%+ reduction in iterations** for complex tasks and a **70-90% time saving** on multi-file output management, making Claude an indispensable and highly efficient coding partner.