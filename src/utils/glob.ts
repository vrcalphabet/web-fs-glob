import braces from 'braces'
import { makeRe, parse, scan } from 'picomatch/posix'
import { InternalGlobOptions, Segment } from '../types/internal'
import { isEscape, randomString, replace } from './string'

const BRACE_OPEN = `__${randomString()}_OPEN__`
const BRACE_CLOSE = `__${randomString()}_CLOSE__`

function normalizeGlob(pattern: string, matchBase: boolean): string {
  pattern = pattern
    .replace(/#.+$/, '')
    .replace(/(?<=^|\/)\.\//g, '')
    .replace(/(\*\*\/)+/g, '**/')
    .replace(/\/+/g, '/')

  if (matchBase && !pattern.includes('/') && pattern !== "**") {
    pattern = `**/${pattern}`
  }

  return pattern
}

function normalizeBraces(pattern: string): string {
  let braceIndexStack = []

  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === '{' && !isEscape(pattern, i)) {
      braceIndexStack.push(i)
    } else if (pattern[i] === '}' && !isEscape(pattern, i)) {
      const lastIndex = braceIndexStack.pop()
      if (lastIndex === undefined) continue

      const seg = pattern.slice(lastIndex, i + 1)
      if (!seg.includes('/')) {
        const replaced = `@${braces(seg)[0]}`
          .replaceAll('{', BRACE_OPEN)
          .replaceAll('}', BRACE_CLOSE)
        pattern = replace(pattern, lastIndex, i + 1, replaced)

        i += replaced.length - seg.length
      }
    }
  }

  return pattern
}

export function splitPattern(
  pattern: string,
  options: InternalGlobOptions,
): Segment[][] {
  const expanded = braces(
    normalizeBraces(normalizeGlob(pattern, options.matchBase)),
    { expand: true },
  )

  return expanded.map((exp) => {
    const segments = exp.split('/')

    return segments.map((seg) => {
      if (seg === '**') return '**'
      if (isLiteral(seg)) return seg

      const parsed = parse(seg, {
        dot: options.dot,
        nocase: true,
        posix: true,
        strictBrackets: true,
      })

      return createRegexp(
        parsed.output.replaceAll(BRACE_OPEN, '{').replaceAll(BRACE_CLOSE, '}'),
      )
    })
  })
}

export function parsePattern(pattern: string, options: InternalGlobOptions): RegExp {
  const [expanded] = braces(normalizeGlob(pattern, options.matchBase))

  return makeRe(expanded, {
    dot: options.dot,
    nocase: true,
    posix: true,
    strictBrackets: true,
  })
}

function isLiteral(segment: string) {
  const scanned = scan(segment, { posix: true })

  if (!scanned.isGlob) return true
  return !(
    scanned.isExtglob ||
    scanned.isBracket ||
    scanned.input.match(/(?<!\\)[*?]/)
  )
}

function createRegexp(regexp: string): RegExp {
  return new RegExp(`^(?:${regexp})$`, 'i')
}

export function isAnyMatch(
  handle: FileSystemHandle,
  path: string[],
  patterns: RegExp[],
): boolean {
  let pathString = path.join('/')
  if (handle instanceof FileSystemDirectoryHandle) {
    pathString += '/'
  }

  return patterns.some((pattern) => pattern.test(pathString))
}
