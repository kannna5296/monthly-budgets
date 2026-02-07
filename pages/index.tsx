import React, { useState, useEffect } from 'react';

const Home: React.FC = () => {
  const [income, setIncome] = useState<string>('');
  const [savings, setSavings] = useState<string>('');
  const [categoriesMatrix, setCategoriesMatrix] = useState<string>(
    `,,,,ディズニー旅行,飲み会
固定費,家賃,20000,,
固定費,光熱費,5000,,
変動費,趣味・娯楽,20000,10000
変動費,交際費,10000,,60000`
  );
  const [adjLabels, setAdjLabels] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [status, setStatus] = useState<string>('');

  // parse matrix text into category objects (used for fallback or tests)
  const parseMatrixToObjects = (text: string) => {
    const headerLines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (headerLines.length === 0) return [];
    const headerCols = headerLines[0].split(',').map((c) => c.trim());
    const labels = headerCols.slice(3).map((c, i) => (c ? c : `adj${i + 1}`));
    const dataRows = headerLines.slice(1);
    return dataRows.map((r) => {
      const cols = r.split(',').map((c) => c.trim());
      const type = cols[0] || '';
      const name = cols[1] || '';
      const base = cols[2] ? Number(cols[2]) : 0;
      const adjustments: Array<{ label: string; amount: number }> = [];
      for (let i = 0; i < labels.length; i++) {
        const raw = cols[3 + i];
        if (raw !== undefined && raw !== '') {
          const amt = Number(raw);
          if (!Number.isNaN(amt)) adjustments.push({ label: labels[i], amount: amt });
        }
      }
      return { type, name, base, adjustments };
    });
  };

  // parse matrix text into editable table state
  const parseMatrixToState = (text: string) => {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length === 0) return { labels: [] as string[], rows: [] as string[][] };
    const headerCols = lines[0].split(',').map((c) => c.trim());
    const labels = headerCols.slice(3).map((c, i) => (c ? c : `adj${i + 1}`));
    const dataRows = lines.slice(1);
    const parsedRows = dataRows.map((r) => {
      const cols = r.split(',').map((c) => c.trim());
      const row: string[] = [];
      for (let i = 0; i < 3 + labels.length; i++) {
        row.push(cols[i] || '');
      }
      return row;
    });
    return { labels, rows: parsedRows };
  };

  // initialize table state from the existing categoriesMatrix when component mounts
  useEffect(() => {
    const parsed = parseMatrixToState(categoriesMatrix);
    setAdjLabels(parsed.labels);
    setRows(parsed.rows);
  }, []);
  // helpers for editing the table
  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    setRows((prev) => {
      const copy = prev.map((r) => r.slice());
      if (!copy[rowIndex]) return prev;
      copy[rowIndex][colIndex] = value;
      return copy;
    });
  };

  const addRow = () => {
    setRows((prev) => [...prev, [/* type */ '固定費', /* name */ '', /* base */ '', ...Array(adjLabels.length).fill('')]]);
  };

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const addAdjColumn = () => {
    setAdjLabels((prev) => [...prev, `adj${prev.length + 1}`]);
    setRows((prev) => prev.map((r) => [...r, '']));
  };

  const removeAdjColumn = () => {
    setAdjLabels((prev) => prev.slice(0, -1));
    setRows((prev) => prev.map((r) => r.slice(0, -1)));
  };

  const updateAdjLabel = (index: number, value: string) => {
    setAdjLabels((prev) => prev.map((v, i) => (i === index ? value : v)));
  };

  // submit handler: build payload from current table state
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Saving...');
    try {
      // validate rows: type must be '固定費' or '変動費'; base and adjustments must be numbers (or empty)
      for (let ri = 0; ri < rows.length; ri++) {
        const cols = rows[ri];
        const type = cols[0];
        if (!(type === '固定費' || type === '変動費')) {
          setStatus(`行 ${ri + 1}: 種別は「固定費」か「変動費」のいずれかを選択してください`);
          return;
        }
        const baseRaw = cols[2];
        if (baseRaw === undefined || baseRaw === '') {
          setStatus(`行 ${ri + 1}: ベース予算を数値で指定してください`);
          return;
        }
        const base = Number(baseRaw);
        if (Number.isNaN(base)) {
          setStatus(`行 ${ri + 1}: ベース予算は数値である必要があります`);
          return;
        }
        for (let ci = 0; ci < adjLabels.length; ci++) {
          const raw = cols[3 + ci];
          if (raw !== undefined && raw !== '') {
            const v = Number(raw);
            if (Number.isNaN(v)) {
              setStatus(`行 ${ri + 1} 補正列「${adjLabels[ci]}」は数値で指定してください`);
              return;
            }
          }
        }
      }

      const buildPayloadFromState = () => {
        const cats = rows.map((cols) => {
          const type = cols[0] || '';
          const name = cols[1] || '';
          const base = cols[2] ? Number(cols[2]) : 0;
          const adjustments: Array<{ label: string; amount: number }> = [];
          for (let i = 0; i < adjLabels.length; i++) {
            const raw = cols[3 + i];
            if (raw !== undefined && raw !== '') {
              const amt = Number(raw);
              if (!Number.isNaN(amt)) adjustments.push({ label: adjLabels[i], amount: amt });
            }
          }
          return { type, name, base, adjustments };
        });
        return {
          income: Number(income || 0),
          savingsGoal: Number(savings || 0),
          categories: cats
        };
      };

      const finalPayload = buildPayloadFromState();

      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalPayload)
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
          <label>カテゴリ（表エディタ） — type,category,base,adj1,adj2,...</label>
          <div style={{ overflowX: 'auto', marginTop: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ borderBottom: '1px solid #ccc', padding: 6 }}>種別</th>
                  <th style={{ borderBottom: '1px solid #ccc', padding: 6 }}>カテゴリ名</th>
                  <th style={{ borderBottom: '1px solid #ccc', padding: 6 }}>ベース予算</th>
                  {adjLabels.map((label, i) => (
                    <th key={i} style={{ borderBottom: '1px solid #ccc', padding: 6 }}>
                      <input
                        value={label}
                        onChange={(e) => updateAdjLabel(i, e.target.value)}
                        style={{ width: '100%' }}
                      />
                    </th>
                  ))}
                  <th style={{ borderBottom: '1px solid #ccc', padding: 6 }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci} style={{ padding: 6, borderBottom: '1px solid #eee' }}>
                        {ci === 0 ? (
                          <select
                            value={cell}
                            onChange={(e) => updateCell(ri, ci, e.target.value)}
                            style={{ width: '100%' }}
                          >
                            <option value="固定費">固定費</option>
                            <option value="変動費">変動費</option>
                          </select>
                        ) : (
                          <input
                            type={ci === 2 || ci >= 3 ? 'number' : 'text'}
                            inputMode={ci === 2 || ci >= 3 ? 'numeric' : undefined}
                            value={cell}
                            onChange={(e) => updateCell(ri, ci, e.target.value)}
                            style={{ width: '100%' }}
                          />
                        )}
                      </td>
                    ))}
                    <td style={{ padding: 6 }}>
                      <button type="button" onClick={() => removeRow(ri)} style={{ padding: '4px 8px' }}>
                        行を削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <button type="button" onClick={addRow} style={{ padding: '6px 12px' }}>
              行を追加
            </button>
            <button type="button" onClick={addAdjColumn} style={{ padding: '6px 12px' }}>
              補正列を追加
            </button>
            <button
              type="button"
              onClick={removeAdjColumn}
              disabled={adjLabels.length === 0}
              style={{ padding: '6px 12px' }}
            >
              補正列を削除
            </button>
          </div>
        </div>

        <button type="submit" style={{ padding: '8px 16px' }}>保存</button>
      </form>

      <div style={{ marginTop: 16 }}>{status}</div>
    </main>
  );
};

export default Home;
