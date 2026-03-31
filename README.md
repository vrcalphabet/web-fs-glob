# web-fs-glob

[![npm version](https://badge.fury.io/js/web-fs-glob.svg)](https://badge.fury.io/js/web-fs-glob)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

File System Access API (`FileSystemHandle`) 用の、高性能な glob ライブラリです。ブラウザ上のディレクトリハンドルに対して、glob パターンによるファイル検索を可能にします。

<figure>
  <img src="https://raw.githubusercontent.com/vrcalphabet/web-fs-glob/refs/heads/master/logo.svg" alt="logo">
  <figcaption style="text-align: right; font-size: 12px; color: gray;">
    <i>*ロゴは自作です！*</i>
  </figcaption>
</figure>

## 特徴

- **FileSystem Access API 対応**: `FileSystemDirectoryHandle` をルートとしたディレクトリ走査が可能です。
- **高性能なマッチング**: 内部に `picomatch` と `braces` を使用しており、複雑な階層でも正確に動作します。
- **一定時間でのキャンセル対応**: `AbortSignal` による処理の停止をサポートしています。
- **柔軟なオプション**: `maxDepth`, `ignore`, `dot`, `nodir`, `matchBase` など、標準的な glob オプションに一部対応しています。

## 例

この例では、`window.showDirectoryPicker()` で取得したディレクトリハンドルからファイルを検索します。

### 1. 基本的な使い方

`glob(pattern, options)` 関数を使用して、パターンに一致するエントリを非同期で取得します。
一致したエントリは、パス、名前、および対応する `FileSystemHandle` を含む配列で返されます。

```ts
import { glob } from 'web-fs-glob'

const button = document.querySelector('#button')
button.addEventListener('click', async () => {
  // ディレクトリハンドルを取得
  const handle = await window.showDirectoryPicker()

  // パターンを指定して検索
  const results = await glob('**/*.ts', {
    cwd: handle,
    dot: true,
    ignore: ['**/node_modules/**'],
  })

  // 結果の利用
  for (const result of results) {
    console.log(`${result.path} (${result.kind})`)

    if (result.kind === 'file') {
      // FileSystemFileHandle からファイルを取得
      const file = await result.handle.getFile()
      console.log('File size:', file.size)
    }
  }
})
```

### 2. オプションの利用

検索の深さや、ディレクトリを含めるかどうかなどの詳細な動作を制御できます。

```ts
const results = await glob('**/*', {
  cwd: handle,
  dot: true, // 隠しファイルも取得する
  ignore: ['**/node_modules/**'], // 特定のディレクトリやファイルを除外する
  matchBase: true, // パターンにスラッシュを含まない場合にすべての階層を対象にする
  maxDepth: 3, // 最大3階層まで検索
  nodir: true, // ディレクトリを除外してファイルのみ取得
  signal: AbortSignal.timeout(50), // 50ミリ秒経っても取得できない場合は強制停止する
})
```

### 3. キャンセル処理

`AbortSignal` を渡すことで、長時間かかる可能性のある検索処理を安全に中断できます。

```ts
try {
  const results = await glob('**/*.txt', {
    cwd: handle,
    signal: AbortSignal.timeout(1000),
  })
} catch (e) {
  if (e.name === 'AbortError') {
    console.log('検索がキャンセルされました')
  }
}
```

### 4. IIFEでの使用

通常のモジュール利用に加え、`<script>` タグ経由の読み込みも対応しています。
`<head>` タグ内の任意の場所に、以下のタグを追加するだけです。

スクリプト読み込み後は、`glob()` 関数がグローバルに登録されます。

```html
<script
  src="https://cdn.jsdelivr.net/npm/web-fs-glob/dist/main.iife.js"
  integrity="sha384-DEzXoSS8hvbasVBC8NtRFgtv3CNH8Y6NRH6lMH0Fb8Fy38dq9Bnkvxen4xOJFwNu"
  crossorigin="anonymous"
></script>
```

## インストール

```bash
npm install web-fs-glob
# or
yarn add web-fs-glob
# or
pnpm add web-fs-glob
```

## API

### `glob(pattern, options)`

- `pattern`: `string | string[]` - 検索する glob パターン、またはその配列。
- `options`: `GlobOptions` - 以下のオプションを指定可能。

| オプション   | 型                          | 説明                                                                                           |
| ------------ | --------------------------- | ---------------------------------------------------------------------------------------------- |
| `cwd`        | `FileSystemDirectoryHandle` | **必須**。検索を開始するルートディレクトリハンドル。                                           |
| `dot?`       | `boolean`                   | 隠しファイル（`.`で始まる）にマッチさせるか。 (デフォルト: `false`)                            |
| `ignore?`    | `string \| string[]`        | 検索から除外するエントリのパターン。 (デフォルト: `[]`)                                        |
| `matchBase?` | `boolean`                   | パターンにスラッシュが含まれていない場合、すべての階層でマッチさせるか。 (デフォルト: `false`) |
| `maxDepth?`  | `number`                    | 走査するディレクトリの最大深さ。 (デフォルト: `Infinity`)                                      |
| `nodir?`     | `boolean`                   | 結果からディレクトリを除外するか。 (デフォルト: `false`)                                       |
| `signal?`    | `AbortSignal`               | 検索を中断するためのシグナル。                                                                 |

### `GlobResult`

検索結果として返されるオブジェクトの型定義です。

```ts
type GlobResult = {
  path: string // cwd からの相対パス
  name: string // エントリ名
} & (
  | { kind: 'file'; handle: FileSystemFileHandle }
  | { kind: 'directory'; handle: FileSystemDirectoryHandle }
)
```

## 貢献

プロジェクトへの貢献を歓迎します！以下のルールに従うと，あなたの貢献がスムーズになります！

### Issue / PR

Issueを立てる際は，バグ報告・機能要望のどちらかを明記してください。
PRの説明には，目的・変更点・影響範囲・サンプルコードがあるとありがたいです。

## ライセンス

MIT License

詳細は[LICENSE](./LICENSE)ファイルを参照してください。
