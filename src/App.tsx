import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FolderOpen, Code2, FileCode2, BarChart3, AlertCircle, Loader2, Info } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { cn } from './lib/utils';

const LANGUAGE_MAP: Record<string, string> = {
  js: 'JavaScript',
  jsx: 'JavaScript React',
  ts: 'TypeScript',
  tsx: 'TypeScript React',
  html: 'HTML',
  css: 'CSS',
  scss: 'Sass',
  less: 'Less',
  json: 'JSON',
  py: 'Python',
  java: 'Java',
  c: 'C',
  cpp: 'C++',
  h: 'C/C++ Header',
  hpp: 'C++ Header',
  cs: 'C#',
  go: 'Go',
  rs: 'Rust',
  rb: 'Ruby',
  php: 'PHP',
  swift: 'Swift',
  kt: 'Kotlin',
  sql: 'SQL',
  sh: 'Shell',
  bat: 'Batch',
  md: 'Markdown',
  xml: 'XML',
  yaml: 'YAML',
  yml: 'YAML',
  toml: 'TOML',
  vue: 'Vue',
  svelte: 'Svelte',
  dart: 'Dart',
  lua: 'Lua',
  pl: 'Perl',
  r: 'R',
  m: 'Objective-C',
  mm: 'Objective-C++',
  scala: 'Scala',
  groovy: 'Groovy',
  fs: 'F#',
  fsx: 'F# Script',
  clj: 'Clojure',
  ex: 'Elixir',
  exs: 'Elixir Script',
  erl: 'Erlang',
  hrl: 'Erlang Header',
  jl: 'Julia',
  nim: 'Nim',
  zig: 'Zig',
  v: 'V',
  elm: 'Elm',
  purs: 'PureScript',
  hx: 'Haxe',
  gd: 'GDScript',
  sol: 'Solidity',
};

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.svn',
  '.hg',
  'dist',
  'build',
  'out',
  'target',
  'bin',
  'obj',
  '.next',
  '.nuxt',
  '.cache',
  'coverage',
  'vendor',
  '__pycache__',
  'venv',
  'env',
  '.idea',
  '.vscode'
]);

const IGNORED_FILES = new Set([
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'bun.lockb',
]);

const COLORS = [
  '#3b82f6', // blue-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#f43f5e', // rose-500
  '#f97316', // orange-500
  '#eab308', // yellow-500
  '#22c55e', // green-500
  '#14b8a6', // teal-500
  '#06b6d4', // cyan-500
  '#6366f1', // indigo-500
];

interface Stats {
  totalLines: number;
  fileCount: number;
  languageStats: Record<string, number>;
}

