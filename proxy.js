const express = require('express');
const fetch = require('node-fetch').default;
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
app.use(cors());
app.use(express.json());


// クイズデータ保存API
app.post('/api/save-quiz', (req, res) => {
  const data = req.body;
  const filePath = path.join(process.cwd(), 'quiz-data.json');
  fs.writeFile(filePath, JSON.stringify(data, null, 2), err => {
    if (err) {
      console.error('Failed to save quiz-data.json:', err);
      return res.status(500).json({ error: 'Failed to save quiz-data.json', details: err.message });
    }
    res.json({ ok: true });
  });
});

app.listen(3001, () => console.log('Proxy server running on http://localhost:3001'));
