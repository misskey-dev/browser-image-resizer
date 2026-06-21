## Unreleased
* **Breaking Change:** 画像縮小アルゴリズムの呼び出し方法が変更になりました。
  * 文字列で指定が可能でしたが、今後は使用したいアルゴリズムを個別にインポートして使用する必要があります。詳細はREADMEをご覧ください。
  * `defineImageResizingAlgorithm` を使用して独自のアルゴリズムを作成・使用することも可能です。
* **Breaking Change:** `argorithm` オプションは `algorithm` に名前が変更されました。
* 依存関係の更新


## 2024.1.0
* iOSで大きすぎる画像を処理できない問題を修正 https://github.com/misskey-dev/browser-image-resizer/issues/6
