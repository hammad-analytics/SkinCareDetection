import React, { useState, useRef, useEffect } from "react";
import { api } from "../lib/api";
import { Footer } from "../components/Shared";
import { Bot, Send, User, Sparkles, PlusCircle, ShieldCheck, AlertTriangle } from "lucide-react";

/**
 * Beautiful, spacious renderer for AI Dermatologist clinical advice
 * Eliminates "khichpich" text by rendering clean section cards, pills & spacing
 */
function FormattedAssistantMessage({ content, sources }) {
  if (!content) return null;

  // Split by main sections (### or double newlines)
  const lines = content.split("\n");
  const blocks = [];
  let currentSection = { title: "", items: [], text: [] };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith("###") || line.startsWith("##") || line.startsWith("#")) {
      if (currentSection.title || currentSection.items.length || currentSection.text.length) {
        blocks.push({ ...currentSection });
        currentSection = { title: "", items: [], text: [] };
      }
      currentSection.title = line.replace(/^[#\s]+/, "");
    } else if (line.startsWith("-") || line.startsWith("*") || line.startsWith("•") || line.startsWith("🔹")) {
      currentSection.items.push(line.replace(/^[-*•🔹]\s*/, ""));
    } else {
      currentSection.text.push(line);
    }
  }
  if (currentSection.title || currentSection.items.length || currentSection.text.length) {
    blocks.push(currentSection);
  }

  // Helper to format inline bold text
  const formatBold = (str) => {
    const parts = str.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={idx} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="space-y-4 text-slate-800 text-sm leading-relaxed">
      {blocks.map((b, idx) => {
        const isWarning = b.title.toLowerCase().includes("doctor") || b.title.toLowerCase().includes("warning");
        const isCondition = b.title.toLowerCase().includes("naam") || b.title.toLowerCase().includes("condition");
        const isCream = b.title.toLowerCase().includes("cream") || b.title.toLowerCase().includes("dekhbhal");

        return (
          <div
            key={idx}
            className={`rounded-xl p-4 transition-all ${
              isWarning
                ? "bg-amber-50/80 border border-amber-200 text-amber-950"
                : isCondition
                ? "bg-teal-50/70 border border-teal-200"
                : isCream
                ? "bg-emerald-50/60 border border-emerald-200"
                : "bg-slate-50/70 border border-slate-200"
            }`}
          >
            {b.title && (
              <h4 className={`font-bold mb-2.5 flex items-center gap-2 text-sm ${
                isWarning ? "text-amber-800" : isCondition ? "text-teal-800" : isCream ? "text-emerald-800" : "text-slate-800"
              }`}>
                {isWarning && <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />}
                {isCream && <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />}
                {b.title}
              </h4>
            )}

            {b.text.length > 0 && (
              <div className="space-y-2 mb-2 text-slate-700">
                {b.text.map((t, tIdx) => (
                  <p key={tIdx} className="leading-relaxed">{formatBold(t)}</p>
                ))}
              </div>
            )}

            {b.items.length > 0 && (
              <ul className="space-y-2 mt-2">
                {b.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="flex items-start gap-2.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-600 mt-2 shrink-0" />
                    <span className="text-slate-700 leading-relaxed">{formatBold(item)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}

      {sources && sources.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-200">
          <p className="text-[11px] font-bold text-teal-700 uppercase tracking-wider mb-1.5">📚 Verified Medical Knowledge Base</p>
          <div className="flex flex-wrap gap-1.5">
            {sources.map((s, j) => (
              <span key={j} className="inline-block rounded-md bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 shadow-2xs">
                {s.title}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ChatPage() {
  const [chatId, setChatId] = useState(() => localStorage.getItem("active_chat_id") || null);
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("active_chat_messages");
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [
      {
        role: "assistant",
        content: `### 🩺 Namaste! Main Aapka AI Skin Health Assistant Hoon\n- **Services:** Acne, Eczema, Psoriasis, Fungal Ringworm (Daad), Vitiligo, Moles & Rashes\n- **Languages:** Hindi, Hinglish & English\n\n### 💡 Main Aapki Kya Madad Kar Sakta Hoon?\nAap mujhse kisi bhi skin bimari ke baare mein pooch sakte hain — jaise unke saral naam, safe OTC creams, parhez, aur kab doctor ko dikhana zaroori hai.\n\nNeeche diye gaye buttons me se kisi par click karke ya apna sawal type karke poochiye!`
      }
    ];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    localStorage.setItem("active_chat_messages", JSON.stringify(messages));
  }, [messages]);

  const startNewChat = () => {
    const initial = [
      {
        role: "assistant",
        content: `### 🩺 Naya Chat Session Shuru Ho Gaya Hai\n- **AI Dermatology Assistant Ready**\n\nAap mujhse skin ki kisi bhi bimari, safe creams ya symptoms ke baare me pooch sakte hain. Main aapki kaise madad karoon?`
      }
    ];
    setMessages(initial);
    setChatId(null);
    localStorage.removeItem("active_chat_id");
    localStorage.setItem("active_chat_messages", JSON.stringify(initial));
  };

  const send = async (textToSend) => {
    const userMsg = (textToSend || input).trim();
    if (!userMsg || loading) return;

    const newMessages = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const { data } = await api.post("/chat", {
        message: userMsg,
        chatId,
        history: messages.filter(m => m.content && !m.error)
      });

      if (data.chatId) {
        setChatId(data.chatId);
        localStorage.setItem("active_chat_id", data.chatId);
      }

      setMessages(prev => [...prev, { role: "assistant", content: data.response, sources: data.sources }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "I'm sorry, I'm unable to connect right now. Please check your internet or retry.", error: true }]);
    } finally {
      setLoading(false);
    }
  };

  const conditionPills = [
    { label: "🔴 Acne & Pimples", query: "Mujhe chehre par acne aur pimples hain, safe cleanser aur creams suggest karo aur kya parhez rakhna hai?" },
    { label: "🟣 Eczema / Khujli", query: "Eczema aur dry skin par bohot khujli ho rahi hai, safe moisturizing cream aur home care batao." },
    { label: "🟠 Fungal Infection / Daad", query: "Mujhe gol daad (ringworm fungal infection) jaisa rash hai, kaunsi antifungal cream lagayein aur steroid se kyu bachein?" },
    { label: "🟡 Psoriasis (Silvery Scales)", query: "Psoriasis kya hota hai aur iske safe treatment aur creams kya hain?" },
    { label: "⚪ Vitiligo (Safed Daag)", query: "Vitiligo (safed daag) ke shuruati lakshan aur daily sun care kaise karni chahiye?" },
    { label: "🟤 Normal Mole vs Cancer Alert", query: "Normal til aur skin cancer ke til me kya farq hota hai? ABCDE signs samjhao." }
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-50">
      {/* Header */}
      <div className="border-b bg-white px-4 py-3.5 shadow-xs">
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 shadow-2xs">
              <Bot className="h-5 w-5 text-teal-700" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-sm sm:text-base">AI Skin Care & Disease Assistant</h2>
              <p className="text-xs text-slate-500">Broad-Spectrum Guidance • Bilingual (Hindi + English) • Memory Active</p>
            </div>
          </div>
          <button
            onClick={startNewChat}
            className="flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-100 transition-colors shadow-2xs cursor-pointer"
          >
            <PlusCircle className="h-3.5 w-3.5" /> Naya Chat
          </button>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3.5 ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fadeIn`}>
              {msg.role === "assistant" && (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow-xs mt-1">
                  <Bot className="h-5 w-5" />
                </div>
              )}

              <div className={`max-w-[85%] rounded-2xl px-5 py-4 ${
                msg.role === "user"
                  ? "bg-teal-600 text-white rounded-br-xs shadow-md font-medium text-sm leading-relaxed"
                  : msg.error
                    ? "bg-red-50 text-red-700 border border-red-200 rounded-bl-xs"
                    : "bg-white border border-slate-200/90 text-slate-800 rounded-bl-xs shadow-sm"
              }`}>
                {msg.role === "user" ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <FormattedAssistantMessage content={msg.content} sources={msg.sources} />
                )}
              </div>

              {msg.role === "user" && (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-300 text-slate-700 shadow-2xs mt-1">
                  <User className="h-5 w-5" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3.5 animate-fadeIn">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow-xs">
                <Bot className="h-5 w-5" />
              </div>
              <div className="rounded-2xl rounded-bl-xs bg-white border border-slate-200 px-5 py-4 shadow-sm">
                <div className="flex items-center gap-2.5 text-xs font-medium text-slate-500">
                  <Sparkles className="h-4 w-4 animate-spin text-teal-600" />
                  <span>Dermatologist Assistant soch raha hai aur saaf tarike se likh raha hai...</span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Disease Pills */}
          <div className="pt-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">💡 Aam Skin Bimaariyon Ke Sawaal (Click to Ask):</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {conditionPills.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => send(p.query)}
                  disabled={loading}
                  className="text-left rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-medium text-slate-700 hover:border-teal-400 hover:bg-teal-50/60 hover:text-teal-900 transition-all shadow-2xs cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input Box */}
      <div className="border-t bg-white px-4 py-3.5 shadow-lg">
        <div className="mx-auto max-w-3xl">
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-teal-600 focus:ring-2 focus:ring-teal-100 transition-all outline-hidden"
              placeholder="Acne, Eczema, Daad/Fungal, Moles ya Safe Creams ke baare mein poochein..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
              disabled={loading}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className="rounded-xl bg-teal-600 px-5 py-3 text-white hover:bg-teal-700 disabled:bg-slate-300 transition-all shadow-xs cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-center text-[10px] text-slate-400">
            Shiksha aur marghdarshan ke liye. Kisi bhi gambhir bimaari me registered dermatologist se zaroor milein.
          </p>
        </div>
      </div>
    </div>
  );
}
