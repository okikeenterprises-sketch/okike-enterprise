import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Play, ArrowLeft, RotateCcw, Moon, Sun, Sparkles, Layout, Code2, Eye, Terminal } from "lucide-react";
import okikeLogo from "@/assets/okike-logo.png";

type SandboxSearch = {
  html?: string;
  css?: string;
  js?: string;
  python?: string;
  title?: string;
  mode?: "frontend" | "python";
};

export const Route = createFileRoute("/sandbox")({
  validateSearch: (search: Record<string, unknown>): SandboxSearch => {
    return {
      html: typeof search.html === "string" ? search.html : undefined,
      css: typeof search.css === "string" ? search.css : undefined,
      js: typeof search.js === "string" ? search.js : undefined,
      python: typeof search.python === "string" ? search.python : undefined,
      title: typeof search.title === "string" ? search.title : undefined,
      mode: search.mode === "frontend" || search.mode === "python" ? search.mode : undefined,
    };
  },
  component: SandboxPage,
});

function SandboxPage() {
  const search = Route.useSearch();

  // Initial code states
  const defaultHtml = `<!-- Write HTML here -->
<div class="card">
  <h1>Welcome to OKIKE Sandbox! 🚀</h1>
  <p>Modify HTML, CSS, and JS panels to see updates live.</p>
  <button id="action-btn">Click Me!</button>
</div>`;

  const defaultCss = `/* Write CSS here */
body {
  font-family: system-ui, sans-serif;
  background: #000000;
  color: #ffffff;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  margin: 0;
}
.card {
  background: #0a0a0a;
  padding: 30px;
  border-radius: 16px;
  border: 2px solid #eab308;
  box-shadow: 0 10px 30px rgba(234, 179, 8, 0.15);
  text-align: center;
  max-width: 400px;
}
h1 {
  color: #eab308;
  font-size: 24px;
  margin-top: 0;
}
p {
  color: #a1a1aa;
  font-size: 14px;
}
button {
  background: #eab308;
  color: #000000;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 10px;
  transition: opacity 0.2s;
}
button:hover {
  opacity: 0.9;
}`;

  const defaultJs = `// Write JavaScript here
const btn = document.getElementById('action-btn');
if (btn) {
  btn.addEventListener('click', () => {
    alert('Hello from OKIKE Sandbox! 🎓');
  });
}`;

  const defaultPython = `# Write Python code here
def greet(name):
    print(f"Hello, {name}! 🐍")
    print("Welcome to OKIKE WebAssembly Python Sandbox!")

greet("Student")

# Try running loops or lists:
print("\\nCounting steps:")
for i in range(1, 6):
    print(f"Step {i} of 5")
`;

  // State Management
  const [mode, setMode] = useState<"frontend" | "python">(search.mode || "frontend");
  const [html, setHtml] = useState(search.html || defaultHtml);
  const [css, setCss] = useState(search.css || defaultCss);
  const [js, setJs] = useState(search.js || defaultJs);
  const [python, setPython] = useState(search.python || defaultPython);
  const [srcDoc, setSrcDoc] = useState("");
  
  // Tabs within code editor: "all" (split view) or individual "html" | "css" | "js"
  const [activeTab, setActiveTab] = useState<"all" | "html" | "css" | "js">("all");
  // Split layout orientation: "vertical" (side-by-side) or "horizontal" (top-bottom)
  const [orientation, setOrientation] = useState<"vertical" | "horizontal">("vertical");
  // Theme state
  const [darkMode, setDarkMode] = useState(true);

  // Auto-run when mode changes
  useEffect(() => {
    runCode();
  }, [mode]);

  function runCode() {
    if (mode === "python") {
      const escapedPython = python.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$");
      const combined = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: monospace;
                background: #000000;
                color: #eab308;
                padding: 20px;
                font-size: 14px;
                line-height: 1.5;
                margin: 0;
                white-space: pre-wrap;
              }
              .status {
                color: #a1a1aa;
                border-bottom: 1px solid #1f1f22;
                padding-bottom: 8px;
                margin-bottom: 12px;
                font-family: system-ui, sans-serif;
                font-size: 12px;
              }
              .error {
                color: #f87171;
              }
            </style>
          </head>
          <body>
            <div class="status">Python WebAssembly Console Running...</div>
            <div id="output">Loading Python runtime environment (this may take a few seconds)...</div>
            
            <script>
              function loadScript(url) {
                return new Promise((resolve, reject) => {
                  const s = document.createElement("script");
                  s.src = url;
                  s.onload = resolve;
                  s.onerror = reject;
                  document.head.appendChild(s);
                });
              }

              async function main() {
                const outputDiv = document.getElementById("output");
                try {
                  await loadScript("https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pyodide.js");
                  let pyodide = await loadPyodide();
                  outputDiv.innerHTML = "";
                  
                  let stdout = "";
                  pyodide.setStdout({
                    write: (text) => {
                      stdout += text;
                      outputDiv.innerHTML = stdout;
                      return text.length;
                    }
                  });
                  pyodide.setStderr({
                    write: (text) => {
                      stdout += text;
                      outputDiv.innerHTML = stdout;
                      return text.length;
                    }
                  });

                  await pyodide.runPythonAsync(\`${escapedPython}\`);
                  if (!stdout) {
                    outputDiv.innerHTML = "[Script finished with no output]";
                  }
                } catch (err) {
                  outputDiv.innerHTML += "\\n\\n<span class='error'>Error: " + err.message + "</span>";
                }
              }
              main();
            </script>
          </body>
        </html>
      `;
      setSrcDoc(combined);
    } else {
      const combined = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>${css}</style>
          </head>
          <body>
            ${html}
            <script>
              try {
                ${js}
              } catch (err) {
                console.error(err);
                document.body.innerHTML += '<div style="color: #ef4444; font-family: monospace; padding: 15px; background: #fee2e2; border: 1px solid #fca5a5; margin-top: 20px; border-radius: 8px; font-weight: bold;">Error: ' + err.message + '</div>';
              }
            </script>
          </body>
        </html>
      `;
      setSrcDoc(combined);
    }
  }

  function resetCode() {
    if (window.confirm("Are you sure you want to clear/reset the current editor code?")) {
      if (mode === "python") {
        setPython(defaultPython);
      } else {
        setHtml(defaultHtml);
        setCss(defaultCss);
        setJs(defaultJs);
      }
      setTimeout(runCode, 50);
    }
  }

  // Keyboard shortcut handler (Ctrl+Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        runCode();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [html, css, js, python, mode]);

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-150 ${
      darkMode ? "bg-[#050505] text-gray-200" : "bg-gray-50 text-gray-800"
    }`}>
      {/* Premium Top Bar */}
      <header className={`px-4 py-3 flex flex-wrap items-center justify-between gap-4 border-b ${
        darkMode ? "border-gray-800 bg-[#0a0a0a]" : "border-gray-200 bg-white"
      }`}>
        <div className="flex items-center flex-wrap gap-3">
          <Link
            to="/dashboard"
            className={`p-2 rounded-lg hover:opacity-95 transition flex items-center gap-1.5 text-xs font-semibold ${
              darkMode ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            <ArrowLeft className="size-3.5" /> Back
          </Link>
          
          <div className="flex items-center gap-2 mr-2">
            <img src={okikeLogo} alt="OKIKE" className="h-5 shrink-0" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#eab308]">Tryit Editor</span>
          </div>

          {/* Mode Switcher */}
          <div className={`flex rounded-lg p-0.5 border ${
            darkMode ? "border-gray-800 bg-gray-950" : "border-gray-200 bg-gray-100"
          }`}>
            <button
              onClick={() => setMode("frontend")}
              className={`px-3 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider transition ${
                mode === "frontend"
                  ? "bg-[#eab308] text-black"
                  : darkMode
                    ? "text-gray-400 hover:text-gray-200"
                    : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Frontend (HTML/CSS/JS)
            </button>
            <button
              onClick={() => setMode("python")}
              className={`px-3 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider transition flex items-center gap-1 ${
                mode === "python"
                  ? "bg-[#eab308] text-black"
                  : darkMode
                    ? "text-gray-400 hover:text-gray-200"
                    : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Python 🐍
            </button>
          </div>

          {search.title && (
            <span className={`hidden sm:inline-block text-xs font-semibold px-2 py-0.5 rounded border ${
              darkMode ? "border-gray-800 text-gray-400 bg-gray-900" : "border-gray-200 text-gray-600 bg-gray-100"
            }`}>
              Exercise: {search.title}
            </span>
          )}
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2">
          {/* Orientation toggle */}
          <button
            onClick={() => setOrientation(o => o === "vertical" ? "horizontal" : "vertical")}
            className={`p-2 rounded-lg transition ${
              darkMode ? "hover:bg-gray-800 text-gray-400 hover:text-gray-200" : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
            }`}
            title="Toggle Split Layout Orientation"
          >
            <Layout className="size-4 rotate-90" />
          </button>
          
          {/* Light/Dark Toggle */}
          <button
            onClick={() => setDarkMode(d => !d)}
            className={`p-2 rounded-lg transition ${
              darkMode ? "hover:bg-gray-800 text-yellow-400" : "hover:bg-gray-100 text-gray-600 hover:text-yellow-500"
            }`}
            title="Toggle Theme"
          >
            {darkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>

          {/* Reset code */}
          <button
            onClick={resetCode}
            className={`p-2 rounded-lg transition flex items-center gap-1.5 text-xs font-bold ${
              darkMode ? "hover:bg-gray-800 text-gray-400 hover:text-gray-200" : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
            }`}
            title="Clear and Reset Code"
          >
            <RotateCcw className="size-4" /> <span className="hidden sm:inline">Reset</span>
          </button>

          {/* Run button */}
          <button
            onClick={runCode}
            className="px-4 py-2 bg-[#eab308] text-black hover:bg-opacity-90 rounded-lg flex items-center gap-1.5 text-xs font-bold shadow-lg shadow-yellow-500/20 active:scale-95 transition"
            title="Run Code (Ctrl + Enter)"
          >
            <Play className="size-3.5 fill-current" /> Run ❯
          </button>
        </div>
      </header>

      {/* Editor Body Area */}
      <main className={`flex-1 grid p-3 gap-3 ${
        orientation === "vertical" ? "grid-cols-1 lg:grid-cols-2" : "grid-rows-[1fr_1fr]"
      }`}>
        
        {/* EDITORS BLOCK */}
        <div className={`rounded-xl border overflow-hidden flex flex-col ${
          darkMode ? "border-gray-800 bg-[#0a0a0a]" : "border-gray-200 bg-white"
        }`}>
          <div className={`flex items-center justify-between px-3 border-b py-1.5 ${
            darkMode ? "border-gray-800 bg-gray-900/50" : "border-gray-200 bg-gray-50"
          }`}>
            <div className="flex gap-1.5 flex-wrap">
              {mode === "frontend" ? (
                <>
                  {[
                    { id: "all", label: "Split Editor" },
                    { id: "html", label: "HTML" },
                    { id: "css", label: "CSS" },
                    { id: "js", label: "JS" },
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
                        activeTab === t.id
                          ? "bg-[#eab308] text-black"
                          : darkMode
                            ? "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </>
              ) : (
                <span className="px-3 py-1.5 text-xs font-semibold text-[#eab308] uppercase tracking-wider">
                  Python Source
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-gray-500 font-medium select-none">
              <Code2 className="size-3" /> {mode === "frontend" ? "Source Editors" : "Python Code"}
            </div>
          </div>

          {/* Editor panels */}
          <div className="flex-1 flex flex-col p-3 gap-3 overflow-y-auto min-h-[300px]">
            {mode === "python" ? (
              // Python single panel editor
              <div className="flex-1 flex flex-col h-full">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 select-none">Python Code (WebAssembly)</span>
                <textarea
                  value={python}
                  onChange={(e) => setPython(e.target.value)}
                  className={`flex-1 w-full font-mono text-xs p-3 rounded-lg border focus:outline-none focus:ring-1 focus:ring-[#eab308] resize-none ${
                    darkMode
                      ? "bg-[#050505] text-gray-200 border-gray-800 focus:border-[#eab308]"
                      : "bg-gray-50 text-gray-800 border-gray-200 focus:border-[#eab308]"
                  }`}
                  placeholder="def main():\n    print('Hello World')\n"
                />
              </div>
            ) : (
              // Frontend multi-panels
              <>
                {(activeTab === "all" || activeTab === "html") && (
                  <div className="flex-1 flex flex-col min-h-[150px]">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 select-none">HTML Structure</span>
                    <textarea
                      value={html}
                      onChange={(e) => setHtml(e.target.value)}
                      className={`flex-1 w-full font-mono text-xs p-3 rounded-lg border focus:outline-none focus:ring-1 focus:ring-[#eab308] resize-none ${
                        darkMode
                          ? "bg-[#050505] text-gray-200 border-gray-800 focus:border-[#eab308]"
                          : "bg-gray-50 text-gray-800 border-gray-200 focus:border-[#eab308]"
                      }`}
                    />
                  </div>
                )}

                {(activeTab === "all" || activeTab === "css") && (
                  <div className="flex-1 flex flex-col min-h-[150px]">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 select-none">CSS Styles</span>
                    <textarea
                      value={css}
                      onChange={(e) => setCss(e.target.value)}
                      className={`flex-1 w-full font-mono text-xs p-3 rounded-lg border focus:outline-none focus:ring-1 focus:ring-[#eab308] resize-none ${
                        darkMode
                          ? "bg-[#050505] text-gray-200 border-gray-800 focus:border-[#eab308]"
                          : "bg-gray-50 text-gray-800 border-gray-200 focus:border-[#eab308]"
                      }`}
                    />
                  </div>
                )}

                {(activeTab === "all" || activeTab === "js") && (
                  <div className="flex-1 flex flex-col min-h-[120px]">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 select-none">JavaScript Logic</span>
                    <textarea
                      value={js}
                      onChange={(e) => setJs(e.target.value)}
                      className={`flex-1 w-full font-mono text-xs p-3 rounded-lg border focus:outline-none focus:ring-1 focus:ring-[#eab308] resize-none ${
                        darkMode
                          ? "bg-[#050505] text-gray-200 border-gray-800 focus:border-[#eab308]"
                          : "bg-gray-50 text-gray-800 border-gray-200 focus:border-[#eab308]"
                      }`}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* OUTPUT BLOCK */}
        <div className={`rounded-xl border overflow-hidden flex flex-col min-h-[300px] ${
          darkMode ? "border-gray-800 bg-[#0a0a0a]" : "border-gray-200 bg-white"
        }`}>
          <div className={`px-4 py-3 border-b flex items-center justify-between ${
            darkMode ? "border-gray-800 bg-gray-900/50" : "border-gray-200 bg-gray-50"
          }`}>
            <span className="text-xs font-semibold text-gray-500 flex items-center gap-1.5 select-none">
              {mode === "python" ? <Terminal className="size-3.5" /> : <Eye className="size-3.5" />}
              {mode === "python" ? "Python Console Output" : "Output Preview"}
            </span>
            <span className="text-[10px] text-gray-400 italic">Runs automatically on change</span>
          </div>

          <div className="flex-1 bg-white relative">
            <iframe
              srcDoc={srcDoc}
              title="Sandbox Result Preview"
              sandbox="allow-scripts"
              className="absolute inset-0 w-full h-full border-0 bg-white"
            />
          </div>
        </div>

      </main>
    </div>
  );
}
