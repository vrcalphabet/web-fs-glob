import { GlobResult } from '../types'

export function appendTo(
  target: Map<string, GlobResult>,
  source: Map<string, GlobResult> | GlobResult | undefined,
): void {
  if (!source) return

  if (source instanceof Map) {
    for (const [path, result] of source) {
      target.set(path, result)
    }

    source.clear()
  } else {
    target.set(source.path, source)
  }
}

export function mapToArray(target: Map<string, GlobResult>): GlobResult[] {
  const result: GlobResult[] = []
  for (const item of target.values()) {
    result.push(item)
  }
  return result
}
