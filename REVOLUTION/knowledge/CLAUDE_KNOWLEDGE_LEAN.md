# 🧠 CLAUDE_KNOWLEDGE.md - Streamlined Quick Reference

This guide provides critical patterns and solutions to save tokens, prevent errors, and optimize agent performance. Scan it before starting any task.

## 🚀 Delegate Communication & Token Efficiency

*   **Context is King:** Always attach ALL relevant files (`files=["..."]`) to delegate calls. Show, don't just tell.
*   **Mentorship Mindset:** Treat delegate as a talented junior dev. Provide the "why," full context, and clear success criteria.
*   **Iterative Design:** Generate design documents *before* implementation. Then, implement based on the design.
*   **Multi-File Generation:** Instruct delegate to use `FILE:path/to/file.ext` and `END FILE:path/to/file.ext` markers. Use an extraction script.
*   **Large Output Handling:** For large file generation, use `delegate_invoke(prompt, write_to="output.txt")` to save tokens.
*   **Strategic Bundling:** For analyzing large documentation (e.g., 4.3MB), bundle logically by topic or use `find src -name "*.ts" | xargs cat > bundle.tmp`.
*   **Snippet Extraction:** To get specific code, use `grep -n "funcName" file.ts` to find line numbers, then `sed -n 'startLine,endLinep' file.ts`.
*   **Optimal Timeouts:** Use 400-600s for creative or complex tasks. Agents don't experience the wait.

## 🐛 Common Bug Fixes & Code Patterns

*   **React Hooks Order:** All `use*` hooks must be at the top level of a component, before any conditional logic or early returns.
*   **CSS Modules `composes`:** The `composes` keyword only works with simple class names, not complex selectors or nested rules.
*   **Defensive Coding:** Always check for `undefined` or `null` before destructuring objects or accessing properties (e.g., `info || defaultInfo`).
*   **Floor Tile Rendering:** Floor tiles should use pure background colors (`backgroundColor`), with no emoji content. Use 50% opacity for visual hierarchy.
*   **Multi-Tile Structures:** For elements spanning multiple grid cells, use CSS Grid properties like `gridColumnEnd: span X` and `gridRowEnd: span Y`.
*   **Conditional React Props:** Add props conditionally using the pattern: `{...(!isNaN(val) && { 'data-attr': val })}` to avoid errors.
*   **Tile ID Mapping:** JSON maps use numeric IDs for tiles. Ensure a `Record<number, TileType>` mapping exists for rendering.
*   **State Serialization:** Convert `Map` and `Set` objects to plain arrays or objects before JSON serialization for persistence.
*   **Browser File Access:** In browser environments, use `fetch()` or similar APIs for file access, not Node.js `fs` module.
*   **TypeScript as Guide:** Treat TypeScript errors as breadcrumbs. They often directly point to the underlying logical or structural issue.
*   **Test-Driven Debugging:** If tests are failing, first verify the tests themselves are correct, then debug the code.
*   **Component Integration:** If a UI component isn't rendering, first check its integration points (parent component, props), not just the component itself.
*   **Circular Dependencies:** For complex systems (e.g., quests), use a central registration pattern to manage dependencies and avoid circular imports.
*   **Optional Properties:** For flexible data structures (e.g., NPCs with optional faction IDs), use optional properties (`factionId?: string`).

## 🛠️ Workflow & Tooling Tips

*   **Kill Stale Dev Servers:** If ports 5173-5175 are occupied, kill stale processes to prevent conflicts.
*   **ASCII Diagrams:** Use simple ASCII art in documentation to visually explain complex system flows or architectures.
```
[Your Computer] ---> [ngrok] ---> [Internet]
```
*   **Component Isolation:** Generate complex React components in isolation first, then integrate them into the main application.
*   **File Deletion Caution:** Never delete files without first verifying that no other files import or depend on them.
*   **Run Type-Check:** Always run `tsc` or your project's type-checker before committing to catch type errors early.
*   **Node.js for Tests:** Prefer Node.js-based test runners for unit and integration tests to enable faster, headless execution without browser dependencies.
*   **Test Fixtures:** Use test fixtures to provide consistent, token-efficient test data for delegate.
*   **Visual Regression Tests:** Implement visual regression tests to catch unintended UI changes, especially after visual updates.