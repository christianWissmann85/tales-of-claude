# **Project Proposal: AI-Driven Visual Playtesting Framework**

## **For "Tales of Clade" & AiKi Robotics Core Technology Validation**

**Version:** 1.0

**Date:** June 24, 2025

**Author:** Gemini, in collaboration with Christian, Founder of AiKi Systems

### **1. Executive Summary**

This document outlines a proposal for the design and development of an **AI-Driven Visual Playtesting Framework**. The primary goal is to automate the repetitive and time-consuming process of beta testing for the game "Tales of Clade," thereby eliminating the current development bottleneck of relying on a single manual tester.

The proposed solution involves creating a "Game Agent" that uses a multimodal AI to perceive the game visually and interact with it like a human player. This agent will operate through a **"Bridge" application** that connects the AI "Brain" to the game environment running in a browser.

Crucially, this project is not just a testing tool. It is a strategic initiative designed to serve as a real-world, practical application and validation of AiKi Robotics' core intellectual property: the **AiKi Persistent AI Processing (APAP)** methodology and the **AiKi Dynamic Context Engine (ADCE)**. By successfully implementing this framework, we will create a powerful internal tool and a compelling demonstration of the AiKi Cognitive System (ACS) in action.

### **2. The Challenge: The Manual Testing Bottleneck**

For any agile development team, frequent code commits are essential for rapid progress. However, each commit carries the risk of introducing regressions—new bugs in previously functional parts of the game. The current testing workflow for "Tales of Clade" relies on manual playthroughs, which is:

* **Time-Consuming:** Manual testing cannot be performed for every single commit.  
* **A Bottleneck:** It places an unsustainable burden on the lead tester, slowing down the entire development and release cycle.  
* **Non-Scalable:** As the game grows in complexity, the scope of testing expands exponentially, making manual testing an unfeasible long-term strategy.  
* **Prone to Human Error:** Repetitive testing can lead to fatigue and missed bugs.

### **3. The Solution: An AI Playtester Agent**

We propose a paradigm shift from traditional test runners to an intelligent, autonomous agent that *plays* the game. This system architecture consists of three core components:

A diagram showing the three components: The Game runs in a browser. The Bridge Application (Playwright) takes screenshots and executes actions. The Brain (Multimodal AI) receives images and sends back commands.

* **1. The Game (Environment):** "Tales of Clade" running in a standard browser, launched via npm run dev. No modifications to the game's codebase are required.  
* **2. The Bridge (Sensor/Actuator):** A standalone Node.js application that uses the **Playwright** framework. Its responsibilities are:  
  * To programmatically launch and control a browser instance running the game.  
  * To act as the AI's "eyes" by taking screenshots of the game viewport.  
  * To act as the AI's "hands" by executing actions (mouse clicks, key presses) returned by the AI.  
* **3. The Brain (Cognitive Core):** A powerful multimodal AI (e.g., Gemini Pro Vision, Claude 4 Opus) accessed via an API. Its responsibilities are:  
  * To analyze the screenshot of the game.  
  * To understand its current mission (e.g., "Find the blacksmith").  
  * To decide on the next logical action and return it in a structured format (JSON).

### **4. Proposed Technology Stack**

| Component | Technology | Justification |
| :---- | :---- | :---- |
| **Bridge Application** | **Node.js (LTS)** | A mature, well-supported runtime for building the application. |
| **Browser Automation** | **Playwright** | A modern, robust framework by Microsoft. It is superior for this task because it manages its own browser binaries, **avoiding system library dependency issues** (like the libguns3 error). It has excellent APIs for screenshots and precise user input simulation. |
| **Language** | **TypeScript** | Ensures type safety, improves code quality, and aligns with the existing modern tech stack of "Tales of Clade." |
| **AI Cognitive Core** | **Gemini Pro Vision API** | A leading multimodal model capable of the visual analysis and logical reasoning required. Provides a simple REST API for integration. |

### **5. Integration with AiKi Robotics IP**

This project will be a direct implementation of the AiKi Robotics vision.

