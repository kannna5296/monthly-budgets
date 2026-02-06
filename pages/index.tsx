import React, { useState } from 'react';

const Home: React.FC = () => {
  const [income, setIncome] = useState<string>('');
  const [savings, setSavings] = useState<string>('');
  const [categoriesJson, setCategoriesJson] = useState<string>('[]');
  const [status, setStatus] = useState<string>('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Saving...');
    try {
      const payload = {
        income: Number(income || 0),
        savingsGoal: Number(savings || 0),
        categories: JSON.parse(categoriesJson)
      };

      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setStatus('Saved successfully');
      } else {
        const text = await res.text();
        setStatus(`Error: ${text}`);
      }
    } catch (err) {
      setStatus(`Error: ${String(err)}`);
    }
  };

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1>月次家計予算作成（デモ）</h1>
      <form onSubmit={onSubmit} style={{ maxWidth: 700 }}>
        <div style={{ marginBottom: 12 }}>
          <label>収入（円）</label>
          <br />
          <input
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            inputMode="numeric"
            style={{ width: '100%', padding: 8 }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>貯金目標（円）</label>
          <br />
          <input
            value={savings}
            onChange={(e) => setSavings(e.target.value)}
            inputMode="numeric"
            style={{ width: '100%', padding: 8 }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>カテゴリ（JSON配列、例を下に記載）</label>
          <br />
          <textarea
            value={categoriesJson}
            onChange={(e) => setCategoriesJson(e.target.value)}
            rows={8}
            style={{ width: '100%', padding: 8 }}
          />
          <small>
            {`例: [{"name":"家賃","type":"fixed","base":80000,"adjustments":[]}, {"name":"食費","type":"variable","base":30000,"adjustments":[{"label":"帰省","amount":5000}]}]`}
          </small>
        </div>

        <button type="submit" style={{ padding: '8px 16px' }}>保存</button>
      </form>

      <div style={{ marginTop: 16 }}>{status}</div>
    </main>
  );
};

export default Home;
