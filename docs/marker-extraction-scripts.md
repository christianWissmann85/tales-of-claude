# 🔧 Marker Extraction Scripts - Quick Reference

This guide provides a comprehensive, ready-to-use solution for extracting specific content blocks from files using predefined markers. This technique is invaluable for agents needing to quickly isolate instructions, configurations, or data snippets from larger documents.

---

## Quick Start for Agents

For agents in a hurry, here's the essential information:

1.  **What it does:** Extracts all content between `---START_MARKER---` and `---END_MARKER---` from specified files or standard input.
2.  **Save the Script:** Copy the "Extraction Script" below into a file, e.g., `extract_markers.sh`.
3.  **Make it Executable:** `chmod +x extract_markers.sh`
4.  **Basic Usage:**
    *   **From a file:** `./extract_markers.sh my_document.md`
    *   **From multiple files:** `./extract_markers.sh file1.txt file2.log`
    *   **From piped input:** `cat my_document.md | ./extract_markers.sh`
5.  **Integration with `delegate_invoke`:**
    *   `delegate_invoke "cat my_document.md | ./extract_markers.sh"`
    *   `delegate_invoke "find . -name '*.md' -print0 | xargs -0 ./extract_markers.sh"`

---

## 1. Complete, Ready-to-Use Extraction Script

This Bash script uses `awk` for efficient and robust marker extraction. It can process one or more files specified as arguments, or read from standard input if no files are provided.

```bash
#!/bin/bash

# --- Marker Extraction Script ---
# This script extracts content blocks delimited by specific markers.
# It can process files provided as arguments or read from standard input.

# Define the markers
START_MARKER="---START_MARKER---"
END_MARKER="---END_MARKER---"

# Function to extract content from a single file
extract_from_file() {
    local file="$1"
    
    if [[ ! -f "$file" ]]; then
        echo "Error: File not found or not a regular file: '$file'" >&2
        return 1
    fi
    
    if [[ ! -r "$file" ]]; then
        echo "Error: Permission denied to read file: '$file'" >&2
        return 1
    fi

    # Use awk to process the file
    # -v passes shell variables to awk
    # $0 == start_m: If the line matches the start marker, set 'in_marker' to 1 and skip to next line.
    # $0 == end_m: If the line matches the end marker, set 'in_marker' to 0 and skip to next line.
    # in_marker { print }: If 'in_marker' is 1 (true), print the current line.
    awk -v start_m="$START_MARKER" -v end_m="$END_MARKER" '
    $0 == start_m { in_marker=1; next }
    $0 == end_m { in_marker=0; next }
    in_marker { print }
    ' "$file"
}

# Main logic: Process arguments or stdin
if [[ "$#" -eq 0 ]]; then
    # If no arguments, read from stdin
    # This allows piping content into the script: cat file.txt | ./extract_markers.sh
    awk -v start_m="$START_MARKER" -v end_m="$END_MARKER" '
    $0 == start_m { in_marker=1; next }
    $0 == end_m { in_marker=0; next }
    in_marker { print }
    '
else
    # Process each file provided as an argument
    for f in "$@"; do
        extract_from_file "$f"
    done
fi
```

**How to use the script:**

1.  Save the code above into a file named `extract_markers.sh`.
2.  Make it executable: `chmod +x extract_markers.sh`
3.  Run it:
    *   `./extract_markers.sh my_document.md`
    *   `cat my_document.md | ./extract_markers.sh`

---

## 2. Clear Examples of the Marker Format

Here are examples of files demonstrating the correct marker format and how the script would behave.

### Example 1: `task_details.md`

```markdown
# Project Alpha - Task Breakdown

This document outlines the key steps for Project Alpha.

---START_MARKER---
**Task ID:** PA-001
**Description:** Implement user authentication module.
**Assigned To:** @dev_team_lead
**Due Date:** 2023-12-31
**Priority:** High
---END_MARKER---

Further details on the UI integration will be provided in a separate document.

---START_MARKER---
**Task ID:** PA-002
**Description:** Develop API endpoints for data retrieval.
**Assigned To:** @backend_devs
**Due Date:** 2024-01-15
**Priority:** Medium
---END_MARKER---

Please ensure all tasks are logged in JIRA.
```

**Expected Output from `./extract_markers.sh task_details.md`:**

```
**Task ID:** PA-001
**Description:** Implement user authentication module.
**Assigned To:** @dev_team_lead
**Due Date:** 2023-12-31
**Priority:** High
**Task ID:** PA-002
**Description:** Develop API endpoints for data retrieval.
**Assigned To:** @backend_devs
**Due Date:** 2024-01-15
**Priority:** Medium
```

### Example 2: `config_notes.txt`

```
# Server Configuration Notes

This file contains important configuration snippets for the production server.

---START_MARKER---
# Nginx Configuration for Reverse Proxy
location /api/ {
    proxy_pass http://backend_service:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
---END_MARKER---

Remember to restart Nginx after any changes.

---START_MARKER---
# Database Connection String (DO NOT COMMIT TO GIT)
DATABASE_URL="postgresql://user:password@db_host:5432/prod_db"
---END_MARKER---

Backup procedures are documented in Confluence.
```

**Expected Output from `./extract_markers.sh config_notes.txt`:**

```
# Nginx Configuration for Reverse Proxy
location /api/ {
    proxy_pass http://backend_service:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
# Database Connection String (DO NOT COMMIT TO GIT)
DATABASE_URL="postgresql://user:password@db_host:5432/prod_db"
```

