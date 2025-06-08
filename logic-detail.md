# 4色オセロ ロジック詳細解説

このドキュメントは、4色オセロWebアプリ（5×5盤面、赤・青・緑・白）のJavaScriptロジックについて、実装者や興味のある開発者向けに詳しく解説します。

---

## 1. 盤面・石の管理

- **盤面サイズ**: 5×5（`size = 5`）
- **セル管理**: `cells`配列（各セルはdiv要素、`dataset.color`で色を管理）
- **色の種類**: 'red', 'blue', 'green', 'white'（空は空文字）

---

## 2. 石を置けるか判定（canFlip）

### 目的
指定マス(row, col)に指定色(color)の石を置いたとき、オセロのルールでひっくり返せる石があるかを判定。

### アルゴリズム
1. すでに石が置かれている場合は`false`を返す。
2. 8方向（縦横斜め）それぞれについて調べる。
3. 隣接マスから進み、
   - 空マスまたは自分の色ならbreak（その方向は不可）。
   - 他色の石が1つでもあれば`foundOther = true`。
   - さらに進み、もし自分の色の石が見つかり、かつ間に他色の石が1つ以上あれば`true`（＝ひっくり返せる）。
4. どの方向でも条件を満たさなければ`false`。

### コード例
```js
function canFlip(row, col, color) {
  if (getCellColor(row, col)) return false;
  const dirs = [
    [0, 1], [1, 0], [0, -1], [-1, 0],
    [1, 1], [1, -1], [-1, 1], [-1, -1]
  ];
  for (const [dr, dc] of dirs) {
    let r = row + dr;
    let c = col + dc;
    let foundOther = false;
    while (r >= 0 && r < size && c >= 0 && c < size) {
      const cellColor = getCellColor(r, c);
      if (!cellColor || cellColor === color) break;
      foundOther = true;
      r += dr;
      c += dc;
      if (getCellColor(r, c) === color && foundOther) return true;
    }
  }
  return false;
}
```

---

## 3. 石の反転処理

### flipLine
- 指定方向に他色の石を集め、最後が自分の色なら全て自分の色に変更。
- 履歴（history）も記録。

### flipLineAnimated
- 上記と同じだが、flip-config.jsonで指定した間隔で1つずつアニメーション反転。

---

## 4. 特殊ルール（アタックチャンス）
- 残り4マス時に1回だけ発動。
- 既存の石を1つ消せる（黄色で点滅・枠表示）。
- 発動中は通常操作不可、UIメッセージ表示。

---

## 5. 補助関数
- `getCellColor(row, col)`: セルの色取得
- `hasAnyFlippable(color)`: どこかに置けるか
- `isAdjacentToColor(row, col, color)`: 隣接判定
- `canBeSandwichedNextStrict`など: 特殊な置き方判定

---

## 6. その他
- 盤面保存/復元（localStorage）
- クイズ連携、UI制御

---

### 参考
- コード: `src/js/script.js`
- UI/スタイル: `index.html`, `style.css`
