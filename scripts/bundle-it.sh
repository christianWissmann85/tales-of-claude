#!/bin/bash

# Script to create a bundle.md file with table of contents, file tree, and file contents
# Respects .gitignore and skips Go build files

set -e

# Output file
OUTPUT="bundle.md"

# Temporary file for storing file list
TEMP_FILE_LIST=$(mktemp)

# Function to check if a file should be ignored
should_ignore() {
    local file="$1"
    
    # Skip the output file itself
    if [[ "$file" == "$OUTPUT" ]]; then
        return 0
    fi
    
    # Skip common Go build artifacts
    if [[ "$file" =~ \.(exe|test|out)$ ]] || [[ "$file" =~ ^(bin|dist|build)/ ]]; then
        return 0
    fi
    
    # Skip vendor directory
    if [[ "$file" =~ ^vendor/ ]]; then
        return 0
    fi
    
    # Skip .git directory
    if [[ "$file" =~ ^\.git/ ]]; then
        return 0
    fi
    
    # Check if file is in .gitignore (if git is available and .gitignore exists)
    if command -v git &> /dev/null && git rev-parse --git-dir &> /dev/null; then
        if git check-ignore "$file" &> /dev/null; then
            return 0
        fi
    fi
    
    return 1
}

# Function to generate file tree
generate_file_tree() {
    if command -v tree &> /dev/null; then
        # Use tree command if available
        if [ -f .gitignore ]; then
            tree -a -I '.git' --gitignore -F
        else
            tree -a -I '.git' -F
        fi
    else
        # Fallback to find-based tree
        find . -type f -o -type d | grep -v '^\.git' | sort | while read -r path; do
            # Remove leading ./
            path="${path#./}"
            [ -z "$path" ] && continue
            
            # Skip if should be ignored
            should_ignore "$path" && continue
            
            # Count depth for indentation
            depth=$(echo "$path" | tr '/' '\n' | wc -l)
            depth=$((depth - 1))
            
            # Create indentation
            indent=""
            for ((i=0; i<depth; i++)); do
                indent="  $indent"
            done
            
            # Get basename
            basename=$(basename "$path")
            
            # Print with proper formatting
            if [ -d "$path" ]; then
                echo "${indent}├── ${basename}/"
            else
                echo "${indent}├── ${basename}"
            fi
        done
    fi
}

# Function to get file extension
get_extension() {
    local filename="$1"
    echo "${filename##*.}"
}

# Function to get language identifier for code blocks
get_language() {
    local ext="$1"
    case "$ext" in
        go) echo "go" ;;
        js) echo "javascript" ;;
        ts) echo "typescript" ;;
        py) echo "python" ;;
        rb) echo "ruby" ;;
        java) echo "java" ;;
        c) echo "c" ;;
        cpp|cc|cxx) echo "cpp" ;;
        h|hpp) echo "cpp" ;;
        cs) echo "csharp" ;;
        php) echo "php" ;;
        swift) echo "swift" ;;
        kt) echo "kotlin" ;;
        rs) echo "rust" ;;
        sh|bash) echo "bash" ;;
        zsh) echo "zsh" ;;
        fish) echo "fish" ;;
        ps1) echo "powershell" ;;
        yml|yaml) echo "yaml" ;;
        json) echo "json" ;;
        xml) echo "xml" ;;
        html|htm) echo "html" ;;
        css) echo "css" ;;
        scss|sass) echo "scss" ;;
        less) echo "less" ;;
        sql) echo "sql" ;;
        md) echo "markdown" ;;
        tex) echo "latex" ;;
        r) echo "r" ;;
        m) echo "matlab" ;;
        lua) echo "lua" ;;
        pl) echo "perl" ;;
        scala) echo "scala" ;;
        clj) echo "clojure" ;;
        ex|exs) echo "elixir" ;;
        elm) echo "elm" ;;
        ml) echo "ocaml" ;;
        fs|fsx) echo "fsharp" ;;
        vue) echo "vue" ;;
        jsx) echo "jsx" ;;
        tsx) echo "tsx" ;;
        Dockerfile) echo "dockerfile" ;;
        Makefile) echo "makefile" ;;
        *) echo "" ;;
    esac
}

echo "Creating bundle.md file..."

# Start writing to output file with UTF-8 encoding
{
    echo "# Project Bundle"
    echo ""
    echo "This file contains a complete bundle of all project files."
    echo ""
    echo "Generated on: $(date)"
    echo ""
    
    # Table of Contents
    echo "## Table of Contents"
    echo ""
    echo "1. [File Tree](#file-tree)"
    echo "2. [File Contents](#file-contents)"
    echo ""
    
    # File Tree section
    echo "## File Tree"
    echo ""
    echo '```'
    generate_file_tree
    echo '```'
    echo ""
    
    # File Contents section
    echo "## File Contents"
    echo ""
    
    # Collect all files
    if command -v git &> /dev/null && git rev-parse --git-dir &> /dev/null; then
        # Use git ls-files if in a git repository
        git ls-files > "$TEMP_FILE_LIST"
        
        # Also add untracked files that aren't ignored
        git ls-files --others --exclude-standard >> "$TEMP_FILE_LIST"
    else
        # Fallback to find
        find . -type f -not -path './.git/*' > "$TEMP_FILE_LIST"
    fi
    
    # Sort and remove duplicates
    sort -u "$TEMP_FILE_LIST" | while IFS= read -r file; do
        # Skip if should be ignored
        should_ignore "$file" && continue
        
        # Skip binary files
        if file --mime-encoding "$file" 2>/dev/null | grep -q "binary"; then
            echo "### $file"
            echo ""
            echo "*Binary file skipped*"
            echo ""
            continue
        fi
        
        echo "### $file"
        echo ""
        
        # Get file extension for syntax highlighting
        if [[ "$file" =~ \. ]]; then
            ext="${file##*.}"
            lang=$(get_language "$ext")
        else
            # Check for files without extensions
            basename=$(basename "$file")
            lang=$(get_language "$basename")
        fi
        
        # Start code block with language identifier
        echo '```'"$lang"
        
        # Output file content
        cat "$file" 2>/dev/null || echo "Error reading file"
        
        # End code block
        echo '```'
        echo ""
    done
    
} > "$OUTPUT"

# Clean up
rm -f "$TEMP_FILE_LIST"

echo "✅ Successfully created $OUTPUT"
echo "📄 File size: $(du -h "$OUTPUT" | cut -f1)"
echo "📊 Total files included: $(grep -c '^### ' "$OUTPUT" || echo "0")"