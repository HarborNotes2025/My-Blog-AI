// あなたのブログ専用のAIチャットプログラム
export default async function handler(req, res) {
  // CORS設定（WordPressからのアクセスを許可する）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Gemini API key is not configured.' });
  }

  // AIに教え込む、あなたのブログ記事の情報（プロンプト）
  const systemInstruction = `
あなたはブログ「harbor-notes.com」の親切な案内助手です。
あなたの任務は、読者の質問に対して優しく答えつつ、ブログ内にある関連する記事を案内することです。

【あなたのブログの最重要記事】
■タイトル：外航船の航海士とは？世界の海を支えるプロフェッショナルの仕事
■URL：https://harbor-notes.com/onboard-job/navigator/
■概要：外航船の航海士の具体的な仕事内容や、世界の海を舞台に活躍するプロフェッショナルの魅力を伝える記事。

ユーザーから「航海士」「仕事内容」「外航船」「船乗り」に関する質問や、それに関連する法律・安全に関する話題が出たら、必ずこの記事のタイトルとURLを添えて、この記事を読むことをおすすめしてください。
もし全く関係のない質問（例：料理のレシピなど）をされた場合は、丁寧に雑談に応じつつも、「当ブログでは船や航海士に関する情報を発信しています」とアピールしてください。
`;

  try {
    // Gemini APIを呼び出す
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: systemInstruction + "\n\nユーザーからの質問: " + message }] }
        ]
      })
    });

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "申し訳ありません。うまく聞き取れませんでした。";

    // ここで一旦AIの回答を返します（※ログ保存は次のステップで行います）
    return res.status(200).json({ reply: replyText });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
