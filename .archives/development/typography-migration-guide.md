This guide outlines the process of updating existing component styles to utilize the new, standardized typography system defined in `typography.css`. By adopting these variables and utility classes, we ensure consistency, responsiveness, and easier maintenance across the entire UI.

## General Migration Principles

The core idea is to replace hardcoded font properties with CSS variables and predefined utility classes.

*   **Font Families:** Replace specific font names (e.g., `'Press Start 2P'`, `'Courier New'`) with `var(--font-primary)`, `var(--font-headers)`, or `var(--font-monospace)`.
*   **Font Sizes:** Replace fixed pixel or `em` values (e.g., `16px`, `0.9em`) with responsive `clamp()`-based variables like `var(--text-xs)`, `var(--text-sm)`, `var(--text-base)`, up to `var(--text-4xl)`.
*   **Text Shadows & Glows:** Replace custom `text-shadow` declarations with predefined variables such as `var(--text-shadow-sm)`, `var(--text-glow-green)`, etc.
*   **Semantic Classes:** Leverage new component-specific classes (e.g., `.panel-header`, `.stat-text`, `.dialogue-text`) for consistent styling.
*   **Utility Classes:** Use utility classes (e.g., `.text-primary`, `.font-bold`, `.tracking-wide`) for quick adjustments where a full component class isn't necessary.

---

## Component-Specific Migration Examples

For each component type, we'll show the "before" (existing style) and "after" (migrated style) examples.

### 1. Base UI Font & Colors

**Explanation:** The `UIFramework.module.css` sets a base font for the entire game container. This should now defer to the `body` styles defined in `typography.css` or explicitly use the new font variables.

*   **Old Style Pattern to Find:**
    ```css
    /* UIFramework.module.css */
    .gameContainer {
      /* ... other styles ... */
      color: var(--ui-light); /* Old variable name */
      font-family: 'Courier New', monospace; /* Hardcoded font */
      /* ... */
    }
    ```

*   **New Style Using Typography Variables/Classes:**
    ```css
    /* UIFramework.module.css */
    .gameContainer {
      /* ... other styles ... */
      /* Remove font-family and color if body already sets them and is sufficient */
      /* If you need to explicitly override body for this container, use: */
      font-family: var(--font-primary); /* Use the new font variable */
      color: var(--ui-light-text); /* Use the new, consistent color variable name */
      /* ... */
    }

    /* Remember that typography.css already sets base styles for body: */
    /*
    body {
      font-family: var(--font-primary);
      font-size: var(--text-base);
      line-height: var(--line-height-normal);
      color: var(--ui-light-text);
      font-weight: var(--font-weight-normal);
      letter-spacing: var(--letter-spacing-normal);
    }
    */
    ```

*   **Brief Explanation:** The base font family and text color for the entire application should ideally be managed by the `body` selector in `typography.css`. If `.gameContainer` needs to explicitly set these, it should use the new `var(--font-primary)` and `var(--ui-light-text)` variables for consistency. Note the color variable name change from `--ui-light` to `--ui-light-text`.

---

### 2. Headers/Titles (UI Panel Headers)

**Explanation:** Panel headers should now use the dedicated `.panel-header` class for consistent styling across all UI panels. This class encapsulates font family, size, weight, color, text transform, letter spacing, and text glow.

*   **Old Style Pattern to Find:**
    ```css
    /* UIFramework.module.css */
    .statusPanel h3 {
      color: var(--primary-green);
      margin: 0 0 12px 0;
      padding-bottom: 10px;
      font-size: 1.1em; /* ~17.6px, hardcoded size */
      text-transform: uppercase;
      letter-spacing: 1.5px;
      text-shadow: 
        0 0 10px rgba(0, 255, 136, 0.5), /* Custom glow */
        0 2px 4px rgba(0, 0, 0, 0.8); /* Custom shadow */
      border-bottom: 1px solid rgba(42, 42, 78, 0.5);
      position: relative;
    }

    .minimapPanel h3 {
      color: var(--ui-accent); /* Different color */
      margin: 0 0 12px 0;
      padding-bottom: 10px;
      font-size: 1.1em;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      text-shadow: 
        0 0 10px rgba(74, 158, 255, 0.5), /* Different custom glow */
        0 2px 4px rgba(0, 0, 0, 0.8);
      border-bottom: 1px solid rgba(42, 42, 78, 0.5);
      position: relative;
    }
    ```