* **AiKi Persistent AI Processing (APAP):** The testing process will be structured using APAP principles. A high-level mission like "Test the main story quest up to the first boss" will be the primary task. The AI agent, guided by the Bridge application, will break this down into a dynamic sequence of sub-tasks: find_npc_A, accept_quest_1, navigate_to_dungeon, defeat_enemies, etc.  
* **AiKi Dynamic Context Engine (ADCE):** The Bridge application will function as the ADCE. It will maintain a "session context log" for the AI, which will include:  
  * A history of actions taken.  
  * A log of AI-generated observations ("Player health is low," "Found a key item").  
  * Key screenshots from pivotal moments.  
    This log provides the AI with a persistent memory, enabling it to make context-aware decisions over a long gameplay session, directly addressing the core problem ADCE is designed to solve.

### **6. Proposed Test Workflow: The "See-Think-Act" Loop**

The agent will operate in a continuous loop, mimicking a human player's cognitive process.

1. **Launch:** The test lead initiates the process with a high-level mission.  
   * **Example Command:** npm run test:ai -- --mission "Complete the tutorial quest."  
2. **See (Perception):** The Playwright script takes a high-resolution screenshot of the game's <canvas> element.  
3. **Think (Decision):** The Bridge application sends the screenshot and the current context log to the AI Brain with a carefully crafted prompt.  
4. **Act (Execution):** The AI returns a JSON object specifying an action. The Bridge parses this and executes it in the browser (e.g., page.mouse.click(x, y)).  
5. **Log & Report:** The action, the AI's reasoning, and the screenshot are saved to a report file. If the game throws a console error, it is also captured.  
6. **Repeat:** The loop continues until the mission is complete, the AI determines it is stuck, or a crash is detected.

### **7. API Design: Bridge <-> AI Communication**

Communication must be structured and predictable. We propose the following JSON interface.

#### **Request (from Bridge to AI Brain)**

{  
  "mission": "Your current goal is to find and talk to the village elder to start the first quest.",  
  "gameStateImage": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...",  
  "sessionContext": {  
    "previousActions": [  
      { "action": "click", "parameters": {"x": 640, "y": 550}, "reason": "Clicked 'New Game' button." },  
      { "action": "keyboard.press", "parameters": {"key": "W"}, "reason": "Moved character forward." }  
    ],  
    "aiObservations": [  
      "I have loaded into the starting village square.",  
      "There are three NPCs visible."  
    ]  
  }  
}

#### **Response (from AI Brain to Bridge)**

{  
  "action": "click",  
  "parameters": {  
    "x": 350,  
    "y": 275,  
    "description": "Click on the NPC with the grey beard and staff."  
  },  
  "reasoning": "This character fits the description of a 'village elder'. A quest icon is visible above their head, indicating they are the mission objective.",  
  "newObservation": "Initiating dialogue with the likely village elder.",  
  "isMissionComplete": false,  
  "confidenceScore": 0.95  
}

### **8. Requirements & Installation Guide**

This section is to ensure the team can set up the environment without issues.

**Prerequisites:**

* Node.js (latest LTS version)  
* NPM or Yarn package manager

**Installation Steps:**

*Note from Chris: I have fully installed it, all dependencies are installed.*


2. Initialize a Node.js project: npm init -y  
3. Install necessary dependencies: npm install typescript ts-node @types/node playwright  
4. **Crucial Step:** Install Playwright's browser binaries. This is the **solution to the missing system libraries issue**. Playwright downloads self-contained browser executables that do not depend on apt.  
   npx playwright install

5. Create a tsconfig.json file for TypeScript configuration.  
6. Create a .env file to store API keys securely (GEMINI_API_KEY=...).

### **9. Replacing the Manual Beta Tester: The End Goal**

The ultimate objective is to fully integrate this AI Agent into the CI/CD (Continuous Integration/Continuous Deployment) pipeline.

* **On-Commit Smoke Tests:** For every git push, a lightweight AI agent can be triggered to run a 5-minute "smoke test": start the game, move, open menus, and ensure no critical crashes have been introduced. Developers get feedback in minutes.  
* **Nightly Regression Testing:** Every night, a more robust AI agent can be deployed on a "full playthrough" mission, attempting to complete major questlines.  
* **Automated Reporting:** The system will produce detailed reports for each run, complete with logs, AI reasoning, and a gallery of screenshots. When a test fails, developers will receive a rich, visual bug report showing exactly what the AI saw and did, making debugging significantly faster.

This frees up human testers to focus on what AI cannot: evaluating if the game is **fun**, checking the story's emotional impact, and providing high-level, creative feedback. This elevates the role of the human tester from a bug hunter to a true Quality Assurance director.