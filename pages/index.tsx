import React, { useEffect, useState } from 'react';
import styles from '../styles/Table.module.css';
import type { MonthlyBudgetRecord } from '../types/budget';

type SavedMonth = { year: number; month: number };

export default function Home(): JSX.Element {
  const now = new Date();
  const [income, setIncome] = useState('');
  const [savings, setSavings] = useState('');
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const pad2 = (n: number) => String(n).padStart(2, '0');
  const [ymInput, setYmInput] = useState(`${year}-${pad2(Number(month))}`);
  const [ymError, setYmError] = useState('');
  const tryParseYm = (val: string): { year: number; month: number } | null => {
    const v = val.trim();
    const m = v.match(/^(\d{4})[-\/]?(\d{1,2})$/);
    if (!m) return null;
    const y = Number(m[1]);
    const mon = Number(m[2]);
    if (Number.isNaN(y) || Number.isNaN(mon)) return null;
    if (y <= 0 || mon < 1 || mon > 12) return null;
    return { year: y, month: mon };
  };
  const [savedMonths, setSavedMonths] = useState<SavedMonth[]>([]);
  const [status, setStatus] = useState('');
  const [adjLabels, setAdjLabels] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([['固定費', '', '']]);
  // 初期マトリクス（CSV風）
  const initialMatrix = `,,,,ディズニー旅行,飲み会
固定費,家賃,20000,,
固定費,光熱費,5000,,
変動費,趣味・娯楽,20000,10000,
変動費,交際費,10000,,60000`;

  const parseMatrix = (text: string) => {
    const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length === 0) return { labels: [] as string[], rows: [] as string[][] };
    const header = lines[0].split(',').map((c) => c.trim());
    const labels = header.slice(3).map((c) => c || '');
    const data = lines.slice(1).map((ln) => {
      const cols = ln.split(',').map((c) => c.trim());
      const row: string[] = [];
      const totalCols = 3 + labels.length;
      for (let i = 0; i < totalCols; i++) row.push(cols[i] || '');
      return row;
    });
    return { labels, rows: data };
  };
  const [cellErrors, setCellErrors] = useState<string[][]>([]);
  const [isSaveDisabled, setIsSaveDisabled] = useState(true);
  const [incomeError, setIncomeError] = useState('');

  const addRow = () => setRows((r) => [...r, ['固定費', '', ...Array(adjLabels.length + 1).fill('')].slice(0, 3 + adjLabels.length)]);
  const removeRow = (idx: number) => setRows((r) => r.filter((_, i) => i !== idx));

  const computeRowTotal = (row: string[]) => {
    const base = Number(row[2]);
    if (Number.isNaN(base)) return '';
    let total = base;
    for (let i = 0; i < adjLabels.length; i++) {
      const v = Number(row[3 + i]);
      if (!Number.isNaN(v)) total += v;
    }
    return total.toLocaleString() + ' 円';
  };

  // numeric total for a row (used in remaining calculation)
  const numericRowTotal = (row: string[]) => {
    const base = Number(row[2]);
    let total = Number.isNaN(base) ? 0 : base;
    for (let i = 0; i < adjLabels.length; i++) {
      const v = Number(row[3 + i]);
      if (!Number.isNaN(v)) total += v;
    }
    return total;
  };

  const validateCell = (ci: number, v: string) => {
    if (ci === 0) return v === '固定費' || v === '変動費' ? '' : '固定費または変動費を選択してください';
    if (ci === 2) {
      if (!v) return 'ベースは必須です';
      return Number.isNaN(Number(v)) ? '数値で入力してください' : '';
    }
    if (ci >= 3) {
      return !v || !Number.isNaN(Number(v)) ? '' : '数値で入力してください';
    }
    return '';
  };

  const runValidation = () => {
    // ensure cellErrors matrix matches rows x (3 + adjLabels.length)
    const colsCount = 3 + adjLabels.length;
    const errs: string[][] = rows.map((r) => Array(colsCount).fill(''));
    for (let ri = 0; ri < rows.length; ri++) {
      const r = rows[ri] || [];
      for (let ci = 0; ci < colsCount; ci++) {
        const v = r[ci] ?? '';
        errs[ri][ci] = validateCell(ci, v);
      }
    }
    setCellErrors(errs);

    // top-level validation for year/month
    const y = Number(year);
    const m = Number(month);
    const ymValid = !Number.isNaN(y) && y > 0 && !Number.isNaN(m) && m >= 1 && m <= 12;
    setYmError(ymValid ? '' : '年と月は YYYY-MM の形式で有効な年月を入力してください');

    // income validation: must be a number >= 1
    const inc = Number(income);
    const incomeValid = !Number.isNaN(inc) && inc >= 1;
    setIncomeError(incomeValid ? '' : '収入は 1 以上で入力してください');

    const anyCellError = errs.some((r) => r.some(Boolean));
    setIsSaveDisabled(anyCellError || !ymValid || !incomeValid);
    return !anyCellError && ymValid && incomeValid;
  };

  useEffect(() => {
    runValidation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, adjLabels, year, month, income, savings]);

  const buildPayloadFromState = () => {
    const categories = rows.map((cols) => {
      const type = (cols[0] || '') as '固定費' | '変動費';
      const name = cols[1] || '';
      const base = cols[2] ? Number(cols[2]) : 0;
      const adjustments: Array<{ label: string; amount: number }> = [];
      for (let i = 0; i < adjLabels.length; i++) {
        const raw = cols[3 + i];
        if (raw !== undefined && raw !== '') {
          const n = Number(raw);
          if (!Number.isNaN(n)) adjustments.push({ label: adjLabels[i], amount: n });
        }
      }
      return { type, name, base, adjustments };
    });

    return {
      income: Number(income || 0),
      savingsGoal: Number(savings || 0),
      year: Number(year || 0),
      month: Number(month || 0),
      categories,
    };
  };

  const saveToServer = async () => {
    if (!runValidation()) {
      setStatus('入力エラーがあります');
      return;
    }
    setStatus('保存中...');
    try {
      const payload = buildPayloadFromState();
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setStatus('保存しました');
        // refresh saved months so the newly created/updated month appears
        await fetchSavedMonths();
        return data;
      }
      const text = await res.text();
      setStatus(`保存に失敗しました: ${text}`);
    } catch (err) {
      setStatus(`保存エラー: ${String(err)}`);
    }
  };

  const addAdjColumn = () => {
    setAdjLabels((prev) => {
      const next = [...prev, `補正${prev.length + 1}`];
      // extend existing rows
      setRows((rs) => rs.map((r) => [...r, '']));
      return next;
    });
  };

  const removeAdjColumn = () => {
    setAdjLabels((prev) => {
      if (prev.length === 0) return prev;
      const next = prev.slice(0, -1);
      setRows((rs) => rs.map((r) => r.slice(0, Math.max(3, r.length - 1))));
      return next;
    });
  };

  const updateAdjLabel = (index: number, value: string) => {
    setAdjLabels((prev) => prev.map((v, i) => (i === index ? value : v)));
  };

  useEffect(() => {
    (async () => {
      // すでに策定済みの予算がある場合は、最新のものをロードする
      const list = await fetchSavedMonths();
      // if there are saved months, load the most recent one
      if (list && list.length > 0) {
        const latest = list[list.length - 1];
        // loadMonth will populate top-level fields, adjLabels and rows
        await loadMonth(latest.year, latest.month);
        return;
      }
      // 保存済みデータが無い場合のみ初期シードを表示する
      const parsed = parseMatrix(initialMatrix);
      setAdjLabels(parsed.labels);
      setRows(parsed.rows.length > 0 ? parsed.rows : [['固定費', '', '']]);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSavedMonths = async (): Promise<SavedMonth[]> => {
    try {
      const res = await fetch('/api/budgets');
      if (!res.ok) return [];
      const all = await res.json();
      const map = new Map<string, SavedMonth>();
      (all || []).forEach((it: any) => {
        const y = Number(it.year);
        const m = Number(it.month);
        if (!Number.isNaN(y) && !Number.isNaN(m)) map.set(`${y}-${m}`, { year: y, month: m });
      });
      const list = Array.from(map.values()).sort((a, b) => (a.year - b.year) || (a.month - b.month));
      setSavedMonths(list);
      return list;
    } catch (err) {
      // ignore for now
      return [];
    }
  };

  const loadMonth = async (y: number, m: number) => {
    setStatus('読み込み中...');
    try {
      const res = await fetch(`/api/budgets?year=${y}&month=${m}`);
      if (!res.ok) {
        setStatus('データが見つかりません');
        return;
      }
      const d: MonthlyBudgetRecord = await res.json();
      // top-level fields
      setIncome(String(d.income ?? ''));
      setSavings(String(d.savingsGoal ?? ''));
      setYear(String(d.year ?? y));
      setMonth(String(d.month ?? m));
      setYmInput(`${d.year}-${pad2(d.month)}`);

      // reconstruct adjLabels as the ordered union of all adjustment labels
      const labelOrder: string[] = [];
      (d.categories || []).forEach((cat) => {
        (cat.adjustments || []).forEach((adj) => {
          if (!labelOrder.includes(adj.label)) labelOrder.push(adj.label);
        });
      });
      setAdjLabels(labelOrder);

      // build rows: [type, name, base, ...adjustmentValues]
      const newRows = (d.categories || []).map((cat) => {
        const row = Array(3 + labelOrder.length).fill('');
        row[0] = cat.type;
        row[1] = cat.name;
        row[2] = String(cat.base ?? '');
        (cat.adjustments || []).forEach((adj) => {
          const idx = labelOrder.indexOf(adj.label);
          if (idx !== -1) row[3 + idx] = String(adj.amount ?? '');
        });
        return row;
      });
      setRows(newRows.length > 0 ? newRows : [['固定費', '', '']]);

      setStatus('読み込み完了');
    } catch (err) {
      setStatus(String(err));
    }
  };

  return (
    <main className={styles.main}>
      <h1>今月の予算</h1>
      <div className={styles.twoCol}>
        <section className={styles.leftCol}>
          <form className={styles.form} onSubmit={async (e) => { e.preventDefault(); await saveToServer(); }}>
            {/* 年月（単一セル） */}
            <div style={{ marginBottom: 12 }}>
              <label>年月 (YYYY-MM)</label>
              <input value={ymInput} onChange={(e) => { setYmInput(e.target.value); const parsed = tryParseYm(e.target.value); if (parsed) { setYear(String(parsed.year)); setMonth(String(parsed.month)); setYmError(''); } else { setYmError('年と月は YYYY-MM の形式で有効な年月を入力してください'); } }} className={styles.input} />
              {ymError ? <div className={styles.dangerText} style={{ marginTop: 6 }}>{ymError}</div> : null}
            </div>

            {/* 収入と貯金目標を縦に並べる */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 12 }}>
              <div>
                <label>収入（円）</label>
                <input value={income} onChange={(e) => setIncome(e.target.value)} className={styles.input} inputMode="numeric" />
                {incomeError ? <div className={styles.dangerText} style={{ marginTop: 6 }}>{incomeError}</div> : null}
              </div>
              <div>
                <label>貯金目標（円）</label>
                <input value={savings} onChange={(e) => setSavings(e.target.value)} className={styles.input} inputMode="numeric" />
              </div>
            </div>

            {/* 使えるお金 / カテゴリ予算の総和 / 残額 を年月の下にまとめて表示 */}
            <div style={{ marginBottom: 12, padding: 8, border: '1px solid #eee', borderRadius: 6, background: '#fafafa' }}>
              <div style={{ marginBottom: 6 }}><strong>使えるお金:</strong> {(Number(income || 0) - Number(savings || 0)).toLocaleString()} 円</div>
              <div style={{ marginBottom: 6 }}><strong>カテゴリ予算の総和:</strong> {rows.reduce((acc, r) => acc + numericRowTotal(r), 0).toLocaleString()} 円</div>
              <div role="status" aria-live="polite"><strong>残額:</strong> {(() => { const usable = Number(income || 0) - Number(savings || 0); const assigned = rows.reduce((acc, r) => acc + numericRowTotal(r), 0); const rem = usable - assigned; return <span className={rem < 0 ? styles.dangerText : ''}>{rem.toLocaleString()} 円{rem < 0 ? ' — 割当が使えるお金を超えています' : ''}</span>; })()}</div>
            </div>

            <div style={{ marginTop: 8 }}>
              <div className={styles.tableContainer}>
                <table className={styles.table} aria-label="カテゴリテーブル">
                  <thead>
                    <tr>
                      <th className={`${styles.th} ${styles.colType}`}>種別</th>
                      <th className={`${styles.th} ${styles.colName}`}>カテゴリ名</th>
                      <th className={`${styles.th} ${styles.colTotal}`}>合計</th>
                      <th className={`${styles.th} ${styles.colBase}`}>ベース</th>
                      {adjLabels.map((label, i) => (
                        <th key={`h-adj-${i}`} className={`${styles.th} ${styles.colAdj}`}>
                          <input value={label} onChange={(e) => updateAdjLabel(i, e.target.value)} className={styles.input} />
                        </th>
                      ))}
                      <th className={`${styles.th} ${styles.colAction}`}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, ri) => (
                      <tr key={ri}>
                        <td className={`${styles.td} ${styles.colType}`}>
                          <select value={row[0]} onChange={(e) => { const v = e.target.value; setRows((prev) => prev.map((r, i) => i === ri ? [v, r[1], r[2], ...(r.slice(3))] : r)); }} className={styles.input}>
                            <option value="固定費">固定費</option>
                            <option value="変動費">変動費</option>
                          </select>
                        </td>
                        <td className={`${styles.td} ${styles.colName}`}>
                          <div>
                            <input value={row[1]} onChange={(e) => { const v = e.target.value; setRows((prev) => prev.map((r, i) => i === ri ? [r[0], v, r[2], ...(r.slice(3))] : r)); }} className={styles.input} />
                            {cellErrors[ri] && cellErrors[ri][1] ? <div className={styles.dangerText} style={{ marginTop: 6 }}>{cellErrors[ri][1]}</div> : null}
                          </div>
                        </td>
                        <td className={`${styles.td} ${styles.totalCell} ${styles.colTotal}`}>{computeRowTotal(row)}</td>
                        <td className={`${styles.td} ${styles.colBase}`}>
                          <div>
                            <input value={row[2]} onChange={(e) => { const v = e.target.value; setRows((prev) => prev.map((r, i) => i === ri ? [r[0], r[1], v, ...(r.slice(3))] : r)); }} className={styles.input} inputMode="numeric" />
                            {cellErrors[ri] && cellErrors[ri][2] ? <div className={styles.dangerText} style={{ marginTop: 6 }}>{cellErrors[ri][2]}</div> : null}
                          </div>
                        </td>
                        {adjLabels.map((label, ai) => (
                          <td key={`adj-${ai}`} className={`${styles.td} ${styles.colAdj}`}>
                            <div>
                              <input
                                value={row[3 + ai] ?? ''}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  setRows((prev) => prev.map((r, i) => {
                                    if (i !== ri) return r;
                                    const copy = [...r];
                                    while (copy.length < 3 + adjLabels.length) copy.push('');
                                    copy[3 + ai] = v;
                                    return copy;
                                  }));
                                }}
                                className={styles.input}
                                inputMode="numeric"
                              />
                              {cellErrors[ri] && cellErrors[ri][3 + ai] ? <div className={styles.dangerText} style={{ marginTop: 6 }}>{cellErrors[ri][3 + ai]}</div> : null}
                            </div>
                          </td>
                        ))}
                        <td className={styles.actionCell}>
                          <button type="button" onClick={() => removeRow(ri)} className={styles.smallButton}>削除</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <button type="button" onClick={addRow} className={styles.smallButton}>行を追加</button>
                <button type="button" onClick={addAdjColumn} className={styles.smallButton}>補正列を追加</button>
                <button type="button" onClick={removeAdjColumn} disabled={adjLabels.length === 0} className={styles.smallButton}>補正列を削除</button>
              </div>

              <div style={{ marginTop: 12 }}>
                <button type="submit" disabled={isSaveDisabled} className={styles.primaryButton}>保存</button>
                <div className={styles.status} aria-live="polite" style={{ marginTop: 8 }}>{status}</div>
              </div>
            </div>
          </form>
        </section>

        <aside className={styles.rightCol} aria-label="保存済み年月">
          <h2>保存済みの年月</h2>
          <div className={styles.savedList}>
            {savedMonths.length === 0 ? (
              <div style={{ color: '#666' }}>保存済みのデータはありません</div>
            ) : (
              savedMonths.map((s) => (
                <button key={`${s.year}-${s.month}`} type="button" className={`${styles.smallButton} ${styles.savedButtonFull}`} onClick={() => void loadMonth(s.year, s.month)}>
                  {s.year}年{s.month}月
                </button>
              ))
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