*   **New Style Using Typography Variables/Classes:**
    ```css
    /* UIFramework.module.css */
    /* Remove the specific h3 typography styles.
       Keep layout-related properties and specific overrides. */
    .statusPanel h3 {
      /* Remove font-size, text-transform, letter-spacing, text-shadow */
      /* The .panel-header class provides these. */
      margin: 0 0 12px 0;
      padding-bottom: 10px;
      border-bottom: 1px solid rgba(42, 42, 78, 0.5);
      position: relative;
      /* If .panel-header's default color isn't primary-green, override here: */
      color: var(--primary-green); 
    }
    .statusPanel h3::after {
      /* Keep specific border glow effect if it's not part of the typography system */
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(to right, 
        transparent, 
        var(--primary-green), 
        transparent);
      opacity: 0.5;
    }

    .minimapPanel h3 {
      /* Remove font-size, text-transform, letter-spacing, text-shadow */
      margin: 0 0 12px 0;
      padding-bottom: 10px;
      border-bottom: 1px solid rgba(42, 42, 78, 0.5);
      position: relative;
      color: var(--ui-accent); /* Override to accent color */
    }
    .minimapPanel h3::after {
      /* Keep specific border glow effect */
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(to right, 
        transparent, 
        var(--ui-accent), 
        transparent);
      opacity: 0.5;
    }

    /* In your HTML/JSX, apply the .panel-header class: */
    <div class="statusPanel">
      <h3 class="panel-header">Player Status</h3>
      <!-- ... -->
    </div>

    <div class="minimapPanel">
      <h3 class="panel-header">Minimap</h3>
      <!-- ... -->
    </div>
    ```

*   **Brief Explanation:** The `font-family`, `font-size`, `font-weight`, `text-transform`, `letter-spacing`, `color`, and `text-shadow` properties are now encapsulated within the `.panel-header` class in `typography.css`. This simplifies component-specific CSS by removing redundant declarations. You only need to keep layout-related properties (like `margin`, `padding`, `border-bottom`) and specific color overrides if the panel requires a different color than the default `.panel-header` (which is `var(--primary-green)`).

---

### 3. Status Bar Text (General)

**Explanation:** General text within the status bar should use the primary font, a standard text size, and a predefined text shadow.

*   **Old Style Pattern to Find:**
    ```css
    /* StatusBar.module.css */
    .statusBar {
      /* ... */
      color: #e0e0e0; /* Hardcoded color */
      font-family: 'Press Start 2P', 'Courier New', Courier, monospace; /* Hardcoded font */
      font-size: 0.9em; /* Hardcoded size */
      /* ... */
    }

    .statusBarText {
      color: #e0e0e0; /* Hardcoded color */
      text-shadow: 0 0 3px rgba(0, 0, 0, 0.5); /* Custom shadow */
    }
    ```

*   **New Style Using Typography Variables/Classes:**
    ```css
    /* StatusBar.module.css */
    .statusBar {
      /* ... */
      /* Remove color and font-family if body already sets them and is sufficient */
      font-family: var(--font-primary); /* Or var(--font-monospace) if preferred for this panel */
      font-size: var(--text-sm); /* Adjust to desired size, 0.9em is close to text-sm */
      color: var(--ui-light-text); /* Use predefined color variable */
      /* ... */
    }

    .statusBarText {
      color: var(--ui-light-text); /* Use predefined color variable */
      text-shadow: var(--text-shadow-sm); /* Use predefined shadow variable */
    }
    ```

*   **Brief Explanation:** Replaced hardcoded font family, size, and text shadow with their respective CSS variables for better maintainability and consistency.

---

### 4. Status Text (Level, XP)

**Explanation:** Specific status texts like Level and XP should leverage the predefined `.stat-xp` class and color variables for their distinct appearance.

*   **Old Style Pattern to Find:**
    ```css
    /* StatusBar.module.css */
    .levelText {
      color: #ffaa00; /* Hardcoded warning yellow */
      text-shadow: 0 0 5px rgba(255, 170, 0, 0.5); /* Custom yellow glow */
      font-weight: bold;
    }

    .xpText {
      color: #ffaa00; /* Hardcoded warning yellow */
      text-shadow: 0 0 5px rgba(255, 170, 0, 0.5); /* Custom yellow glow */
    }
    ```

*   **New Style Using Typography Variables/Classes:**
    ```css
    /* StatusBar.module.css */
    /* Remove these specific styles and apply .stat-xp class in HTML/JSX.
       If you need to keep .levelText or .xpText for other non-typography properties,
       just remove the typography-related ones. */
    .levelText {
      /* Remove color, text-shadow, font-weight */
    }
    .xpText {
      /* Remove color, text-shadow */
    }

    /* In your HTML/JSX: */
    <div class="statusBarSection">
      <span class="statusBarText">Level:</span>
      <span class="stat-xp font-bold">15</span> <!-- Use stat-xp and font-bold utility -->
    </div>
    <div class="statusBarSection">
      <span class="statusBarText">XP:</span>
      <span class="stat-xp">1234 / 5000</span> <!-- Use stat-xp -->
    </div>
    ```