export default function App() {
  const [isScanning, setIsScanning] = useState(false);
  const [currentFile, setCurrentFile] = useState<string>('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelectFolder = async () => {
    try {
      setError(null);
      // @ts-ignore - File System Access API is not fully typed in standard DOM lib yet
      if (!window.showDirectoryPicker) {
        throw new Error('Your browser does not support the File System Access API. Please use Chrome, Edge, or Opera.');
      }

      // @ts-ignore
      const dirHandle = await window.showDirectoryPicker();
      
      setIsScanning(true);
      setStats(null);
      
      let totalLines = 0;
      let fileCount = 0;
      const languageStats: Record<string, number> = {};

      async function traverse(handle: any, path: string) {
        for await (const entry of handle.values()) {
          if (entry.kind === 'directory') {
            if (!IGNORED_DIRS.has(entry.name)) {
              await traverse(entry, `${path}${entry.name}/`);
            }
          } else if (entry.kind === 'file') {
            if (IGNORED_FILES.has(entry.name)) continue;
            
            const ext = entry.name.split('.').pop()?.toLowerCase();
            if (ext && LANGUAGE_MAP[ext]) {
              try {
                const file = await entry.getFile();
                // Skip files larger than 5MB to prevent memory issues
                if (file.size > 5 * 1024 * 1024) continue;
                
                const text = await file.text();
                const lines = text.split('\n').length;
                
                totalLines += lines;
                fileCount++;
                
                const lang = LANGUAGE_MAP[ext];
                languageStats[lang] = (languageStats[lang] || 0) + lines;
                
                setCurrentFile(`${path}${entry.name}`);
              } catch (e) {
                console.error(`Failed to read ${entry.name}`, e);
              }
            }
          }
        }
      }

      await traverse(dirHandle, '');
      
      setStats({
        totalLines,
        fileCount,
        languageStats,
      });
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'An error occurred while scanning the folder.');
      }
    } finally {
      setIsScanning(false);
      setCurrentFile('');
    }
  };

  const chartData = stats 
    ? Object.entries(stats.languageStats)
        .map(([name, value]) => ({ name, value: value as number }))
        .sort((a, b) => b.value - a.value)
    : [];

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-blue-500/30">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-violet-500/10 blur-[120px]" />
      </div>

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-12 md:py-20">
        <div className="flex flex-col items-center text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center justify-center p-3 bg-zinc-900/50 border border-zinc-800 rounded-2xl mb-6 shadow-2xl shadow-black/50 backdrop-blur-sm"
          >
            <Code2 className="w-8 h-8 text-blue-400" />
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold tracking-tight mb-4 bg-gradient-to-br from-white to-zinc-400 bg-clip-text text-transparent"
          >
            Code Counter
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-zinc-400 max-w-xl text-lg mb-8"
          >
            Analyze your local projects securely in the browser. Select a folder to recursively scan and count lines of code across all supported languages.
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            onClick={handleSelectFolder}
            disabled={isScanning}
            className={cn(
              "group relative inline-flex items-center gap-3 px-8 py-4 rounded-full font-medium text-white transition-all duration-300",
              "bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500",
              "shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)] hover:shadow-[0_0_60px_-15px_rgba(59,130,246,0.7)]",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)]"
            )}
          >
            {isScanning ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Scanning Files...</span>
              </>
            ) : (
              <>
                <FolderOpen className="w-5 h-5 transition-transform group-hover:-translate-y-0.5" />
                <span>Select Folder to Scan</span>
              </>
            )}
          </motion.button>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8"
            >
              <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{error}</p>
              </div>
            </motion.div>
          )}

          {isScanning && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-8 bg-zinc-900/50 border border-zinc-800/50 rounded-3xl backdrop-blur-xl shadow-2xl"
            >
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="relative w-16 h-16 mb-6">
                  <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full" />
                  <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin" />
                </div>
                <h3 className="text-xl font-medium text-zinc-200 mb-2">Analyzing Directory</h3>
                <p className="text-zinc-500 font-mono text-sm max-w-md truncate">
                  {currentFile || 'Preparing...'}
                </p>
              </div>
            </motion.div>
          )}

          {stats && !isScanning && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Summary Cards */}
              <div className="lg:col-span-1 flex flex-col gap-6">
                <div className="p-6 bg-zinc-900/50 border border-zinc-800/50 rounded-3xl backdrop-blur-xl shadow-xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
                      <BarChart3 className="w-6 h-6" />
                    </div>
                    <h3 className="text-zinc-400 font-medium">Total Lines</h3>
                  </div>
                  <p className="text-4xl font-bold tracking-tight text-zinc-100">
                    {stats.totalLines.toLocaleString()}
                  </p>
                </div>

                <div className="p-6 bg-zinc-900/50 border border-zinc-800/50 rounded-3xl backdrop-blur-xl shadow-xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-violet-500/10 text-violet-400 rounded-xl">
                      <FileCode2 className="w-6 h-6" />
                    </div>
                    <h3 className="text-zinc-400 font-medium">Files Scanned</h3>
                  </div>
                  <p className="text-4xl font-bold tracking-tight text-zinc-100">
                    {stats.fileCount.toLocaleString()}
                  </p>
                </div>

                <div className="p-6 bg-zinc-900/50 border border-zinc-800/50 rounded-3xl backdrop-blur-xl shadow-xl">
                  <div className="flex items-start gap-3 text-zinc-400 text-sm">
                    <Info className="w-5 h-5 shrink-0 text-zinc-500" />
                    <p>
                      Results are generated locally in your browser. No files are uploaded to any server. Ignored directories include <code className="text-zinc-300 bg-zinc-800 px-1 py-0.5 rounded">node_modules</code>, <code className="text-zinc-300 bg-zinc-800 px-1 py-0.5 rounded">.git</code>, and build outputs.
                    </p>
                  </div>
                </div>
              </div>

              {/* Chart Area */}
              <div className="lg:col-span-2 p-6 md:p-8 bg-zinc-900/50 border border-zinc-800/50 rounded-3xl backdrop-blur-xl shadow-xl flex flex-col">
                <h3 className="text-xl font-medium text-zinc-200 mb-8">Language Distribution</h3>
                
                {chartData.length > 0 ? (
                  <div className="flex-1 min-h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={120}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="none"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#18181b', 
                            border: '1px solid #27272a',
                            borderRadius: '12px',
                            color: '#f4f4f5',
                            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)'
                          }}
                          itemStyle={{ color: '#f4f4f5' }}
                          formatter={(value: number) => [`${value.toLocaleString()} lines`, 'Lines of Code']}
                        />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36}
                          iconType="circle"
                          formatter={(value, entry: any) => (
                            <span className="text-zinc-300 ml-1">{value}</span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-zinc-500">
                    No supported source code files found.
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
