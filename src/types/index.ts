/**
 * glob検索の動作を設定するオプション。
 */
export interface GlobOptions {
  /**
   * globの検索を開始するルートのディレクトリハンドル。
   */
  cwd: FileSystemDirectoryHandle
  /**
   * ピリオドから始まる隠しファイルや隠しディレクトリにマッチするようにします。
   * デフォルトでは、隠しファイルや隠しディレクトリにはマッチしません。
   *
   * @default false
   */
  dot?: boolean
  /**
   * 検索から除外するエントリのglobパターンまたはパターンの配列。
   *
   * @default []
   */
  ignore?: string | string[]
  /**
   * `true` の場合、globパターンにスラッシュが含まれていない場合にすべての階層にマッチするようになります。
   *
   * @default false
   */
  matchBase?: boolean
  /**
   * 走査するディレクトリの最大の深さ。
   *
   * @default Infinity
   */
  maxDepth?: number
  /**
   * 結果からディレクトリを除外します。
   *
   * @default false
   */
  nodir?: boolean
  /**
   * glob検索を中止するための `AbortSignal`。
   */
  signal?: AbortSignal
}

/**
 * globでマッチしたファイルまたはディレクトリを表します。
 */
export type GlobResult = {
  /**
   * マッチしたエントリのオプション `cwd` から見た相対パス。
   */
  path: string
  /**
   * マッチしたファイルまたはディレクトリの名前。
   */
  name: string
} & (
  | {
      /**
       * マッチしたエントリの種類。 `"file"`または`"directory"` です。
       */
      kind: 'file'
      /**
       * マッチしたエントリに関連付けられたファイルハンドル。
       *
       * `kind` が `"file"` の場合は、 `FileSystemFileHandle`。 `kind` が `"directory"` の場合は、 `FileSystemDirectoryHandle` になります。
       */
      handle: FileSystemFileHandle
    }
  | {
      /**
       * マッチしたエントリの種類。 `"file"`または`"directory"` です。
       */
      kind: 'directory'
      /**
       * マッチしたエントリに関連付けられたファイルハンドル。
       *
       * `kind` が `"file"` の場合は、 `FileSystemFileHandle`。 `kind` が `"directory"` の場合は、 `FileSystemDirectoryHandle` になります。
       */
      handle: FileSystemDirectoryHandle
    }
)
