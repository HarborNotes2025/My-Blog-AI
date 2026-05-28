export default async function handler(req, res) {
    // CORS（別サイトからの通信）を許可する設定
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // OPTIONSリクエストへの即時返答
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { message } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(200).json({ reply: '申し訳ありません。AIの鍵（APIキー）が設定されていません。' });
    }

    try {
        // ドキュメント通りの最新モデル「gemini-3.5-flash」のエンドポイントに修正
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: "あなたは親切な外航船の航海士ナビゲーターAIです。質問に対して、専門知識を交えつつ分かりやすく日本語で答えてください。\n\n質問: " + message
                    }]
                }]
            })
        });

        const data = await response.json();
        
        // 返答データの解析
        if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts) {
            const replyText = data.candidates[0].content.parts[0].text;
            return res.status(200).json({ reply: replyText });
        } else {
            console.error('Gemini Error Response:', JSON.stringify(data));
            return res.status(200).json({ reply: '申し訳ありません。AIからの応答が解析できませんでした。' });
        }

    } catch (error) {
        console.error('Fetch Error:', error);
        return res.status(200).json({ reply: '通信エラーが発生しました。' });
    }
}
