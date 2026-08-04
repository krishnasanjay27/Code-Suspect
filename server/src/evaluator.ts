import { spawn } from 'child_process'
import type { TestCase } from './types.js'

export interface TestResult {
  id: string
  name: string
  passed: boolean
  error: string | null
}

const TIMEOUT_MS = 3000      // kill Python after 3 seconds
const MAX_CODE_LENGTH = 5000 // reject suspiciously large payloads

// dangerous patterns we refuse to run regardless of context
const BLOCKED_PATTERNS = [
  /import\s+os/,
  /import\s+sys/,
  /import\s+subprocess/,
  /import\s+socket/,
  /import\s+requests/,
  /open\s*\(/,
  /__import__/,
  /exec\s*\(/,
  /eval\s*\(/,
  /compile\s*\(/,
]

function isSafeCode(code: string): boolean {
  return !BLOCKED_PATTERNS.some(pattern => pattern.test(code))
}

function buildTestScript(playerCode: string, testCases: TestCase[]): string {
  // wrap each assertion in a try/except so one failure doesn't block others
  const testBlocks = testCases.map(tc => `
try:
    _result = bool(${tc.assertion})
    print("PASS:${tc.id}" if _result else "FAIL:${tc.id}")
except Exception as e:
    print(f"ERROR:${tc.id}:{str(e)[:100]}")
`).join('\n')

  return `
${playerCode}

# ── test runner ──────────────────────────────────────
${testBlocks}
`
}

export async function runTests(
  playerCode: string,
  testCases: TestCase[]
): Promise<TestResult[]> {
  // 1. reject if too long
  if (playerCode.length > MAX_CODE_LENGTH) {
    return testCases.map(tc => ({
      id: tc.id,
      name: tc.name,
      passed: false,
      error: 'Code too long',
    }))
  }

  // 2. static safety check
  if (!isSafeCode(playerCode)) {
    return testCases.map(tc => ({
      id: tc.id,
      name: tc.name,
      passed: false,
      error: 'Blocked: unsafe code pattern detected',
    }))
  }

  // 3. build the script
  const script = buildTestScript(playerCode, testCases)

  // 4. run it
  const output = await executePython(script)

  // 5. parse results
  return parseResults(output, testCases)
}

function executePython(script: string): Promise<string> {
  return new Promise((resolve) => {
    // Windows usually uses 'python', Linux/Mac uses 'python3'
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3'

    const proc = spawn(pythonCmd, [
      '-c', script,
    ], {
      timeout: TIMEOUT_MS,
      env: {
        // minimal environment — no HOME, no PATH to real tools (except on Windows where we need the actual PATH)
        PATH: process.platform === 'win32' ? process.env.PATH : '/usr/bin:/bin',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (d: Buffer) => {
      stdout += d.toString()
      // safety cap — stop reading if output is suspiciously large
      if (stdout.length > 10_000) proc.kill('SIGKILL')
    })

    proc.stderr.on('data', (d: Buffer) => {
      stderr += d.toString().slice(0, 500)
    })

    proc.on('close', (code, signal) => {
      if (signal === 'SIGKILL' || code === null) {
        // process was killed — timeout or output cap
        resolve('TIMEOUT')
      } else {
        resolve(stdout)
      }
    })

    proc.on('error', () => resolve('ERROR'))
  })
}

function parseResults(output: string, testCases: TestCase[]): TestResult[] {
  if (output === 'TIMEOUT') {
    return testCases.map(tc => ({
      id: tc.id,
      name: tc.name,
      passed: false,
      error: 'Timed out — possible infinite loop',
    }))
  }

  return testCases.map(tc => {
    const passLine  = `PASS:${tc.id}`
    const failLine  = `FAIL:${tc.id}`
    const errorLine = `ERROR:${tc.id}:`

    if (output.includes(passLine)) {
      return { id: tc.id, name: tc.name, passed: true, error: null }
    }
    if (output.includes(failLine)) {
      return { id: tc.id, name: tc.name, passed: false, error: null }
    }
    const errMatch = output.match(new RegExp(`ERROR:${tc.id}:(.+)`))
    if (errMatch) {
      return { id: tc.id, name: tc.name, passed: false, error: errMatch[1] }
    }
    // test case line never appeared — syntax error in player code
    return { id: tc.id, name: tc.name, passed: false, error: 'Syntax error' }
  })
}