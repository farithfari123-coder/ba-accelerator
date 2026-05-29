import { useState, useRef, useEffect } from "react";

const AGENTS = [
  {
    id: "requirements",
    name: "Requirements Analyst",
    emoji: "🔍",
    accent: "#00D4AA",
    tagline: "Extract structured requirements from any business problem",
    placeholder: "Describe a business problem… e.g. 'The NHS discharge process is slow and paper-based, causing delays and readmissions'",
    systemPrompt: `You are an expert Business Analyst specialising in requirements elicitation. 
When given a business problem, extract and structure it into:
1. Business Need (1-2 sentences)
2. Functional Requirements (numbered list, "The system shall..." format)
3. Non-Functional Requirements (performance, security, usability)
4. Key Stakeholders (role + interest)
5. Assumptions
6. Out of Scope items
Be concise, professional, and use standard BA terminology. Format clearly with headers.`,
  },
  {
    id: "brd",
    name: "BRD Generator",
    emoji: "📄",
    accent: "#6366F1",
    tagline: "Generate professional BRD sections instantly",
    placeholder: "Paste your requirements or describe the project…",
    systemPrompt: `You are a senior Business Analyst who writes world-class Business Requirements Documents (BRDs).
When given a project description or requirements, generate a professional BRD section including:
1. Executive Summary
2. Project Objectives (SMART format)
3. Business Requirements (detailed, numbered)
4. Process Overview (as-is vs to-be)
5. Success Criteria (measurable KPIs)
6. Risk Register (top 3 risks with mitigation)
Use formal British English. Be thorough and professional.`,
  },
  {
    id: "interview",
    name: "Interview Coach",
    emoji: "🎤",
    accent: "#F59E0B",
    tagline: "Practice BA interview questions for UK & Gulf roles",
    placeholder: "Ask for interview prep… e.g. 'Give me a tough BA interview question about stakeholder management'",
    systemPrompt: `You are an expert BA interview coach for UK and Gulf firms (NHS, Scottish Widows, Aegon, HSBC, Emirates, QatarEnergy).
When asked a question, provide:
1. What the interviewer is really testing
2. A strong model answer using STAR
3. 2-3 key phrases that impress
4. What NOT to say
Focus on: requirements, BPMN, stakeholder management, Agile/Waterfall, Power BI, Jira.`,
  },
  {
    id: "stakeholder",
    name: "Stakeholder Simulator",
    emoji: "🤝",
    accent: "#EC4899",
    tagline: "Roleplay difficult stakeholder conversations",
    placeholder: "Set the scene… e.g. 'You are a resistant NHS IT Director who thinks the new system is unnecessary'",
    systemPrompt: `You are a roleplay engine that simulates difficult stakeholders for Business Analyst training.
When given a stakeholder persona, BECOME that person and stay in character. Be realistically difficult but not impossible.
Start by introducing yourself as the stakeholder and stating your concern.
Occasionally offer small concessions if the BA makes strong points.`,
  },
];

async function callClaude(systemPrompt, messages) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt,
      messages,
    }),
  });
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  const data = await response.json();
  return data.content?.[0]?.text || "No response received.";
}

function MessageBubble({ msg, accent }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: "14px" }}>
      {!isUser && (
        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: `${accent}22`, border: `1.5px solid ${accent}60`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", marginRight: "8px", flexShrink: 0, marginTop: "2px" }}>🤖</div>
      )}
      <div style={{ maxWidth: "82%", padding: "12px 16px", borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: isUser ? `${accent}20` : "rgba(255,255,255,0.05)", border: `1px solid ${isUser ? accent + "50" : "rgba(255,255,255,0.08)"}`, fontSize: "12.5px", lineHeight: "1.7", color: isUser ? "#F1F5F9" : "#CBD5E1", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        {msg.content}
      </div>
    </div>
  );
}

