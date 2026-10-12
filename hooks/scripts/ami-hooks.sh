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
  # 1. Blocking wait detection
  if echo "$input" | grep -E -q '(sleep [0-9]+|gh run watch|docker compose up( |$))'; then
    echo "Notice: Blocking command detected. Consider running in background or using subagent orchestration." >&2
  fi

  # 2. Secret and path check on commit/push
  if echo "$input" | grep -E -q '(git commit|git push)'; then
    if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
      diff_out=$(git diff --cached -U0 2>/dev/null || true)
      if [ -z "$diff_out" ]; then
        diff_out=$(git diff HEAD~1..HEAD -U0 2>/dev/null || true)
      fi

      if [ -n "$diff_out" ]; then
        # Check for credential patterns in added lines
        added_lines=$(echo "$diff_out" | grep -E '^\+[^\+]' || true)
        if [ -n "$added_lines" ]; then
          # Check for secrets
          if echo "$added_lines" | grep -v -E '(getenv|environ|process\.env|example|placeholder|pragma: allowlist secret)' | grep -E -q '(AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|xox[baprs]-[0-9A-Za-z-]{10,}|gh[pousr]_[A-Za-z0-9]{36,}|AIza[0-9A-Za-z_-]{35})'; then
            echo "SECURITY BLOCK: Potential secret detected in git diff. Bypass with 'pragma: allowlist secret' if intentional." >&2
            exit 2
          fi

          # Check for local machine path leaks
          if echo "$added_lines" | grep -v 'pragma: allowlist path' | grep -E -q '(/home/[a-zA-Z0-9_.-]+|/Users/[a-zA-Z0-9_.-]+|C:\\Users\\[a-zA-Z0-9_.-]+)'; then
            echo "PATH PRIVACY BLOCK: Absolute local machine path detected in git diff. Use relative paths or bypass with 'pragma: allowlist path'." >&2
            exit 2
          fi
        fi
      fi
    fi
  fi

  # Reminders for conventional skills
  if echo "$input" | grep -E -q "(git commit|git-commit)"; then
    echo "Reminder: Use ami-plan-commits for proper commit formatting." >&2
  fi
  if echo "$input" | grep -E -q "(git push|git-push)"; then
    echo "Reminder: Run ami-push-assistant agent before pushing code." >&2
  fi
  if echo "$input" | grep -E -q "gh pr create"; then
    echo "Reminder: Consider running ami-detect-pr-conflicts or ami-pr-publisher before creating PR." >&2
  fi
elif [ "$event" = "PostToolUse" ]; then
  file=$(echo "$input" | sed -n 's/.*"\(file_path\|TargetFile\|AbsolutePath\)":[[:space:]]*"\([^"]*\)".*/\2/p' | head -n 1)
  
  if [ -n "$file" ] && [ -f "$file" ]; then
    if git ls-files --error-unmatch "$file" >/dev/null 2>&1; then
      added=$(git diff -U0 "$file" 2>/dev/null | grep -E '^\+[^\\+]' || echo "")
    else
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