*   **Brief Explanation:** The `typography.css` system provides `.stat-xp` which already defines the `color` and `text-shadow` for XP/Level related text using the new variables. The `font-weight: bold` can be replaced with the utility class `.font-bold`. This promotes reusability and consistency.

---

### 5. Stats/Numbers (Progress Bar Text)

**Explanation:** Text displayed over progress bars, often numerical, should use a monospace font and appropriate size/shadow.

*   **Old Style Pattern to Find:**
    ```css
    /* StatusBar.module.css */
    .progressBarText {
      position: absolute;
      width: 100%;
      text-align: center;
      line-height: 18px; /* Vertically center text */
      color: #fff; /* Hardcoded white text */
      font-size: 0.8em; /* Hardcoded size */
      text-shadow: 0 0 3px rgba(0, 0, 0, 0.8); /* Custom shadow */
    }
    ```

*   **New Style Using Typography Variables/Classes:**
    ```css
    /* StatusBar.module.css */
    .progressBarText {
      position: absolute;
      width: 100%;
      text-align: center;
      line-height: 18px; /* Keep for vertical centering */
      color: var(--ui-light-text); /* Use predefined UI light text variable */
      font-size: var(--text-xs); /* 0.8em is close to text-xs */
      font-family: var(--font-monospace); /* Use monospace font variable */
      text-shadow: var(--text-shadow-md); /* Use predefined shadow variable */
    }
    ```

*   **Brief Explanation:** Replaced hardcoded `font-size`, `color`, and `text-shadow` with their respective CSS variables for better maintainability and consistency. The `font-family` is set to `var(--font-monospace)` which is suitable for numerical displays.

---

### 6. Hotbar Key Text

**Explanation:** The small text indicating hotbar keys should use the warning yellow color and a subtle shadow.

*   **Old Style Pattern to Find:**
    ```css
    /* UIFramework.module.css */
    .hotbarKey {
      position: absolute;
      top: 2px;
      left: 4px;
      font-size: 0.7em; /* Hardcoded size */
      color: var(--warning-yellow); /* Already a variable, keep */
      text-shadow: 0 0 5px rgba(0, 0, 0, 0.8); /* Custom shadow */
    }
    ```

*   **New Style Using Typography Variables/Classes:**
    ```css
    /* UIFramework.module.css */
    .hotbarKey {
      position: absolute;
      top: 2px;
      left: 4px;
      font-size: var(--text-xs); /* 0.7em is close to text-xs */
      color: var(--warning-yellow); /* Already a variable, keep */
      text-shadow: var(--text-shadow-md); /* Use predefined shadow variable */
    }
    ```

*   **Brief Explanation:** The `font-size` is mapped to the closest responsive typography variable `var(--text-xs)`. The `text-shadow` is replaced with `var(--text-shadow-md)` for consistency with the new system's shadow definitions.

---

### 7. Quest Text

**Explanation:** Quest-related text (titles, descriptions, objectives) should use the dedicated classes defined in `typography.css`. This ensures a unified look for all quest elements.

*   **Old Style Pattern to Find (Assumed Generic - as no specific old styles were provided):**
    ```css
    /* Assuming generic styles or inline styles for quest elements */
    .quest-container h2 {
      font-family: sans-serif;
      font-size: 24px;
      color: orange;
    }
    .quest-container p {
      font-family: Arial;
      font-size: 16px;
      color: white;
    }
    .quest-container li {
      font-size: 14px;
      color: gray;
    }
    ```

*   **New Style Using Typography Variables/Classes:**
    ```html
    <!-- In your HTML/JSX for a quest display: -->
    <div class="quest-display">
      <h2 class="quest-title">The Lost Artifact</h2>
      <p class="quest-description">
        A powerful artifact has been stolen from the ancient ruins. 
        You must venture deep into the forgotten crypts to retrieve it.
      </p>
      <ul class="quest-objectives">
        <li class="quest-objective">Find the entrance to the Crypt of Whispers.</li>
        <li class="quest-objective">Defeat the Crypt Guardian.</li>
        <li class="quest-objective completed">Retrieve the artifact.</li>
      </ul>
    </div>
    ```
    *(No CSS changes needed in component files if the HTML is updated to use these classes, as they are fully defined in `typography.css`)*