### Example 3: `log_snippet.log`

```
INFO: Application started successfully.
DEBUG: Initializing module 'AuthService'.
---START_MARKER---
ERROR: Failed to connect to database. Retrying in 5 seconds...
Caused by: java.net.ConnectException: Connection refused (Connection refused)
    at java.base/sun.nio.ch.Net.connect0(Native Method)
    at java.base/sun.nio.ch.Net.connect(Net.java:579)
---END_MARKER---
WARN: Database connection re-established.
INFO: User 'admin' logged in.
```

**Expected Output from `./extract_markers.sh log_snippet.log`:**

```
ERROR: Failed to connect to database. Retrying in 5 seconds...
Caused by: java.net.ConnectException: Connection refused (Connection refused)
    at java.base/sun.nio.ch.Net.connect0(Native Method)
    at java.base/sun.nio.ch.Net.connect(Net.java:579)
```

### Example 4: `empty_markers.txt`

```
Some content before.
---START_MARKER---
---END_MARKER---
Some content after.
```

**Expected Output from `./extract_markers.sh empty_markers.txt`:**

*(No output, as there's no content between the markers)*

---

## 3. Common Mistakes to Avoid

Understanding these common pitfalls will help agents troubleshoot quickly.

1.  **Typos in Markers:** The script looks for an *exact* match.
    *   **Mistake:** `---START_MARKER---` vs. `---START_MARKERS---` or `---START_MARKER ---` (extra space).
    *   **Fix:** Ensure the markers are precisely `---START_MARKER---` and `---END_MARKER---` with no leading/trailing spaces or typos.
2.  **Missing `---END_MARKER---`:** If a `---START_MARKER---` is found but no corresponding `---END_MARKER---` follows, the script will continue printing all subsequent lines until the end of the file (or another `---START_MARKER---` is encountered, which would reset the state).
    *   **Fix:** Always ensure every `---START_MARKER---` has a matching `---END_MARKER---`.
3.  **Content on the Same Line as Markers:** The script expects markers to be on their own lines.
    *   **Mistake:** `---START_MARKER--- My content starts here`
    *   **Fix:** Place markers on dedicated lines.
4.  **Incorrect File Paths or Permissions:**
    *   **Mistake:** `./extract_markers.sh /path/to/non_existent_file.md` or `./extract_markers.sh /path/to/file_without_read_permission.md`
    *   **Fix:** Double-check file paths and ensure the script has read permissions for the target files. The script includes basic error messages for these cases.
5.  **Not Making the Script Executable:**
    *   **Mistake:** `./extract_markers.sh` results in `Permission denied` or `command not found`.
    *   **Fix:** Run `chmod +x extract_markers.sh` once after saving the script.
6.  **Unexpected Whitespace/Empty Lines:** The script will extract *all* content between markers, including empty lines and leading/trailing whitespace on lines. If you need to trim this, you'll need to pipe the output to `sed` or `awk` again (e.g., `... | sed '/^$/d' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//'`). For most marker extraction purposes, this is usually acceptable.

---

## 4. Integration with Delegate Workflow

The marker extraction script is highly valuable when integrated into `delegate_invoke` commands, allowing agents to precisely target and retrieve specific information.

### Scenario 1: Extracting from a Single Known File

You know the exact file containing the information you need.

```bash
# Example: Extract task details from a specific document
delegate_invoke "cat task_details.md | ./extract_markers.sh"
```

**Agent's thought process:** "I need the core task definitions from `task_details.md`. I'll use `cat` to feed the file content into the marker extraction script."

### Scenario 2: Extracting from Multiple Files (e.g., all `.md` files)

You need to gather specific marked content from a set of files matching a pattern.

```bash
# Example: Extract all marked configuration snippets from all .conf files in the current directory
delegate_invoke "find . -maxdepth 1 -name '*.conf' -print0 | xargs -0 ./extract_markers.sh"
```

**Agent's thought process:** "I need all marked configuration blocks from any `.conf` file in this directory. `find` will locate them, `xargs` will pass them to the script, and `-print0`/`-0` handles filenames with spaces."

### Scenario 3: Capturing Extracted Output for Further Processing

Often, you'll want to store the extracted information in a variable for subsequent actions or analysis.

```bash
# Example: Extract a critical log snippet and then analyze it
extracted_log=$(delegate_invoke "cat log_snippet.log | ./extract_markers.sh")

# Agent can then use $extracted_log for further analysis, summarization, or reporting
echo "--- Extracted Critical Log ---"
echo "$extracted_log"
echo "--- End of Log ---"

# Further processing example: Count error lines
error_count=$(echo "$extracted_log" | grep -c "ERROR")
echo "Found $error_count error lines in the snippet."
```

**Agent's thought process:** "I need to get that specific error block from the log file. I'll extract it and store it in a variable, then I can run more commands on that variable, like counting specific keywords."

### Important Considerations for `delegate_invoke`:

*   **Quoting:** Always enclose the entire command string for `delegate_invoke` in double quotes (`"`). This ensures the command is passed as a single argument.
*   **Script Location:** Ensure `extract_markers.sh` is in the current working directory or in your `PATH` when `delegate_invoke` executes it. If not, provide the full path (e.g., `/home/agent/scripts/extract_markers.sh`).
*   **Permissions:** Confirm the `extract_markers.sh` script has execute permissions (`chmod +x extract_markers.sh`).

By leveraging this marker extraction technique with `delegate_invoke`, agents can significantly streamline their workflow, focusing on the most relevant information without manual parsing.