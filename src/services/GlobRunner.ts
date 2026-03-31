import { GlobOptions, GlobResult } from '../types'
import { InternalGlobOptions, Segment } from '../types/internal'
import { flat } from '../utils/array'
import {
  getDirectoryHandleSafe,
  getFileHandleSafe,
  getFileOrDirectoryHandleSafe,
} from '../utils/fileHandle'
import { isAnyMatch, parsePattern, splitPattern } from '../utils/glob'
import { appendTo, mapToArray } from '../utils/result'

export class GlobRunner {
  private _options: InternalGlobOptions
  private _dirOnly!: boolean

  constructor(options: GlobOptions) {
    const cwd = options.cwd,
      dot = !!options.dot,
      ignore = flat(options.ignore ?? []),
      matchBase = !!options.matchBase,
      maxDepth = options.maxDepth ?? Infinity,
      nodir = !!options.nodir,
      signal = options.signal

    this._options = {
      cwd,
      dot,
      ignore: [],
      matchBase,
      maxDepth,
      nodir,
      signal,
    }

    this._options.ignore = ignore.map((pattern) =>
      parsePattern(pattern, this._options),
    )
  }

  async run(pattern: string | string[]): Promise<GlobResult[]> {
    this._throwIfAborted()
    const expanded = flat(pattern).flatMap((pat) => splitPattern(pat, this._options))

    const result = new Map<string, GlobResult>()
    for (const segments of expanded) {
      appendTo(result, await this._run(segments))
    }

    return mapToArray(result)
  }

  private async _run(
    segments: Segment[],
  ): Promise<Map<string, GlobResult> | undefined> {
    const dirOnly = segments.at(-1) === ''
    this._dirOnly = dirOnly
    if (dirOnly) segments.pop()

    // 矛盾オプションの排除
    if (this._options.nodir && this._dirOnly) return

    const result = await this.walk(segments, this._options.cwd)
    if (!result) return

    return result
  }

  async walk(
    segments: Segment[],
    cwd: FileSystemDirectoryHandle,
    path: string[] = [],
    depth: number = 0,
  ): Promise<Map<string, GlobResult> | undefined> {
    const [first, ...rest] = segments
    if (first === '**') {
      const result = new Map<string, GlobResult>()
      if (rest.length === 0 && !this._options.nodir) {
        appendTo(result, this._getResult(path, cwd))
      }

      appendTo(result, await this.walkGlobstar(rest, cwd, path, depth))
      return result
    }

    // walkEntries, walkDirectories どちらも depth + 1 のエントリを見に行くのが確定しているので
    if (depth + 1 > this._options.maxDepth) return

    if (rest.length === 0) {
      return await this.walkEntries(first, cwd, path)
    } else {
      return await this.walkDirectories(first, rest, cwd, path, depth)
    }
  }

  async walkEntries(
    first: Segment,
    cwd: FileSystemDirectoryHandle,
    path: string[],
  ): Promise<Map<string, GlobResult> | undefined> {
    const result = new Map<string, GlobResult>()

    if (first instanceof RegExp) {
      for await (const handle of cwd.values()) {
        this._throwIfAborted()
        const newPath = path.concat(handle.name)

        if (this._dirOnly && handle instanceof FileSystemFileHandle) continue
        if (this._options.nodir && handle instanceof FileSystemDirectoryHandle) {
          continue
        }

        if (!first.test(handle.name)) continue
        if (isAnyMatch(handle, newPath, this._options.ignore)) continue

        appendTo(result, this._getResult(newPath, handle))
      }

      return result
    } else {
      this._throwIfAborted()

      let handle: FileSystemHandle | undefined
      if (this._dirOnly) {
        handle = await getDirectoryHandleSafe(cwd, first)
      } else if (this._options.nodir) {
        handle = await getFileHandleSafe(cwd, first)
      } else {
        handle = await getFileOrDirectoryHandleSafe(cwd, first)
      }

      if (!handle) return
      const newPath = path.concat(handle.name)

      if (isAnyMatch(handle, newPath, this._options.ignore)) return

      appendTo(result, this._getResult(newPath, handle))
      return result
    }
  }

  async walkDirectories(
    first: Segment,
    rest: Segment[],
    cwd: FileSystemDirectoryHandle,
    path: string[],
    depth: number,
  ): Promise<Map<string, GlobResult> | undefined> {
    if (first instanceof RegExp) {
      const result = new Map<string, GlobResult>()

      for await (const handle of cwd.values()) {
        this._throwIfAborted()
        const newPath = path.concat(handle.name)

        if (handle instanceof FileSystemDirectoryHandle) {
          if (!first.test(handle.name)) continue
          if (isAnyMatch(handle, newPath, this._options.ignore)) continue

          appendTo(result, await this.walk(rest, handle, newPath, depth + 1))
        }
      }

      return result
    } else {
      this._throwIfAborted()

      const handle = await getDirectoryHandleSafe(cwd, first)
      if (!handle) return
      const newPath = path.concat(handle.name)

      if (isAnyMatch(handle, newPath, this._options.ignore)) return
      return this.walk(rest, handle, newPath, depth + 1)
    }
  }

  async walkGlobstar(
    rest: Segment[],
    cwd: FileSystemDirectoryHandle,
    path: string[],
    depth: number,
  ): Promise<Map<string, GlobResult> | undefined> {
    const result = new Map<string, GlobResult>()
    if (depth + 1 > this._options.maxDepth) return

    if (rest.length === 0) {
      const matchAll = this._options.dot ? /.*/ : /^(?!\.)/
      appendTo(result, await this.walkEntries(matchAll, cwd, path))
    } else {
      appendTo(result, await this.walk(rest, cwd, path))
    }

    for await (const handle of cwd.values()) {
      this._throwIfAborted()
      const newPath = path.concat(handle.name)

      if (handle instanceof FileSystemDirectoryHandle) {
        if (!this._options.dot && handle.name.startsWith('.')) continue
        if (isAnyMatch(handle, newPath, this._options.ignore)) continue

        appendTo(result, await this.walkGlobstar(rest, handle, newPath, depth + 1))
      }
    }

    return result
  }

  _throwIfAborted(): void {
    if (this._options.signal?.aborted) {
      this._options.signal.throwIfAborted()
    }
  }

  _getResult(path: string[], handle: FileSystemHandle): GlobResult {
    return {
      path: path.join('/') || '.',
      name: handle.name,
      kind: handle.kind,
      handle: handle as any,
    }
  }
}
