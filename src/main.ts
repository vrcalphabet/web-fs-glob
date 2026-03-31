import { GlobRunner } from './services/GlobRunner'
import { GlobOptions, GlobResult } from './types'

export type * from './types/index'

/**
 * 与えられたglobパターンに一致するファイルやディレクトリを非同期で実行し、結果を返します。
 *
 * globの構文については、[globのREADME](https://www.npmjs.com/package/glob#user-content-glob-primer)を参照ください。
 *
 * @param pattern - 検索するglobパターン、またはパターンの配列
 * @param options - glob検索の動作を設定するオプション
 * @returns 一致したファイルやディレクトリの配列を返すPromise
 */
export function glob(
  pattern: string | string[],
  options: GlobOptions,
): Promise<GlobResult[]> {
  return new GlobRunner(options).run(pattern)
}
