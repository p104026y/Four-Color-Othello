// クイズ作成ページ用スクリプト
window.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('quiz-create-form');
  const result = document.getElementById('quiz-create-result');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const category = form.category.value;
    const difficulty = form.difficulty.value;
    const question = form.question.value;
    const answer = form.answer.value;
    result.innerHTML = `<div class='quiz-preview'><b>カテゴリ:</b> ${category}<br><b>難易度:</b> ${difficulty}<br><b>問題:</b> ${question}<br><b>答え:</b> ${answer}</div>`;
  });

  // クイズ登録処理
  const registerBtn = document.getElementById('quiz-register-btn');
  if (registerBtn) {
    registerBtn.addEventListener('click', async () => {
      const form = document.getElementById('quiz-create-form');
      const category = form.category.value;
      const difficulty = form.difficulty.value;
      const question = form.question.value;
      const answer = form.answer.value;
      // 既存のquiz-data.jsonを取得
      let quizData;
      try {
        const res = await fetch('./quiz-data.json');
        quizData = await res.json();
      } catch (e) {
        alert('quiz-data.jsonの読み込みに失敗しました');
        return;
      }
      // 新しいクイズを追加
      quizData.quizzes.push({ category, difficulty, question, answer });
      // サーバーにPOSTして保存（要: proxy.jsなどでAPI実装）
      const saveRes = await fetch('/api/save-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quizData)
      });
      if (saveRes.ok) {
        alert('クイズを登録しました！');
      } else {
        alert('登録に失敗しました');
      }
    });
  }
});
