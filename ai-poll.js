<!doctype html>
<html lang="th" class="dark">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Pollinations Studio — SPA (Text • Image • Audio)</title>

  <!-- Tailwind CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    // Tailwind config for neon/futuristic palette
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            neon: {
              pink: '#FF2D95',
              purple: '#8A2BE2',
              cyan: '#2BE8E8'
            },
            bg: '#0b0b10'
          },
          fontFamily: {
            sans: ['Inter', 'ui-sans-serif', 'system-ui']
          },
        }
      }
    }
  </script>

  <!-- React, ReactDOM, Babel -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

  <!-- ECharts -->
  <script src="https://cdn.jsdelivr.net/npm/echarts@5.4.2/dist/echarts.min.js"></script>

  <!-- Mermaid (for architecture diagram) -->
  <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
  <script>mermaid.initialize({startOnLoad:true, theme: 'dark'});</script>

  <style>
    body { background: linear-gradient(180deg,#060608 0%, #0b0b10 100%); color: #e6e6f0; font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; }
    .neon { color: linear-gradient(90deg,#FF2D95,#8A2BE2); }
    .glass { background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)); border: 1px solid rgba(255,255,255,0.04); backdrop-filter: blur(6px); }
    .accent { color: #FF2D95; }
    .btn-neon { background: linear-gradient(90deg,#FF2D95 0%,#8A2BE2 100%); color: #0b0b10; }
    .skeleton { animation: pulse 1.4s infinite; background: linear-gradient(90deg,#0e0e12,#15151a,#0e0e12); border-radius: 8px; }
    @keyframes pulse { 0% { opacity: 0.6 } 50% { opacity: 1 } 100% { opacity: 0.6 } }
    /* small helpers */
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, 'Roboto Mono', monospace; font-size: .92rem; }
  </style>
</head>
<body class="min-h-screen antialiased">

  <div id="root"></div>

  <script type="text/babel">
  /************************************************************************
   * Pollinations Studio SPA (React) - Single File
   * Tech: React (CDN + Babel), Tailwind for styles
   * Role: Senior Full-stack Developer และ AI Integrator
   *
   * Per request:
   * - Show project structure (Mermaid)
   * - Implement API fetching functions first (cleanly)
   * - Tabs: Text / Image / Audio (experimental)
   * - History via localStorage
   * - Download image, copy text, loading skeletons
   * - Futuristic dark UI with neon accents
   ************************************************************************/

  const { useState, useEffect, useRef } = React;

  /* -------------------------
     Project Structure (visual)
     ------------------------- */
  const ProjectStructure = () => (
    <div className="glass p-4 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Project Structure</h3>
          <p className="text-sm text-gray-300">ไฟล์ตัวอย่างสำหรับ Next.js App Router (แนวทาง)</p>
        </div>
        <div className="text-sm mono text-gray-300">Futuristic Dark • Pollinations</div>
      </div>

      <div className="mt-3">
        <div className="prose prose-invert text-sm">
          <pre className="bg-transparent p-2 rounded-md border border-dashed border-white/5 text-xs">
{`/app
  /api
    pollinationsProxy.ts   // Optional: server proxy for CORS & secrets
  /components
    PromptInput.tsx
    ChatBox.tsx
    ImageCard.tsx
    Sidebar.tsx
  page.tsx                 // SPA entry (App Router)
  globals.css              // Tailwind config
`}</pre>
        </div>
      </div>
      <div className="mt-3 text-sm text-gray-300">
        <strong>Note:</strong> ตัวอย่างนี้เป็น SPA แบบ client-side — ใน production แนะนำสร้าง Next.js API route เป็น proxy สำหรับ Pollinations เพื่อจัดการ CORS และเก็บ API keys (ถ้ามี).
      </div>
    </div>
  );

  /* -------------------------
     API Fetching Utilities
     -------------------------
     Implemented first per requirement.
     We provide:
       - generateText(prompt, model)
       - buildImageUrl({prompt,width,height,seed})
       - fetchImageBlob(url) for download
     Comments on Pollinations integration included in UI.
     ------------------------- */

  /**
   * generateText
   * - Calls Pollinations text endpoint.
   * - NOTE: Pollinations text endpoint behavior may change. If blocked by CORS,
   *   create a server-side proxy (Next.js API route) that forwards requests.
   *
   * Example (client-side):
   * POST https://text.pollinations.ai/generate
   * Content-Type: application/json
   * Body: { "model": "openai", "prompt": "..." }
   *
   * Returns: { text: "..." } or other provider-specific response.
   */
  async function generateText({ prompt, model='openai' } = {}) {
    try {
      const url = 'https://text.pollinations.ai/generate';
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt })
      });
      if (!resp.ok) throw new Error('API error: ' + resp.status);
      const data = await resp.json();
      // Pollinations text APIs may return {text} or provider result — try a few keys.
      const text = data.text ?? data.output ?? (typeof data === 'string' ? data : JSON.stringify(data));
      return { ok: true, data: text };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  /**
   * buildImageUrl
   * - Constructs image URL for Pollinations image endpoint.
   * - image.pollinations.ai supports simple GET query parameters.
   * Example:
   *  https://image.pollinations.ai/?prompt=...&seed=123&width=768&height=512
   */
  function buildImageUrl({ prompt='', width=768, height=512, seed=null } = {}) {
    const base = 'https://image.pollinations.ai/';
    const params = new URLSearchParams();
    params.set('prompt', prompt);
    if (width) params.set('width', String(width));
    if (height) params.set('height', String(height));
    if (seed !== null && seed !== undefined && seed !== '') params.set('seed', String(seed));
    return `${base}?${params.toString()}`;
  }

  async function fetchImageBlob(url) {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('Image fetch failed');
    const blob = await resp.blob();
    return blob;
  }

  /* -------------------------
     Local Storage History
     ------------------------- */
  const STORAGE_KEY = 'pollinations_studio_history_v1';
  function loadHistory() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }
  function saveHistory(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  /* -------------------------
     Small UI Components (separated logically)
     ------------------------- */

  // Icon components (simple inline SVGs to avoid bundling)
  const Icon = ({ name, className='w-5 h-5 inline-block' }) => {
    const icons = {
      chat: (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="#FF2D95" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>),
      image: (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="#8A2BE2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>),
      audio: (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="#2BE8E8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><rect x="2" y="6" width="6" height="12" rx="2"/></svg>),
      download: (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>)
    };
    return icons[name] || null;
  };

  // PromptInput component
  function PromptInput({ label, placeholder, value, setValue, onSubmit, children, submitting }) {
    return (
      <div className="flex flex-col space-y-2">
        <label className="text-sm text-gray-300">{label}</label>
        <textarea
          rows={4}
          className="bg-transparent border border-white/6 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm"
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs text-gray-400">{children}</div>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-2 rounded-md bg-gradient-to-r from-[#FF2D95] to-[#8A2BE2] text-black text-sm hover:opacity-90 disabled:opacity-50"
              onClick={onSubmit}
              disabled={submitting || !value.trim()}
            >{submitting ? 'Generating…' : 'Generate'}</button>
          </div>
        </div>
      </div>
    );
  }

  // ChatBox (Text generation display)
  function ChatBox({ messages }) {
    return (
      <div className="space-y-3">
        {messages.map((m, idx) => (
          <div key={idx} className={`p-3 rounded-lg ${m.role === 'user' ? 'bg-white/3 border border-white/4' : 'bg-gradient-to-r from-[#0f0f13] to-[#0b0b10] border border-white/3'}`}>
            <div className="flex justify-between items-start gap-2">
              <div className="text-xs text-gray-400 mono">{m.role}</div>
              <div className="text-xs text-gray-400">{new Date(m.ts).toLocaleTimeString()}</div>
            </div>
            <pre className="whitespace-pre-wrap mt-2 text-sm">{m.content}</pre>
          </div>
        ))}
      </div>
    );
  }

  // ImageCard for gallery/history item
  function ImageCard({ item, onDownload, onView }) {
    return (
      <div className="bg-white/3 rounded-md overflow-hidden border border-white/5">
        <div className="relative">
          <img src={item.result} alt={item.prompt} className="w-full h-48 object-cover bg-gray-900" />
        </div>
        <div className="p-3">
          <div className="text-sm text-gray-200 truncate">{item.prompt}</div>
          <div className="flex items-center justify-between mt-2">
            <div className="text-xs text-gray-400">{item.model ?? 'image.pollinations'}</div>
            <div className="flex gap-2">
              <button className="p-1 rounded-md bg-white/5 hover:bg-white/8 text-xs" onClick={() => onView(item)}>View</button>
              <button className="p-1 rounded-md bg-gradient-to-r from-[#FF2D95] to-[#8A2BE2] text-black text-xs" onClick={() => onDownload(item)}>Download</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* -------------------------
     App: main SPA
     ------------------------- */

  function App() {
    // Tab: 'text' | 'image' | 'audio'
    const [tab, setTab] = useState(localStorage.getItem('poll_tab') || 'text');

    // Shared states
    const [history, setHistory] = useState(loadHistory());

    useEffect(() => { saveHistory(history); }, [history]);
    useEffect(() => { localStorage.setItem('poll_tab', tab); }, [tab]);

    // Text generation
    const [textPrompt, setTextPrompt] = useState('');
    const [textModel, setTextModel] = useState('openai');
    const [textLoading, setTextLoading] = useState(false);
    const [messages, setMessages] = useState([]);

    // Image generation
    const [imgPrompt, setImgPrompt] = useState('');
    const [imgW, setImgW] = useState(768);
    const [imgH, setImgH] = useState(512);
    const [imgSeed, setImgSeed] = useState('');
    const [imgLoading, setImgLoading] = useState(false);

    // Audio (experimental)
    const [audioList, setAudioList] = useState([]); // placeholder for fetched audio/video items

    // ECharts ref for history visualization
    const chartRef = useRef(null);

    useEffect(() => {
      // Build a simple stat chart using ECharts
      const dom = chartRef.current;
      if (!dom) return;
      const chart = echarts.init(dom, null, { renderer: 'svg' });
      const counts = history.reduce((acc, it) => { acc[it.type] = (acc[it.type] || 0) + 1; return acc; }, {});
      const option = {
        tooltip: { show: true },
        series: [{
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 6, borderColor: '#0b0b10', borderWidth: 2 },
          label: { show: true, color: '#e6e6f0', formatter: '{b}: {c}' },
          labelLine: { show: false },
          data: [
            { value: counts.text || 0, name: 'Text', itemStyle: { color: '#FF2D95' } },
            { value: counts.image || 0, name: 'Image', itemStyle: { color: '#8A2BE2' } },
            { value: counts.audio || 0, name: 'Audio', itemStyle: { color: '#2BE8E8' } }
          ]
        }]
      };
      chart.setOption(option);
      window.addEventListener('resize', () => chart.resize());
      return () => chart.dispose();
    }, [history]);

    // Handlers
    async function handleGenerateText() {
      if (!textPrompt.trim()) return;
      const prompt = textPrompt.trim();
      setTextLoading(true);
      // push user message
      const userMsg = { role: 'user', content: prompt, ts: Date.now() };
      setMessages((m) => [...m, userMsg]);

      const res = await generateText({ prompt, model: textModel });
      setTextLoading(false);
      if (res.ok) {
        const aiMsg = { role: 'assistant', content: res.data, ts: Date.now() };
        setMessages((m) => [...m, aiMsg]);
        const item = { id: Date.now(), type: 'text', prompt, result: res.data, model: textModel, ts: Date.now() };
        const newHist = [item, ...history].slice(0, 200);
        setHistory(newHist);
        setTextPrompt('');
      } else {
        const errMsg = { role: 'assistant', content: 'Error: ' + res.error, ts: Date.now() };
        setMessages((m) => [...m, errMsg]);
      }
    }

    async function handleGenerateImage() {
      if (!imgPrompt.trim()) return;
      setImgLoading(true);
      const prompt = imgPrompt.trim();
      const url = buildImageUrl({ prompt, width: imgW, height: imgH, seed: imgSeed || null });
      // For many Pollinations endpoints, you can use the URL directly as image src.
      // But to ensure latest generated image, we may fetch to confirm it's accessible.
      // We'll optimistically add to history using the URL.
      const item = { id: Date.now(), type: 'image', prompt, result: url, model: 'image.pollinations', width: imgW, height: imgH, seed: imgSeed, ts: Date.now() };
      const newHist = [item, ...history].slice(0,200);
      setHistory(newHist);
      // Optionally prefetch image to detect errors
      try {
        await fetch(url, { method: 'HEAD' });
      } catch(e) {
        // ignore; the img tag will attempt to load and show fallback if fails
      }
      setImgLoading(false);
      setImgPrompt('');
    }

    async function handleDownloadImage(item) {
      try {
        const blob = await fetchImageBlob(item.result);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pollination-${item.id || Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch (e) {
        alert('Download failed: ' + e.message);
      }
    }

    function handleCopyText(text) {
      navigator.clipboard.writeText(text).then(() => {
        alert('Copied to clipboard');
      }).catch(() => {
        alert('Copy failed');
      })
    }

    function clearHistory() {
      if (!confirm('ลบประวัติทั้งหมด?')) return;
      setHistory([]);
      localStorage.removeItem(STORAGE_KEY);
    }

    // Experimental: fetch audio/video content list from pollinations (demo)
    async function fetchAudioLibrary() {
      try {
        // Pollinations may expose collections at https://pollinations.ai/ or dedicated endpoints.
        // Here we simulate a fetch to get an example list (in real usage, adjust to their API).
        setAudioList([{ id: 'exp-1', title: 'Dreamy Loop (demo)', url: 'https://cdn.jsdelivr.net/gh/pollinations/samples/dreamy.mp3' }]);
      } catch (e) {
        console.warn(e);
      }
    }

    useEffect(() => { fetchAudioLibrary(); }, []);

    return (
      <div className="min-h-screen p-6">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar */}
          <aside className="lg:col-span-3 glass p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-md bg-gradient-to-br from-[#FF2D95] to-[#8A2BE2] flex items-center justify-center text-black font-bold">P</div>
              <div>
                <h2 className="text-lg font-semibold">Pollinations Studio</h2>
                <div className="text-xs text-gray-400">Futuristic Dark • SPA</div>
              </div>
            </div>

            <nav className="mt-6 space-y-2">
              <button onClick={() => setTab('text')} className={`w-full text-left flex items-center gap-3 p-3 rounded-md ${tab==='text'?'bg-white/5 border border-white/6':'hover:bg-white/2'}`}>
                <Icon name="chat" /> <span>Text</span>
              </button>
              <button onClick={() => setTab('image')} className={`w-full text-left flex items-center gap-3 p-3 rounded-md ${tab==='image'?'bg-white/5 border border-white/6':'hover:bg-white/2'}`}>
                <Icon name="image" /> <span>Image</span>
              </button>
              <button onClick={() => setTab('audio')} className={`w-full text-left flex items-center gap-3 p-3 rounded-md ${tab==='audio'?'bg-white/5 border border-white/6':'hover:bg-white/2'}`}>
                <Icon name="audio" /> <span>Audio / Video (Experimental)</span>
              </button>
            </nav>

            <div className="mt-6 border-t border-white/5 pt-4 text-sm">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-300">History</div>
                <button className="text-xs text-red-400 hover:underline" onClick={clearHistory}>Clear</button>
              </div>

              <div className="mt-3 space-y-2 h-40 overflow-auto pr-2">
                {history.length===0 ? (
                  <div className="text-xs text-gray-500">ยังไม่มีประวัติการสร้าง — เริ่มจากการสร้างข้อความหรือภาพด้านขวา</div>
                ) : history.slice(0,6).map(h => (
                  <div key={h.id} className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-md bg-gray-900 flex items-center justify-center text-xs">{h.type[0].toUpperCase()}</div>
                    <div className="text-xs text-gray-300 truncate">{h.prompt}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <div ref={chartRef} style={{height: 160}}></div>
            </div>

            <div className="mt-4 text-xs text-gray-400">
              <strong>Integration Notes:</strong>
              <ul className="list-disc ml-4">
                <li>Image: image.pollinations.ai?prompt=...</li>
                <li>Text: POST to text.pollinations.ai/generate</li>
                <li>Use server-side proxy for CORS or secrets in production</li>
              </ul>
            </div>
          </aside>

          {/* Main */}
          <main className="lg:col-span-9 space-y-6">
            <div className="glass p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Workspace</h3>
                  <div className="text-sm text-gray-400">Mode: <span className="mono">{tab}</span></div>
                </div>
                <div className="text-xs text-gray-400">LocalHistory: {history.length} items</div>
              </div>

              {/* Tab content */}
              <div className="mt-4">
                {tab === 'text' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2">
                      <PromptInput
                        label="Prompt (Text Generation)"
                        placeholder="Write a sci-fi short story starter..."
                        value={textPrompt}
                        setValue={setTextPrompt}
                        onSubmit={handleGenerateText}
                        submitting={textLoading}
                      >
                        <div className="flex gap-2 items-center">
                          <select value={textModel} onChange={(e) => setTextModel(e.target.value)} className="bg-transparent border border-white/6 rounded-md p-1 text-sm">
                            <option value="openai">openai</option>
                            <option value="mistral">mistral</option>
                            <option value="gpt-j">gpt-j</option>
                          </select>
                          <div className="text-gray-400">Model</div>
                        </div>
                      </PromptInput>

                      <div className="mt-4">
                        <h4 className="text-sm text-gray-300">Conversation</h4>
                        <div className="mt-3">
                          {textLoading && <div className="p-3 skeleton rounded-md h-24" />}
                          <ChatBox messages={messages} />
                        </div>
                      </div>
                    </div>

                    <aside className="lg:col-span-1">
                      <div className="p-3 rounded-md border border-white/5">
                        <div className="flex items-center justify-between">
                          <div className="text-sm">Output Tools</div>
                        </div>
                        <div className="mt-3 text-xs text-gray-300">
                          เลือกข้อความที่ต้องการจาก Conversation แล้วคลิก Copy
                        </div>
                        <div className="mt-3 space-y-2">
                          {messages.filter(m => m.role === 'assistant').slice(0,3).map((m, idx) => (
                            <div key={idx} className="p-2 bg-white/3 rounded-md">
                              <div className="text-xs mono">{m.content.slice(0,160)}{m.content.length>160?'…':''}</div>
                              <div className="mt-2 flex gap-2">
                                <button className="text-xs p-1 rounded-md bg-white/5" onClick={() => handleCopyText(m.content)}>Copy</button>
                                <button className="text-xs p-1 rounded-md bg-gradient-to-r from-[#FF2D95] to-[#8A2BE2]" onClick={() => {
                                  const item = { id: Date.now(), type: 'text', prompt: m.content.slice(0,80), result: m.content, model: textModel, ts: Date.now() };
                                  setHistory((h) => [item, ...h]);
                                  alert('Saved to history');
                                }}>Save</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </aside>
                  </div>
                )}

                {tab === 'image' && (
                  <div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="lg:col-span-2">
                        <PromptInput
                          label="Prompt (Image Generation)"
                          placeholder="A neon cyberpunk street, ultra detailed, cinematic lighting"
                          value={imgPrompt}
                          setValue={setImgPrompt}
                          onSubmit={handleGenerateImage}
                          submitting={imgLoading}
                        >
                          <div className="flex items-center gap-2">
                            <input type="number" value={imgW} onChange={e=>setImgW(Number(e.target.value))} className="w-20 bg-transparent border border-white/6 rounded-md p-1 text-xs" />
                            <input type="number" value={imgH} onChange={e=>setImgH(Number(e.target.value))} className="w-20 bg-transparent border border-white/6 rounded-md p-1 text-xs" />
                            <input placeholder="seed (optional)" value={imgSeed} onChange={e=>setImgSeed(e.target.value)} className="w-28 bg-transparent border border-white/6 rounded-md p-1 text-xs" />
                          </div>
                        </PromptInput>

                        <div className="mt-4">
                          <h4 className="text-sm text-gray-300">Generated Gallery</h4>
                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {history.filter(h => h.type === 'image').map(item => (
                              <ImageCard key={item.id} item={item} onDownload={handleDownloadImage} onView={(it) => {
                                window.open(it.result, '_blank');
                              }} />
                            ))}
                            {imgLoading && <div className="skeleton h-40 col-span-1 rounded-md" />}
                            {history.filter(h => h.type === 'image').length===0 && !imgLoading && <div className="text-gray-400">ยังไม่มีภาพ — สร้างรูปภาพด้วย prompt ด้านบน</div>}
                          </div>
                        </div>
                      </div>

                      <aside className="lg:col-span-1">
                        <div className="p-3 rounded-md border border-white/5">
                          <div className="text-sm">Quick Actions</div>
                          <div className="mt-3 space-y-2">
                            <button className="w-full p-2 rounded-md bg-white/5" onClick={() => {
                              const demo = 'A neon pink-purple robot portrait, 1980s synthwave, cinematic lighting';
                              setImgPrompt(demo);
                            }}>Load Demo Prompt</button>
                            <button className="w-full p-2 rounded-md bg-gradient-to-r from-[#FF2D95] to-[#8A2BE2]" onClick={() => {
                              const randomSeed = Math.floor(Math.random()*999999);
                              setImgSeed(String(randomSeed));
                              alert('Random seed set: ' + randomSeed);
                            }}>Random Seed</button>
                          </div>
                        </div>
                      </aside>
                    </div>
                  </div>
                )}

                {tab === 'audio' && (
                  <div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm">Audio / Video (Experimental)</h4>
                        <div className="mt-3 text-xs text-gray-300">
                          ดึงตัวอย่างสื่อที่สร้างด้วย Pollinations (ถ้ามี) หรือเล่น demo audio ที่เรามี
                        </div>

                        <div className="mt-3 space-y-3">
                          {audioList.length===0 && <div className="text-gray-400">ไม่มีตัวอย่าง — กำลังโหลด...</div>}
                          {audioList.map(a => (
                            <div key={a.id} className="p-3 bg-white/3 rounded-md">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-sm">{a.title}</div>
                                  <div className="text-xs text-gray-400">{a.id}</div>
                                </div>
                                <audio controls src={a.url}></audio>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm">How to integrate (notes)</h4>
                        <div className="mt-3 text-xs text-gray-300">
                          - Pollinations sometimes provides animation/audio endpoints; if unavailable, use their GitHub/collections.<br/>
                          - For large media, stream via server proxy and set proper CORS headers.<br/>
                          - Use <span className="mono">Content-Type</span> and accept-range for efficient playback/download.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* History & Details */}
            <div className="glass p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">History Log</h3>
                  <div className="text-sm text-gray-400">เก็บไว้ใน LocalStorage — คลิกเพื่อดูรายละเอียด</div>
                </div>
                <div className="text-xs text-gray-400">Total: {history.length}</div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {history.length === 0 && <div className="text-gray-400">ยังไม่มีประวัติการสร้าง</div>}
                {history.map(item => (
                  <div key={item.id} className="p-3 rounded-md bg-white/3 border border-white/5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs text-gray-300">{item.type.toUpperCase()} • {new Date(item.ts).toLocaleString()}</div>
                        <div className="mt-2 text-sm">{item.prompt}</div>
                        {item.type === 'text' && (
                          <pre className="mt-2 text-xs mono whitespace-pre-wrap bg-transparent">{item.result}</pre>
                        )}
                        {item.type === 'image' && (
                          <img src={item.result} alt={item.prompt} className="mt-2 rounded-md w-full h-36 object-cover bg-gray-900"/>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {item.type === 'text' && <button className="text-xs p-1 rounded-md bg-white/5" onClick={()=>handleCopyText(item.result)}>Copy</button>}
                        {item.type === 'image' && <button className="text-xs p-1 rounded-md bg-gradient-to-r from-[#FF2D95] to-[#8A2BE2]" onClick={()=>handleDownloadImage(item)}>Download</button>}
                        <button className="text-xs p-1 rounded-md bg-white/5" onClick={() => {
                          // reopen item in UI: switch tab and maybe load prompt
                          setTab(item.type);
                          if (item.type === 'text') {
                            setTextPrompt(item.prompt);
                          } else if (item.type === 'image') {
                            setImgPrompt(item.prompt);
                          }
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}>Open</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Architecture Diagram (Mermaid) & API explanation */}
            <div className="glass p-4 rounded-lg">
              <h3 className="text-lg font-semibold">Integration Architecture</h3>
              <div className="mt-2 mermaid text-sm">
{`graph LR
  Browser[Browser SPA]
  subgraph "Optional: Next.js Server"
    Proxy[API Proxy /api/pollinations]
  end
  Browser -->|Text POST| TextAPI[text.pollinations.ai]
  Browser -->|Image GET| ImageAPI[image.pollinations.ai]
  Browser -->|If blocked by CORS| Proxy --> TextAPI
  Proxy --> ImageAPI
  note[Note: Proxy recommended for secrets / CORS]
`}
              </div>

              <div className="mt-4 text-sm text-gray-300">
                <strong>How to connect Pollinations (summary)</strong>
                <ul className="list-disc ml-5 mt-2 text-xs">
                  <li>Image generation: build GET URL to image.pollinations.ai with query params: prompt, width, height, seed.</li>
                  <li>Text generation: POST JSON payload {model, prompt} to text.pollinations.ai/generate and parse the response (text field or provider-specific output).</li>
                  <li>If you encounter CORS or rate limits, implement a Next.js API route that forwards requests server-side — this keeps keys secret and avoids browser CORS restrictions.</li>
                  <li>Always check Pollinations GitHub for latest endpoints & rate limits: https://github.com/pollinations</li>
                </ul>
              </div>
            </div>

          </main>
        </div>
      </div>
    );
  }

  // Render
  ReactDOM.createRoot(document.getElementById('root')).render(<App />);

  </script>
</body>
</html>
