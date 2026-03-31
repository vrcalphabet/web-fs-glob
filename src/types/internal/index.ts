export type Segment = '**' | string | RegExp

export interface InternalGlobOptions {
  cwd: FileSystemDirectoryHandle
  dot: boolean
  ignore: RegExp[]
  matchBase: boolean
  maxDepth: number
  nodir: boolean
  signal?: AbortSignal
}