*   **Brief Explanation:** The `typography.css` file already provides comprehensive styles for `.quest-title`, `.quest-description`, and `.quest-objective`. The migration involves updating your HTML/JSX to apply these classes directly, removing the need for component-specific CSS for these elements.

---

### 8. Button Text

**Explanation:** Button text should use the `.button-text` class for its core typography, and additional classes like `.button-primary`, `.button-secondary`, etc., for color variations.

*   **Old Style Pattern to Find (Assumed Generic - as no specific old styles were provided):**
    ```css
    /* Assuming generic button styles */
    .myButton {
      font-family: 'Pixel Font', monospace;
      font-size: 18px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 2px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.7);
      color: #00FF00; /* Example green button */
    }
    ```

*   **New Style Using Typography Variables/Classes:**
    ```html
    <!-- In your HTML/JSX for buttons: -->
    <button class="button-text button-primary">Start Game</button>
    <button class="button-text button-secondary">Options</button>
    <button class="button-text button-danger">Quit</button>
    <button class="button-text button-disabled" disabled>Loading...</button>
    ```
    *(No CSS changes needed in component files if the HTML is updated to use these classes, as they are fully defined in `typography.css`)*

*   **Brief Explanation:** The `typography.css` file defines a base `.button-text` class for common button text properties (font family, size, weight, transform, spacing, shadow). Color variations are handled by modifier classes like `.button-primary`. This centralizes button text styling and makes it easy to apply consistent button looks.

---

### 9. Dialogue Text

**Explanation:** Dialogue text and speaker names should use the dedicated `.dialogue-text` and `.dialogue-speaker` classes for a consistent in-game narrative experience.

*   **Old Style Pattern to Find (Assumed Generic - as no specific old styles were provided):**
    ```css
    /* Assuming generic styles for dialogue */
    .dialogue-box p {
      font-family: 'Retro Font', serif;
      font-size: 16px;
      line-height: 1.5;
      color: #FFF;
      text-shadow: 1px 1px 2px black;
    }
    .dialogue-box .speaker-name {
      font-family: 'Fancy Font', sans-serif;
      font-size: 18px;
      font-weight: bold;
      color: #ADD8E6; /* Light blue */
    }
    ```

*   **New Style Using Typography Variables/Classes:**
    ```html
    <!-- In your HTML/JSX for dialogue: -->
    <div class="dialogue-box">
      <p class="dialogue-speaker">Claude:</p>
      <p class="dialogue-text">
        Greetings, adventurer! The path ahead is fraught with peril, 
        but also with great reward. Are you ready to face your destiny?
      </p>
    </div>
    ```
    *(No CSS changes needed in component files if the HTML is updated to use these classes, as they are fully defined in `typography.css`)*

*   **Brief Explanation:** The `typography.css` file provides `.dialogue-text` and `.dialogue-speaker` classes that encapsulate all necessary typography properties for dialogue elements. By applying these classes in your HTML/JSX, you ensure a consistent and thematic presentation of in-game conversations.

---

## Responsive Typography Considerations

The new `typography.css` system utilizes `clamp()` for fluid font sizing and includes media queries for base font size adjustments (`html` selector) and specific heading size reductions on smaller screens.

*   **Old Style Pattern to Find:**
    ```css
    /* StatusBar.module.css */
    @media (max-width: 768px) {
      .statusBar {
        font-size: 0.8em; /* Manual mobile font size adjustment */
      }
      .progressBarContainer {
        width: 100px;
      }
      /* ... other manual font size adjustments */
    }
    ```

*   **New Approach:**
    ```css
    /* StatusBar.module.css */
    @media (max-width: 768px) {
      /* Remove font-size adjustments if the new clamp() variables are sufficient.
         The base font size and text-sm/text-base variables will handle scaling. */
      /* .statusBar { font-size: var(--text-sm); } // If you need to explicitly set it */
      
      /* Keep layout adjustments that are not related to typography: */
      .progressBarContainer {
        width: 100px; 
      }
    }
    ```

*   **Brief Explanation:** With `clamp()` and the responsive `html` font size in `typography.css`, most font sizes will scale automatically. Review existing media queries in component-specific CSS files (`StatusBar.module.css`, `UIFramework.module.css`) and remove redundant `font-size` declarations. Only keep layout-related adjustments that are not handled by the typography system.

---

By following this guide, you can systematically update your component styles to fully leverage the new typography system, leading to a more consistent, responsive, and maintainable UI for Tales of Claude.