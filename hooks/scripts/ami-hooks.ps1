# ami-hooks.ps1
# Unified execution hook script for Google Antigravity and Claude Code environments.

[CmdletBinding()]
param (
    [Parameter(Mandatory = $true)]
    [ValidateSet('PreToolUse', 'PostToolUse')]
    [string]$Event
)

try {
    $rawInput = [Console]::In.ReadToEnd()
    if (-not $rawInput) {
        exit 0
    }

    $payload = $null
    try {
        $payload = $rawInput | ConvertFrom-Json -ErrorAction SilentlyContinue
    } catch {
        # Fallback to raw string evaluation if JSON parsing fails
    }

    if ($Event -eq 'PreToolUse') {
        $cmd = ""
        if ($null -ne $payload) {
            if ($null -ne $payload.tool_input -and $null -ne $payload.tool_input.command) {
                $cmd = [string]$payload.tool_input.command
            } elseif ($null -ne $payload.tool_input -and $null -ne $payload.tool_input.CommandLine) {
                $cmd = [string]$payload.tool_input.CommandLine
            } elseif ($null -ne $payload.CommandLine) {
                $cmd = [string]$payload.CommandLine
            } else {
                $cmd = [string]$rawInput
            }
        } else {
            $cmd = [string]$rawInput
        }

        # 1. Blocking-wait guard
        if ($cmd -match '^\s*sleep\s+\d+' -or $cmd -match '\bgh\s+run\s+watch\b' -or $cmd -match '\bdocker\s+compose\s+up\b(?!\s.*-d\b)') {
            [Console]::Error.WriteLine('Notice: Blocking command detected. Consider running in background or using subagent orchestration to keep the session responsive.')
        }

        # 2. Secret and path checks on commit/push
        if ($cmd -match '\bgit\s+(commit|push)\b') {
            # Check staged or pending diff
            $diffOutput = ""
            $isGit = git rev-parse --is-inside-work-tree 2>$null
            if ($isGit -eq 'true') {
                $prevEnvLock = $env:GIT_OPTIONAL_LOCKS
                $env:GIT_OPTIONAL_LOCKS = '0'
                $diffOutput = git diff --cached -U0 2>$null
                if (-not $diffOutput) {
                    $diffOutput = git diff HEAD~1..HEAD -U0 2>$null
                }
                $env:GIT_OPTIONAL_LOCKS = $prevEnvLock
            }

            if ($diffOutput) {
                $addedLines = $diffOutput -split "`r?`n" | Where-Object { $_ -match '^\+[^\+]' }

                # A. Secret Scanning
                $secretPatterns = @(
                    'AKIA[0-9A-Z]{16}',
                    '-----BEGIN [A-Z ]*PRIVATE KEY-----',
                    'xox[baprs]-[0-9A-Za-z-]{10,}',
                    'gh[pousr]_[A-Za-z0-9]{36,}',
                    'AIza[0-9A-Za-z_\-]{35}',
                    '(?i)(api[_-]?key|secret|access[_-]?token|auth[_-]?token|password|passwd)\s*[:=]\s*["''][A-Za-z0-9/+_\-]{16,}["'']'
                )
                $secretFalsePositive = '(?i)(getenv|environ|process\.env|config\[|settings\.|<[^>]+>|\$\{|example|placeholder|changeme|your[_-]|xxxx|\*\*\*|pragma:\s*allowlist\s*secret)'

                foreach ($line in $addedLines) {
                    if ($line -match $secretFalsePositive) { continue }
                    foreach ($pat in $secretPatterns) {
                        if ($line -match $pat) {
                            [Console]::Error.WriteLine("SECURITY BLOCK: Potential secret detected in git diff: $pat. Bypass with 'pragma: allowlist secret' if intentional.")
                            exit 2
                        }
                    }
                }

                # B. Absolute Workstation Path Scanning
                $pathPattern = '(?i)(C:\\Users\\[a-zA-Z0-9_.-]+|/(home|Users)/[a-zA-Z0-9_.-]+)'
                foreach ($line in $addedLines) {
                    if ($line -match 'pragma:\s*allowlist\s*path') { continue }
                    if ($line -match $pathPattern) {
                        [Console]::Error.WriteLine("PATH PRIVACY BLOCK: Absolute local machine path detected in git diff. Use relative paths or bypass with 'pragma: allowlist path'.")
                        exit 2
                    }
                }
            }
        }

        # Reminders for conventional skills
        if ($cmd -match '\bgit\s+commit\b') {
            [Console]::Error.WriteLine('Reminder: Use ami-plan-commits for proper commit formatting.')
        }
        if ($cmd -match '\bgit\s+push\b') {
            [Console]::Error.WriteLine('Reminder: Run ami-push-assistant agent before pushing code.')
        }
        if ($cmd -match '\bgh\s+pr\s+create\b') {
            [Console]::Error.WriteLine('Reminder: Consider running ami-detect-pr-conflicts or ami-pr-publisher before creating PR.')
        }
    }
    elseif ($Event -eq 'PostToolUse') {
        $file = $null
        $inMemoryContent = $null
        if ($null -ne $payload) {
            $toolArgs = $payload
            if ($null -ne $payload.tool_input) {
                $toolArgs = $payload.tool_input
            } elseif ($null -ne $payload.toolCall -and $null -ne $payload.toolCall.args) {
                $toolArgs = $payload.toolCall.args
            }

            if ($null -ne $toolArgs.file_path) { $file = [string]$toolArgs.file_path }
            elseif ($null -ne $toolArgs.TargetFile) { $file = [string]$toolArgs.TargetFile }
            elseif ($null -ne $toolArgs.AbsolutePath) { $file = [string]$toolArgs.AbsolutePath }
            elseif ($null -ne $toolArgs.target_file) { $file = [string]$toolArgs.target_file }
            elseif ($null -ne $toolArgs.path) { $file = [string]$toolArgs.path }

            # Fast in-memory extraction (Zero-Spawn)
            if ($toolArgs.Replacement) { $inMemoryContent = [string]$toolArgs.Replacement }
            elseif ($toolArgs.new_str) { $inMemoryContent = [string]$toolArgs.new_str }
            elseif ($toolArgs.new_string) { $inMemoryContent = [string]$toolArgs.new_string }
            elseif ($toolArgs.Content) { $inMemoryContent = [string]$toolArgs.Content }
            elseif ($toolArgs.content) { $inMemoryContent = [string]$toolArgs.content }
            elseif ($toolArgs.patch) { $inMemoryContent = [string]$toolArgs.patch }
            elseif ($null -ne $toolArgs.edits -and $toolArgs.edits -is [System.Collections.IEnumerable]) {
                $inMemoryContent = ($toolArgs.edits | ForEach-Object { $_.new_text -or $_.replacement -or $_.Replacement }) -join "`n"
            }
        }

        if (-not $file -and ($rawInput -match '"(?:file_path|TargetFile|AbsolutePath|target_file|path)"\s*:\s*"([^"]*)"')) {
            $file = $Matches[1]
        }

        $added = $inMemoryContent
        if (-not $added -and $file -and (Test-Path -Path $file -PathType Leaf -ErrorAction SilentlyContinue)) {
            $prevEnvLock = $env:GIT_OPTIONAL_LOCKS
            $env:GIT_OPTIONAL_LOCKS = '0'
            $null = git ls-files --error-unmatch $file 2>$null
            if ($LASTEXITCODE -eq 0) {
                # Only added lines count; removed lines and the "+++" header must not trigger the warning.
                $added = git diff -U0 -- $file 2>$null | Where-Object { $_ -match '^\+' -and $_ -notmatch '^\+\+\+' } | Out-String
            } else {
                $added = Get-Content -Path $file -Raw -ErrorAction SilentlyContinue
            }
            $env:GIT_OPTIONAL_LOCKS = $prevEnvLock
        }

        if ($added -match 'console\.log|debugger|TODO|FIXME') {
            $targetLabel = if ($file) { "in modified lines of $file" } else { "in recent tool modifications" }
            [Console]::Error.WriteLine("Warning: Detected debug statements or TODOs $targetLabel. Review before commit.")
        }
    }
} catch {
    # Ensure hook never breaks tool execution due to internal unexpected errors
}

exit 0
