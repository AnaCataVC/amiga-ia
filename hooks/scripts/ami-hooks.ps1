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

        if ($cmd -match 'git commit') {
            [Console]::Error.WriteLine('Reminder: Use commit-assistant for proper commit formatting.')
        }
        if ($cmd -match 'git push') {
            [Console]::Error.WriteLine('Reminder: Run push-assistant agent before pushing code.')
        }
        if ($cmd -match 'gh pr create') {
            [Console]::Error.WriteLine('Reminder: Consider running ami-detect-pr-conflicts or ami-pr-publisher before creating PR.')
        }
    }
    elseif ($Event -eq 'PostToolUse') {
        $file = $null
        if ($null -ne $payload) {
            if ($null -ne $payload.tool_input) {
                if ($null -ne $payload.tool_input.file_path) { $file = $payload.tool_input.file_path }
                elseif ($null -ne $payload.tool_input.TargetFile) { $file = $payload.tool_input.TargetFile }
                elseif ($null -ne $payload.tool_input.AbsolutePath) { $file = $payload.tool_input.AbsolutePath }
            }
            if (-not $file) {
                if ($null -ne $payload.TargetFile) { $file = $payload.TargetFile }
                elseif ($null -ne $payload.AbsolutePath) { $file = $payload.AbsolutePath }
            }
        }

        if (-not $file -and ($rawInput -match '"(?:file_path|TargetFile|AbsolutePath)"\s*:\s*"([^"]*)"')) {
            $file = $Matches[1]
        }

        if ($file -and (Test-Path -Path $file -PathType Leaf -ErrorAction SilentlyContinue)) {
            $null = git ls-files --error-unmatch $file 2>$null
            $added = ""
            if ($LASTEXITCODE -eq 0) {
                $added = git diff -U0 $file 2>$null | Out-String
            } else {
                $added = Get-Content -Path $file -Raw -ErrorAction SilentlyContinue
            }

            if ($added -match 'console\.log|debugger|TODO|FIXME') {
                [Console]::Error.WriteLine("Warning: Detected debug statements or TODOs in modified lines of $file. Review before commit.")
            }
        }
    }
} catch {
    # Ensure hook never breaks tool execution due to internal unexpected errors
}

exit 0
