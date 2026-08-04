#!/usr/bin/env bash
# ami-hooks.sh
# Unified execution hook script for Google Antigravity and Claude Code environments on POSIX (macOS/Linux).

event=""
while [[ $# -gt 0 ]]; do
  case $1 in
    -e|--event)
      event="$2"
      shift 2
      ;;
    PreToolUse|PostToolUse)
      event="$1"
      shift
      ;;
    *)
      shift
      ;;
  esac
done

if [ -z "$event" ]; then
  exit 0
fi

# Read standard input
input=$(cat 2>/dev/null || echo "")
if [ -z "$input" ]; then
  exit 0
fi

if [ "$event" = "PreToolUse" ]; then
  # Check for Git commit commands
  if echo "$input" | grep -E -q "(git commit|git-commit)"; then
    echo "Reminder: Use commit-assistant for proper commit formatting." >&2
  fi
  # Check for Git push commands
  if echo "$input" | grep -E -q "(git push|git-push)"; then
    echo "Reminder: Run push-assistant agent before pushing code." >&2
  fi
  # Check for GitHub PR creation
  if echo "$input" | grep -E -q "gh pr create"; then
    echo "Reminder: Consider running ami-pr-conflict-detector or ami-pr-publisher before creating PR." >&2
  fi
elif [ "$event" = "PostToolUse" ]; then
  # Extract file path from JSON input (supports Claude Code file_path and Antigravity TargetFile/AbsolutePath)
  file=$(echo "$input" | sed -n 's/.*"\(file_path\|TargetFile\|AbsolutePath\)":[[:space:]]*"\([^"]*\)".*/\2/p' | head -n 1)
  
  if [ -n "$file" ] && [ -f "$file" ]; then
    # Determine if file is tracked by git
    if git ls-files --error-unmatch "$file" >/dev/null 2>&1; then
      # Check only newly added/modified lines in git diff
      added=$(git diff -U0 "$file" 2>/dev/null | grep -E '^\+[^\\+]' || echo "")
    else
      # For untracked files, inspect entire contents
      added=$(cat "$file" 2>/dev/null || echo "")
    fi
    
    if [ -n "$added" ]; then
      if echo "$added" | grep -E -q "console\.log|debugger|TODO|FIXME"; then
        echo "Warning: Detected debug statements or TODOs in modified lines of $file. Review before commit." >&2
      fi
    fi
  fi
fi

exit 0
