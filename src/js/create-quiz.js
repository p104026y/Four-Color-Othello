// クイズ作成ページ用スクリプト
window.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('quiz-create-form');
  const result = document.getElementById('quiz-create-result');
  // 画像ドロップ・プレビュー処理
  const imageInput = document.querySelector('input[name="image"]');
  const dropArea = document.getElementById('image-drop-area');
  const preview = document.getElementById('image-preview');
  if (dropArea && imageInput) {
    dropArea.addEventListener('dragover', e => {
      e.preventDefault();
      dropArea.style.background = '#f0f8ff';
    });
    dropArea.addEventListener('dragleave', e => {
      e.preventDefault();
      dropArea.style.background = '';
    });
    dropArea.addEventListener('drop', e => {
      e.preventDefault();
      dropArea.style.background = '';
      const file = e.dataTransfer.files[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        alert('画像ファイルをドロップしてください');
        return;
      }
      const reader = new FileReader();
      reader.onload = function(ev) {
        imageInput.value = ev.target.result;
        preview.innerHTML = `<img src='${ev.target.result}' style='max-width:100%;max-height:180px;border-radius:8px;'>`;
      };
      reader.readAsDataURL(file);
    });
    imageInput.addEventListener('input', () => {
      if (imageInput.value.match(/^data:image\//)) {
        preview.innerHTML = `<img src='${imageInput.value}' style='max-width:100%;max-height:180px;border-radius:8px;'>`;
      } else if (imageInput.value) {
        preview.innerHTML = `<img src='${imageInput.value}' style='max-width:100%;max-height:180px;border-radius:8px;'>`;
      } else {
        preview.innerHTML = '';
      }
    });
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const category = form.category.value;
    const difficulty = form.difficulty.value;
    const title = form.title.value;
    const question = form.question.value;
    const hint = form.hint.value;
    const answer = form.answer.value;
    const caption = form.caption.value;
    const image = form.image.value;
    result.innerHTML = `<div class='quiz-preview'><b>カテゴリ:</b> ${category}<br><b>難易度:</b> ${difficulty}<br><b>タイトル:</b> ${title}<br><b>問題:</b> ${question}<br><b>ヒント:</b> ${hint}<br><b>答え:</b> ${answer}<br><b>キャプション:</b> ${caption}<br>${image ? `<img src='${image}' style='max-width:100%;max-height:180px;border-radius:8px;'>` : ''}</div>`;
  });

  // クイズ登録処理
  const registerBtn = document.getElementById('quiz-register-btn');
  if (registerBtn) {
    registerBtn.addEventListener('click', async () => {
      const form = document.getElementById('quiz-create-form');
      const category = form.category.value;
      const difficulty = form.difficulty.value;
      const title = form.title.value;
      const question = form.question.value;
      const hint = form.hint.value;
      const answer = form.answer.value;
      const caption = form.caption.value;
      const image = form.image.value;
      // 既存のquiz-data.jsonを取得
      let quizData;
      try {
        const res = await fetch('./quiz-data.json');
        quizData = await res.json();
      } catch (e) {
        alert('quiz-data.jsonの読み込みに失敗しました');
        return;
      }
      // ID自動生成: 日本語カテゴリ名＋連番
      const catLabel = (quizData.categories.find(c => c.id === category)?.label || category);
      const usedIds = quizData.quizzes.filter(q => q.category === category).map(q => q.id);
      let num = 1;
      let newId = catLabel + String(num).padStart(2, '0');
      while (usedIds.includes(newId)) {
        num++;
        newId = catLabel + String(num).padStart(2, '0');
      }
      // 新しいクイズを追加
      quizData.quizzes.push({ id: newId, category, difficulty, title, question, hint, answer, caption, image });
      // サーバーにPOSTして保存
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
