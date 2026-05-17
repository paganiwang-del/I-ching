"use client";

import { useState } from "react";
import "./page.module.css"; // We'll keep module css for specific components if needed, or just use globals

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const divine = async () => {
    setLoading(true);
    setResult(null);
    try {
      // Simulate tossing 6 coins
      const binary_list = Array.from({ length: 6 }, () => {
        // Randomly generate 6, 7, 8, or 9
        const rand = Math.random();
        if (rand < 0.125) return 6; // 老陰
        if (rand < 0.5) return 7;   // 少陽
        if (rand < 0.875) return 8; // 少陰
        return 9;                   // 老陽
      });

      const response = await fetch("/api/divine", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ binary_list }),
      });

      if (!response.ok) {
        throw new Error("占卜請求失敗");
      }

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error(error);
      alert("占卜過程發生錯誤。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container">
      <header className="header">
        <h1 className="title">文王六爻</h1>
        <p className="subtitle">專業線上排盤與占卜</p>
      </header>

      <section className="main-content">
        {!result ? (
          <div style={{ textAlign: "center", animation: "fadeInUp 1s ease" }}>
            <button 
              className="premium-btn" 
              onClick={divine}
              disabled={loading}
            >
              {loading ? "天人感應中..." : "誠心起卦"}
            </button>
            <p style={{ marginTop: "2rem", color: "var(--text-secondary)", fontStyle: "italic" }}>
              "至誠之道，可以前知"
            </p>
          </div>
        ) : (
          <div style={{ width: "100%", animation: "fadeInUp 1s ease", zIndex: 10 }}>
             <div style={{ background: "var(--glass-bg)", padding: "2rem", borderRadius: "12px", border: "1px solid var(--border-color)", backdropFilter: "blur(10px)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2rem", borderBottom: "1px dashed var(--border-color)", paddingBottom: "1rem" }}>
                  <div>
                    <h3 style={{ color: "var(--accent-color)" }}>占卜時間</h3>
                    <p>{result.timestamp}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <h3 style={{ color: "var(--accent-color)" }}>四柱干支</h3>
                    <p>
                      {result.gan_zhi.year_stem}{result.gan_zhi.year_branch}年 {" "}
                      {result.gan_zhi.month_stem}{result.gan_zhi.month_branch}月 {" "}
                      {result.gan_zhi.day_stem}{result.gan_zhi.day_branch}日
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "2rem", justifyContent: "center", flexWrap: "wrap" }}>
                  {/* 本卦 */}
                  <div style={{ flex: "1", minWidth: "300px" }}>
                    <h2 style={{ textAlign: "center", color: "var(--accent-hover)", marginBottom: "1rem" }}>
                      {result.ben_gua.name} ({result.ben_gua.palace}宮)
                    </h2>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "center" }}>
                      <tbody>
                        {result.ben_gua.yaos.map((yao: any, idx: number) => (
                          <tr key={idx} style={{ borderBottom: "1px solid rgba(139, 69, 19, 0.1)" }}>
                            <td style={{ padding: "0.5rem", color: "var(--text-secondary)" }}>{yao.liu_shen}</td>
                            <td style={{ padding: "0.5rem" }}>
                              {yao.yao_type === '陽' ? (
                                <div style={{ width: "60px", height: "8px", background: "var(--yang-color)", margin: "0 auto", borderRadius: "2px" }}></div>
                              ) : (
                                <div style={{ width: "60px", height: "8px", margin: "0 auto", display: "flex", justifyContent: "space-between" }}>
                                  <div style={{ width: "25px", height: "100%", background: "var(--yin-color)", borderRadius: "2px" }}></div>
                                  <div style={{ width: "25px", height: "100%", background: "var(--yin-color)", borderRadius: "2px" }}></div>
                                </div>
                              )}
                            </td>
                            <td style={{ padding: "0.5rem", color: "var(--text-primary)" }}>{yao.element}{yao.branch} {yao.relation}</td>
                            <td style={{ padding: "0.5rem", fontWeight: "bold", color: (yao.is_shi || yao.is_ying) ? "var(--accent-color)" : "transparent" }}>
                              {yao.is_shi ? '世' : yao.is_ying ? '應' : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* 變卦 */}
                  {result.bian_gua && (
                    <div style={{ flex: "1", minWidth: "300px" }}>
                      <h2 style={{ textAlign: "center", color: "var(--text-secondary)", marginBottom: "1rem" }}>
                        {result.bian_gua.name} (變卦)
                      </h2>
                      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "center" }}>
                        <tbody>
                          {result.bian_gua.yaos.map((yao: any, idx: number) => (
                            <tr key={idx} style={{ borderBottom: "1px solid rgba(139, 69, 19, 0.1)" }}>
                              <td style={{ padding: "0.5rem" }}>
                                {yao.yao_type === '陽' ? (
                                  <div style={{ width: "60px", height: "8px", background: "var(--yang-color)", opacity: 0.7, margin: "0 auto", borderRadius: "2px" }}></div>
                                ) : (
                                  <div style={{ width: "60px", height: "8px", margin: "0 auto", display: "flex", justifyContent: "space-between", opacity: 0.7 }}>
                                    <div style={{ width: "25px", height: "100%", background: "var(--yin-color)", borderRadius: "2px" }}></div>
                                    <div style={{ width: "25px", height: "100%", background: "var(--yin-color)", borderRadius: "2px" }}></div>
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: "0.5rem", color: "var(--text-primary)" }}>{yao.element}{yao.branch} {yao.relation}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div style={{ textAlign: "center", marginTop: "2rem" }}>
                  <button className="premium-btn" style={{ padding: "0.8rem 2rem", fontSize: "1rem" }} onClick={() => setResult(null)}>
                    重新起卦
                  </button>
                </div>
             </div>
          </div>
        )}
      </section>
    </main>
  );
}