function AgentPanel({ agent }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput(""); setError("");
    const userMsg = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);
    try {
      const reply = await callClaude(agent.systemPrompt, newMessages);
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch (e) {
      setError("Connection issue. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "rgba(0,0,0,0.2)", borderRadius: "14px", border: `1px solid ${agent.accent}30`, overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", background: `${agent.accent}12`, borderBottom: `1px solid ${agent.accent}25`, display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ fontSize: "22px", width: "40px", height: "40px", borderRadius: "10px", background: `${agent.accent}20`, border: `1.5px solid ${agent.accent}50`, display: "flex", alignItems: "center", justifyContent: "center" }}>{agent.emoji}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "13px", fontWeight: "700", color: agent.accent, fontFamily: "sans-serif" }}>{agent.name}</div>
          <div style={{ fontSize: "10.5px", color: "#64748B", fontFamily: "sans-serif" }}>{agent.tagline}</div>
        </div>
        {messages.length > 0 && <button onClick={() => { setMessages([]); setError(""); }} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#475569", fontSize: "10px", padding: "4px 10px", cursor: "pointer" }}>Clear</button>}
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column" }}>
        {messages.length === 0 && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px", opacity: 0.5 }}>
            <div style={{ fontSize: "36px" }}>{agent.emoji}</div>
            <div style={{ fontSize: "11px", color: "#64748B", textAlign: "center", fontFamily: "sans-serif", maxWidth: "220px" }}>{agent.tagline}</div>
          </div>
        )}
        {messages.map((msg, i) => <MessageBubble key={i} msg={msg} accent={agent.accent} />)}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 0" }}>
            <div style={{ display: "flex", gap: "4px" }}>
              {[0,1,2].map(i => <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: agent.accent, animation: `bounce 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
            </div>
            <span style={{ fontSize: "11px", color: "#475569", fontFamily: "sans-serif" }}>Agent thinking...</span>
          </div>
        )}
        {error && <div style={{ fontSize: "11px", color: "#EF4444", padding: "8px", background: "rgba(239,68,68,0.1)", borderRadius: "6px" }}>⚠️ {error}</div>}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: "12px 14px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: "8px", alignItems: "flex-end" }}>
        <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }}} placeholder={agent.placeholder} rows={2} style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: `1px solid ${input ? agent.accent+"60" : "rgba(255,255,255,0.08)"}`, borderRadius: "10px", padding: "10px 12px", color: "#E2E8F0", fontSize: "12px", fontFamily: "sans-serif", resize: "none", outline: "none", lineHeight: "1.5" }} />
        <button onClick={send} disabled={!input.trim() || loading} style={{ width: "38px", height: "38px", borderRadius: "10px", background: input.trim() && !loading ? agent.accent : "rgba(255,255,255,0.05)", border: "none", cursor: input.trim() && !loading ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>
          {loading ? "⏳" : "➤"}
        </button>
      </div>
    </div>
  );
}

export default function BAMultiAgentSystem() {
  const [activeAgent, setActiveAgent] = useState(0);
  return (
    <div style={{ minHeight: "100vh", background: "#080C18", color: "#E2E8F0", fontFamily: "'Georgia', serif", display: "flex", flexDirection: "column" }}>
      <style>{`
        @keyframes bounce { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-5px); } }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        * { box-sizing: border-box; }
        textarea::placeholder { color: #334155; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>
      <div style={{ padding: "18px 24px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "linear-gradient(135deg, #00D4AA22, #6366F122)", border: "1.5px solid rgba(99,102,241,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>⚡</div>
          <div>
            <h1 style={{ margin: 0, fontSize: "clamp(15px, 3vw, 19px)", fontWeight: "700", fontFamily: "sans-serif", background: "linear-gradient(90deg, #00D4AA, #6366F1, #F59E0B, #EC4899)", backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: "shimmer 4s linear infinite" }}>BA Career Accelerator</h1>
            <p style={{ margin: 0, fontSize: "10.5px", color: "#475569", fontFamily: "sans-serif" }}>Multi-Agent AI System · 4 Specialised Agents · Powered by Claude</p>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: "6px", alignItems: "center" }}>
            <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#00D4AA", boxShadow: "0 0 8px #00D4AA" }} />
            <span style={{ fontSize: "10px", color: "#00D4AA", fontFamily: "sans-serif" }}>Live</span>
          </div>
        </div>
      </div>
      <div style={{ padding: "12px 24px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.15)", maxWidth: "1100px", width: "100%", margin: "0 auto", alignSelf: "stretch" }}>
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
          {AGENTS.map((agent, i) => (
            <button key={agent.id} onClick={() => setActiveAgent(i)} style={{ display: "flex", alignItems: "center", gap: "7px", padding: "9px 14px", background: activeAgent === i ? `${agent.accent}18` : "transparent", border: `1.5px solid ${activeAgent === i ? agent.accent : "transparent"}`, borderBottom: "none", borderRadius: "10px 10px 0 0", cursor: "pointer", transition: "all 0.2s", position: "relative", bottom: "-1px" }}>
              <span style={{ fontSize: "15px" }}>{agent.emoji}</span>
              <span style={{ fontSize: "11.5px", fontFamily: "sans-serif", fontWeight: activeAgent === i ? "600" : "400", color: activeAgent === i ? agen
