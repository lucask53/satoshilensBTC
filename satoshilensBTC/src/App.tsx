import React, { useState, useEffect } from "react";
import { 
  Search, 
  TrendingUp, 
  DollarSign, 
  Coins, 
  Percent, 
  BarChart3, 
  Award, 
  AlertTriangle, 
  RefreshCw, 
  History, 
  Bookmark, 
  BookmarkCheck, 
  ChevronRight, 
  Download, 
  UserCheck, 
  Brain, 
  Terminal, 
  CheckCircle,
  HelpCircle,
  Clock
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  LineChart, 
  Line 
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { validateBitcoinAddress } from "./lib/validators";
import { AnalysisResult, WatchlistItem, ChartPoint, DepositTransaction } from "./types";

// Famous demo wallets to let our users trial instantly
const FAMOUS_ADDRESSES = [
  {
    address: "bc1qgd6r0cl5epqsdff2y4snptkcx5yky9st5f6jga",
    label: "Active Whale Wallet (Nest Segwit)",
    desc: "An active large-scale network DCA saver address"
  },
  {
    address: "1FeexV6bAHuaK989656Ytw62TY5g5wSP8C",
    label: "Historic Mt.Gox (Legacy Entry)",
    desc: "Contains large historical inputs from 2011"
  },
  {
    address: "bc1q0sg6p2r0l0m05j5c6f600sz4ksc8qsh7p95tq4",
    label: "Humble DCA Vault (Native Segwit)",
    desc: "Demonstrates regular monthly sats accumulation"
  },
  {
    address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    label: "Genesis Nakamoto",
    desc: "The very first Bitcoin address (unspent block 0 reward)"
  }
];

export default function App() {
  // Query States
  const [addressInput, setAddressInput] = useState("");
  const [validationMsg, setValidationMsg] = useState<{ isValid: boolean; type: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState<string[]>([]);
  const [activeLogIndex, setActiveLogIndex] = useState(0);
  
  // App Core state
  const [report, setReport] = useState<AnalysisResult | null>(null);
  const [currency, setCurrency] = useState<"USD" | "BRL">("BRL");
  const [timeline, setTimeline] = useState<"1M" | "3M" | "6M" | "1Y" | "Tudo">("Tudo");
  const [proMode, setProMode] = useState(false);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [customLabel, setCustomLabel] = useState("");
  const [showLabelInput, setShowLabelInput] = useState(false);
  const [trackAddressMode, setTrackAddressMode] = useState<boolean>(() => {
    return localStorage.getItem("satoshilens_track_address_mode") === "true";
  });

  // Sync trackAddressMode to localStorage
  useEffect(() => {
    localStorage.setItem("satoshilens_track_address_mode", String(trackAddressMode));
  }, [trackAddressMode]);

  const activeFocusAddress = report?.address || addressInput.trim();

  // Filtered views based on Track Address (Modo de Foco)
  const displayedWatchlist = trackAddressMode
    ? watchlist.filter(item => activeFocusAddress ? item.address.toLowerCase() === activeFocusAddress.toLowerCase() : false)
    : watchlist;

  const displayedHistory = trackAddressMode
    ? searchHistory.filter(h => activeFocusAddress ? h.toLowerCase() === activeFocusAddress.toLowerCase() : false)
    : searchHistory;

  const displayedFamous = trackAddressMode
    ? FAMOUS_ADDRESSES.filter(f => activeFocusAddress ? f.address.toLowerCase() === activeFocusAddress.toLowerCase() : false)
    : FAMOUS_ADDRESSES;

  // Load Watchlist and search history on mount
  useEffect(() => {
    const savedWatch = localStorage.getItem("satoshilens_watchlist");
    if (savedWatch) {
      setWatchlist(JSON.parse(savedWatch));
    } else {
      // Default demo watchlist items
      const initialWatch: WatchlistItem[] = [
        { address: "bc1qgd6r0cl5epqsdff2y4snptkcx5yky9st5f6jga", label: "Whale DCA Alpha", addedAt: new Date().toISOString(), lastBalanceBTC: 1.45 }
      ];
      setWatchlist(initialWatch);
      localStorage.setItem("satoshilens_watchlist", JSON.stringify(initialWatch));
    }

    const savedHistory = localStorage.getItem("satoshilens_history");
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Sync address search input with formatting validation
  useEffect(() => {
    if (!addressInput) {
      setValidationMsg(null);
      return;
    }
    const result = validateBitcoinAddress(addressInput);
    setValidationMsg(result);
  }, [addressInput]);

  // Handle address parsing routine
  const triggerAnalysis = async (targetAddress: string) => {
    if (!targetAddress) return;
    const cleanAddr = targetAddress.trim();
    
    const check = validateBitcoinAddress(cleanAddr);
    if (!check.isValid) {
      alert("Por favor insira um endereço Bitcoin válido em formato Legacy, SegWit, Native ou Taproot.");
      return;
    }

    setLoading(true);
    setAddressInput(cleanAddr);
    
    // progressive terminal step logs
    const steps = [
      "Iniciando handshake de segurança SatoshiLens...",
      "Conectando a servidores proxy blockchain de alta performance...",
      "Fazendo consulta ao ledger Mempool.space via APIs persistidas...",
      "Processando todas as transações de blocos históricos...",
      "Filtrando troco (change outputs) do próprio endereço para expurgar transferências internas...",
      "Mapeando saídas de entrada (UTXOs recebidos)...",
      "Buscando cotação diária do BTC no Blockchain.info e pareando dados...",
      "Convertendo taxas monetárias históricas para BRL de forma retroativa...",
      "Analisando métricas de drawdown matemático e acumulados de preço de entrada médio...",
      "Solicitando auditoria de inteligência artificial de portfólio... (Gemini-3.5-Flash)",
      "Compilando gráficos interativos e gerando insights de valor soberano...",
      "Concluído!"
    ];
    setLoadingLogs([]);
    
    // Simulate animated console print out feed
    let currentIdx = 0;
    const logInterval = setInterval(() => {
      if (currentIdx < steps.length) {
        setLoadingLogs(prev => [...prev, `[S_LENS_CORE] ${steps[currentIdx]}`]);
        currentIdx++;
      } else {
        clearInterval(logInterval);
      }
    }, 350);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: cleanAddr }),
      });

      if (!response.ok) {
        throw new Error("Falha ao comunicar com o servidor de inteligência.");
      }

      const data: AnalysisResult = await response.json();
      
      clearInterval(logInterval);
      // Wait a split second to make the transition sleek
      setTimeout(() => {
        setReport(data);
        setLoading(false);
        
        // Add to search history if valid
        if (data.isValid) {
          setSearchHistory(prev => {
            const updated = [cleanAddr, ...prev.filter(h => h !== cleanAddr)].slice(0, 5);
            localStorage.setItem("satoshilens_history", JSON.stringify(updated));
            return updated;
          });
        }
      }, 500);

    } catch (error: any) {
      clearInterval(logInterval);
      alert(`Erro: incapaz de analisar este endereço: ${error.message}`);
      setLoading(false);
    }
  };

  // Watchlist Actions
  const toggleWatchlist = () => {
    if (!report) return;
    const isWatched = watchlist.some(item => item.address === report.address);
    if (isWatched) {
      const updated = watchlist.filter(item => item.address !== report.address);
      setWatchlist(updated);
      localStorage.setItem("satoshilens_watchlist", JSON.stringify(updated));
    } else {
      setShowLabelInput(true);
    }
  };

  const handleSaveWatchlistLabel = () => {
    if (!report) return;
    const label = customLabel.trim() || `${report.summary.totalBTC.toFixed(3)} BTC Wallet`;
    const newItem: WatchlistItem = {
      address: report.address,
      label,
      addedAt: new Date().toISOString(),
      lastBalanceBTC: report.summary.totalBTC
    };
    const updated = [...watchlist, newItem];
    setWatchlist(updated);
    localStorage.setItem("satoshilens_watchlist", JSON.stringify(updated));
    setCustomLabel("");
    setShowLabelInput(false);
  };

  const removeFromWatchlist = (addr: string) => {
    const updated = watchlist.filter(item => item.address !== addr);
    setWatchlist(updated);
    localStorage.setItem("satoshilens_watchlist", JSON.stringify(updated));
  };

  // Switch between currency prices helper
  const renderFiat = (usdVal: number, brlVal: number) => {
    if (currency === "USD") {
      return `$ ${usdVal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `R$ ${brlVal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Dynamic filter for chart timeline points
  const getFilteredChartData = () => {
    if (!report || !report.chartData || report.chartData.length === 0) return [];
    
    const now = Date.now();
    const sorted = [...report.chartData].sort((a,b) => a.timestamp - b.timestamp);
    
    if (timeline === "Tudo") return sorted;
    
    let filterDays = 30;
    if (timeline === "3M") filterDays = 90;
    else if (timeline === "6M") filterDays = 180;
    else if (timeline === "1Y") filterDays = 365;
    
    const boundaryTime = now - (filterDays * 24 * 3600 * 1000);
    // filter entries that are within the boundary
    const filtered = sorted.filter(p => p.timestamp * 1000 >= boundaryTime);
    
    // Always include at least 2 points for visual chart line consistency
    if (filtered.length < 2) {
      return sorted.slice(-10);
    }
    return filtered;
  };

  // Convert table metrics to CSV for export
  const exportToCSV = () => {
    if (!report) return;
    if (!proMode) {
      alert("A exportação de dados é uma funcionalidade Premium (SatoshiLens PRO). Ative o modo PRO no interruptor do topo para testá-la!");
      return;
    }
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Data,BTC Recebido,Preco BTC USD,Preco BTC BRL,Valor Investido USD,Valor Investido BRL,Valor Atual USD,Valor Atual BRL,ROI Percentual,Golden Deposit\n";
    
    report.deposits.forEach((dep) => {
      csvContent += `${dep.date},${dep.btcAmount},${dep.btcPriceUSD},${dep.btcPriceBRL},${dep.investedUSD},${dep.investedBRL},${dep.currentValueUSD},${dep.currentValueBRL},${dep.roiPercent.toFixed(2)},${dep.isGolden ? 'SIM' : 'NAO'}\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `satoshilens_report_${report.address.substring(0,8)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-gray-200 antialiased font-sans transition-colors duration-200 selection:bg-[#F7931A] selection:text-black">
      
      {/* Top Professional Header Bar */}
      <header className="h-16 border-b border-subtle bg-[#0D0D0D] px-6 sticky top-0 z-40 backdrop-blur flex items-center justify-between">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
          
          {/* Logo Brand Title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setReport(null)}>
            <div className="w-8 h-8 btc-bg-orange rounded flex items-center justify-center font-mono font-bold text-lg text-black shadow-lg glow-orange select-none">
              ₿
            </div>
            <div>
              <span className="font-sans font-bold text-base tracking-tight text-white flex items-center gap-1.5 hover:text-[#F7931A] transition">
                SATOSHI<span className="btc-orange">LENS</span>
                <span className="text-[9px] bg-zinc-800 text-zinc-400 border border-subtle px-1.5 py-0.5 rounded font-mono font-normal">MVP</span>
              </span>
              <p className="text-[9px] text-zinc-500 font-mono tracking-wider font-semibold uppercase leading-none">Wealth Intelligence</p>
            </div>
          </div>

          {/* Quick Header Search input when report is active */}
          {report && (
            <div className="flex-1 max-w-md mx-4 hidden md:flex relative">
              <input
                id="header_search"
                type="text"
                placeholder="Analisar outro endereço Bitcoin..."
                className="w-full bg-zinc-900 border border-subtle rounded-lg pl-10 pr-4 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-[#F7931A] focus:ring-1 focus:ring-[#F7931A]/30 font-mono tracking-tight transition"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && triggerAnalysis(addressInput)}
              />
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
            </div>
          )}

          {/* Configuration Controllers */}
          <div className="flex items-center gap-3.5">
            {/* Mode Switcher */}
            <div className="flex items-center bg-zinc-900 border border-subtle p-0.5 rounded-lg text-[11px] font-mono">
              <button 
                id="curr_brl"
                className={`px-2.5 py-1 rounded-md transition duration-150 ${currency === "BRL" ? "btc-bg-orange text-black font-bold shadow-sm" : "text-zinc-500 hover:text-white"}`}
                onClick={() => setCurrency("BRL")}
              >
                BRL (R$)
              </button>
              <button 
                id="curr_usd"
                className={`px-2.5 py-1 rounded-md transition duration-150 ${currency === "USD" ? "btc-bg-orange text-black font-bold shadow-sm" : "text-zinc-500 hover:text-white"}`}
                onClick={() => setCurrency("USD")}
              >
                USD ($)
              </button>
            </div>

            {/* Simulated PRO Mode Toggle */}
            <div className="flex items-center gap-2">
              <button
                id="pro_toggle"
                onClick={() => setProMode(!proMode)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${proMode ? 'btc-bg-orange glow-orange' : 'bg-zinc-800'}`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${proMode ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
              <span className="text-[11px] font-mono font-bold flex items-center gap-1 btc-orange">
                PRO {proMode ? "ON" : "OFF"}
              </span>
            </div>

            {/* Acompanhar Endereço Toggle */}
            <div className="flex items-center gap-2 border-l border-subtle pl-3">
              <button
                id="btn_track_header"
                onClick={() => setTrackAddressMode(!trackAddressMode)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${trackAddressMode ? 'bg-amber-500 glow-orange' : 'bg-zinc-800'}`}
                title="Acompanhar Endereço (Modo de Foco)"
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${trackAddressMode ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
              <span className="text-[10px] font-mono leading-none select-none">
                <span className={`block font-bold uppercase ${trackAddressMode ? 'text-amber-500' : 'text-zinc-500'}`}>ACOMPANHAR</span>
                <span className="text-[8px] text-zinc-500 font-semibold uppercase leading-none">Foco</span>
              </span>
            </div>
          </div>

        </div>
      </header>

      {/* Main Body Grid Container */}
      <main className="max-w-7xl mx-auto p-4 md:py-8">
        
        {/* VIEW A: LANDING PAGE - Empty state when no report is parsed */}
        {!report && !loading && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-4"
          >
            {/* Slogan + Big search widget */}
            <div className="lg:col-span-8 flex flex-col justify-center space-y-6">
              
              <div className="inline-flex items-center gap-2 bg-zinc-900/80 border border-subtle text-[#F7931A] px-3 py-1 rounded-full text-xs font-mono w-max">
                <Terminal className="h-3.5 w-3.5 text-[#F7931A]" />
                Auditor de Riqueza Blockchain Instantâneo & Independente
              </div>

              <h1 className="text-4xl md:text-5xl font-sans font-bold tracking-tight text-white leading-tight">
                Toda a história financeira de qualquer endereço <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F7931A] to-[#FFAE42] drop-shadow-sm font-mono tracking-tight">Bitcoin</span> na sua tela.
              </h1>

              <p className="text-sm md:text-base text-gray-400 max-w-2xl leading-relaxed">
                Insira o endereço Bitcoin para mapear depósitos históricos, taxas de câmbio USD/BRL na data de recebimento, ROI consolidado de portfólio, preço médio ponderado (DCA) e drawdowns severos. Sem expor dados pessoais.
              </p>

              {/* Central validated input container */}
              <div className="card-gradient border border-subtle rounded-xl p-6 shadow-2xl relative overflow-hidden group glow-orange">
                <div className="absolute top-0 left-0 w-1 h-full btc-bg-orange" />
                
                <h3 className="text-xs font-mono text-zinc-400 mb-3 tracking-widest uppercase flex items-center gap-1.5 font-bold">
                  <span className="status-dot btc-bg-orange inline-block"></span>
                  Insira o Endereço Bitcoin para Análise
                </h3>

                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1">
                    <input
                      id="main_address_input"
                      type="text"
                      placeholder="Ex: bc1qgd6r0cl5epqsdff2y4snptkcx5yky9st5f6jga, 1Feex..."
                      autoComplete="off"
                      className="w-full bg-zinc-900/80 border border-subtle rounded-lg pl-12 pr-4 py-3.5 text-sm text-white font-mono placeholder:text-gray-600 focus:outline-none focus:border-[#F7931A] focus:ring-1 focus:ring-[#F7931A]/30 transition text-ellipsis"
                      value={addressInput}
                      onChange={(e) => setAddressInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && triggerAnalysis(addressInput)}
                    />
                    <Coins className="absolute left-4 top-4 text-[#F7931A] h-5 w-5" />
                  </div>
                  <button
                    id="btn_analyze"
                    disabled={!validationMsg?.isValid}
                    onClick={() => triggerAnalysis(addressInput)}
                    className="btc-bg-orange hover:bg-[#E87A04] text-black font-sans font-bold px-7 py-3 rounded-lg text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-md glow-orange disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Analisar Carteira
                    <ChevronRight className="h-4 w-4 stroke-[3px]" />
                  </button>
                </div>

                {/* Validation Status Badging */}
                {validationMsg && (
                  <div className="mt-3 flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${validationMsg.isValid ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                    <span className="text-xs font-mono text-zinc-400">
                      {validationMsg.isValid 
                        ? `Endereço BTC Identificado: ${validationMsg.type}` 
                        : "Formato de endereço inválido ou incompleto."
                      }
                    </span>
                  </div>
                )}

                {/* Focus Mode Selection inside central search box */}
                <div className="mt-4 pt-4 border-t border-zinc-800/60 flex items-center gap-2">
                  <input
                    id="checkbox_track_address"
                    type="checkbox"
                    checked={trackAddressMode}
                    onChange={(e) => setTrackAddressMode(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-amber-500"
                  />
                  <label htmlFor="checkbox_track_address" className="text-xs font-mono text-zinc-300 cursor-pointer select-none">
                    Ativar modo <span className="text-amber-500 font-bold">Acompanhar Endereço</span> (Ocultar dados de outros locais)
                  </label>
                </div>
              </div>

              {/* Fast Trial presets */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-mono text-zinc-500 tracking-wider font-bold uppercase flex items-center gap-1.5">
                  <span className="status-dot bg-zinc-600 inline-block"></span>
                  Testar com um endereço modelo da rede pública:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {displayedFamous.length === 0 ? (
                    <div className="col-span-2 py-4 px-4 border border-dashed border-subtle rounded-lg bg-zinc-950 font-mono text-[10px] text-zinc-500 leading-relaxed">
                      💡 <span className="text-amber-500/90 font-bold">Modo Acompanhar Endereço Ativo</span>: Presets públicos de outros endereços estão ocultados. Desative o interruptor de Acompanhar no topo ou na caixa para exibi-los novamente.
                    </div>
                  ) : (
                    displayedFamous.map((f, i) => (
                      <div 
                        key={i}
                        id={`demo_wallet_${i}`}
                        onClick={() => triggerAnalysis(f.address)}
                        className="card-gradient border border-subtle hover:border-[#F7931A]/40 hover:bg-zinc-800/30 p-3.5 rounded-lg transition text-left cursor-pointer group flex items-start justify-between gap-3"
                      >
                        <div className="space-y-1 overflow-hidden">
                          <p className="text-xs font-mono font-bold text-white group-hover:text-[#F7931A] transition truncate">
                            {f.label}
                          </p>
                          <p className="text-[10px] text-zinc-400 font-sans leading-none truncate">
                            {f.desc}
                          </p>
                          <p className="text-[9px] text-[#F7931A]/70 font-mono truncate pt-1">
                            {f.address}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-zinc-500 group-hover:text-[#F7931A] shrink-0 self-center transition-transform group-hover:translate-x-0.5" />
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Sidebar with Watchlist + History on Landing page */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Watchlist card */}
              <div className="card-gradient border border-subtle rounded-xl p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono font-bold tracking-wider text-white uppercase flex items-center gap-2">
                    <Bookmark className="h-4 w-4 text-[#F7931A]" />
                    Sua Watchlist de Monitoramento
                  </h3>
                  <span className="text-[10px] bg-zinc-900 text-zinc-400 border border-subtle px-2 py-0.5 rounded font-mono">
                    {displayedWatchlist.length} {displayedWatchlist.length === 1 ? 'Item' : 'Itens'}
                  </span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {watchlist.length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-subtle rounded-lg">
                      <p className="text-xs text-zinc-400 font-sans">Sua watchlist está vazia.</p>
                      <p className="text-[10px] text-zinc-500 font-mono mt-1">Busque um endereço e salve-o usando o ícone de marcador.</p>
                    </div>
                  ) : displayedWatchlist.length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-subtle rounded-lg bg-zinc-950/45">
                      <p className="text-xs text-amber-500/80 font-sans font-bold">Filtro de Foco Ativo</p>
                      <p className="text-[10px] text-zinc-500 font-mono mt-1 px-2 leading-relaxed">
                        Outras carteiras foram ocultadas e ignoradas sob o modo Acompanhar Endereço.
                      </p>
                    </div>
                  ) : (
                    displayedWatchlist.map((item, idx) => (
                      <div 
                        key={idx}
                        id={`watchlist_item_${idx}`}
                        className="card-gradient border border-subtle p-2.5 rounded hover:border-[#F7931A]/30 transition group flex items-center justify-between gap-2 text-left"
                      >
                        <div className="overflow-hidden space-y-1 flex-1 cursor-pointer" onClick={() => triggerAnalysis(item.address)}>
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs text-white font-bold group-hover:text-[#F7931A] transition truncate">
                              {item.label}
                            </span>
                            <span className="text-[9px] font-mono text-zinc-400 bg-zinc-950 px-1.5 py-0.5 rounded border border-subtle">
                              {item.lastBalanceBTC?.toFixed(4)} BTC
                            </span>
                          </div>
                          <p className="text-[9px] text-zinc-500 font-mono truncate">{item.address}</p>
                        </div>
                        <button
                          id={`del_watch_${idx}`}
                          className="text-zinc-500 hover:text-red-400 p-1 rounded hover:bg-zinc-800 shrink-0 font-bold"
                          title="Remover da lista"
                          onClick={() => removeFromWatchlist(item.address)}
                        >
                          &times;
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Search History box */}
              {searchHistory.length > 0 && (
                <div className="card-gradient border border-subtle rounded-xl p-5 shadow-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-mono font-bold tracking-wider text-white uppercase flex items-center gap-2">
                      <History className="h-4 w-4 text-[#F7931A]" />
                      Buscas Realizadas Recentes
                    </h3>
                    <span className="text-[10px] bg-zinc-900 text-zinc-500 border border-subtle px-1.5 py-0.5 rounded font-mono">
                      {displayedHistory.length}
                    </span>
                  </div>

                  <div className="space-y-1.5 font-mono text-xs">
                    {displayedHistory.length === 0 ? (
                      <div className="text-center py-4 border border-dashed border-subtle rounded bg-zinc-950/45 text-[10px] text-zinc-500 font-mono">
                        Histórico de outros endereços ocultado sob foco.
                      </div>
                    ) : (
                      displayedHistory.map((h, i) => (
                        <button
                          id={`history_btn_${i}`}
                          key={i}
                          onClick={() => triggerAnalysis(h)}
                          className="w-full text-left card-gradient hover:bg-zinc-800 border border-subtle px-3 py-2 rounded text-[11px] text-zinc-300 truncate hover:text-[#F7931A] transition flex items-center gap-1.5"
                        >
                          <ChevronRight className="h-3 w-3 stroke-[2.5px] text-[#F7931A]" />
                          {h}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Sov Disclaimers */}
              <div className="bg-orange-950/20 border border-subtle rounded-lg p-4 text-[11px] leading-relaxed text-zinc-400">
                <div className="flex gap-2.5">
                  <AlertTriangle className="h-5 w-5 text-[#F7931A] shrink-0" />
                  <div className="space-y-1">
                    <span className="font-mono text-white font-bold block">DISCLAIMER SOBERANO</span>
                    Este portal apenas decodifica transações e dados públicos gravados imutavelmente na blockchain do Bitcoin. <span className="text-[#F7931A]">Não constitui conselho financeiro ou indicação de investimentos.</span> Mantenha a custódia das suas próprias chaves privadas soberanas (Not your keys, not your coins).
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* VIEW B: LOADING SCREEN WITH STEP LOGS */}
        {loading && (
          <div className="max-w-3xl mx-auto py-12 px-4">
            <div className="bg-[#111216] border border-[#23242E] rounded-xl p-6 md:p-8 shadow-2xl relative overflow-hidden space-y-6">
              
              {/* Spinner & static text */}
              <div className="flex items-center gap-4">
                <div className="relative h-12 w-12 flex-shrink-0">
                  <div className="absolute top-0 left-0 h-full w-full rounded-full border-4 border-[#F7931A]/20 border-t-[#F7931A] animate-spin" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-lg font-sans font-bold text-white">
                    Compilando Inteligência de Endereço Bitcoin
                  </h2>
                  <p className="text-xs text-gray-400 font-mono tracking-tight animate-pulse">
                    Executando requisições assíncronas aos nós da rede...
                  </p>
                </div>
              </div>

              {/* PROGRESS LOG BOX */}
              <div className="bg-[#070709] border border-[#2D2E38] rounded-lg p-5 font-mono text-xs text-green-400/90 h-64 overflow-y-auto space-y-1.5 select-all leading-relaxed">
                <div className="text-gray-500 border-b border-[#2D2E38]/50 pb-2 mb-2 flex items-center justify-between">
                  <span>SATOSHI_LENS CONSOLE v1.0.8</span>
                  <div className="flex gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    <span className="h-2 w-2 rounded-full bg-yellow-500" />
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-ping" />
                  </div>
                </div>
                <AnimatePresence initial={false}>
                  {loadingLogs.map((log, i) => (
                    <motion.p 
                      initial={{ opacity: 0, x: -5 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      key={i}
                      className="text-[11px] leading-relaxed"
                    >
                      {log}
                    </motion.p>
                  ))}
                </AnimatePresence>
                <div className="h-1" />
              </div>

              {/* Small progressive loader bar inside UI */}
              <div className="w-full bg-[#1F2025] h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-[#F7931A] h-full duration-500 ease-out rounded-full"
                  style={{ width: `${Math.min((loadingLogs.length / 12) * 100, 100)}%` }}
                />
              </div>

            </div>
          </div>
        )}

        {/* VIEW C: MAIN PRESENTATIONAL DASHBOARD */}
        {report && !loading && (
          <div className="space-y-6">
            
            {/* Context bar (Address details + Save Watchlist + Currency switches) */}
            <div className="card-gradient border border-subtle rounded-xl p-4.5 flex flex-col md:flex-row items-center justify-between gap-4">
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="bg-[#F7931A]/10 text-[#F7931A] border border-[#F7931A]/20 p-2.5 rounded-lg flex items-center justify-center shrink-0">
                  <Coins className="h-5 w-5" />
                </div>
                <div className="space-y-1 overflow-hidden min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-zinc-900 text-zinc-400 font-mono px-2 py-0.5 rounded border border-subtle font-semibold">
                      AUDITANDO ENDEREÇO
                    </span>
                    {report.summary.unconfirmedCount > 0 && (
                      <span className="text-[9px] bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-1.5 py-0.5 rounded font-mono animate-pulse font-bold">
                        {report.summary.unconfirmedCount} pendentes
                      </span>
                    )}
                  </div>
                  <h2 className="text-xs md:text-sm font-mono text-white tracking-tight truncate pr-2 select-all font-bold">
                    {report.address}
                  </h2>
                </div>
              </div>

              {/* Bookmark Save Action & Export */}
              <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
                
                {/* Watchlist Bookmark toggle button */}
                <button
                  id="btn_watchlist"
                  onClick={toggleWatchlist}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 border transition cursor-pointer ${
                    watchlist.some(item => item.address === report.address)
                      ? "bg-[#F7931A]/15 text-[#F7931A] border-[#F7931A]/40"
                      : "bg-zinc-900 text-zinc-400 border border-subtle hover:text-white"
                  }`}
                >
                  {watchlist.some(item => item.address === report.address) ? (
                    <>
                      <BookmarkCheck className="h-4 w-4" />
                      SALVO NA WATCHLIST
                    </>
                  ) : (
                    <>
                      <Bookmark className="h-4 w-4" />
                      MARCAR CARTEIRA
                    </>
                  )}
                </button>

                {/* Focus Mode button */}
                <button
                  id="btn_track_address_mode"
                  onClick={() => setTrackAddressMode(!trackAddressMode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 border transition cursor-pointer ${
                    trackAddressMode
                      ? "bg-amber-500/15 text-amber-500 border-amber-500/40"
                      : "bg-zinc-900 text-zinc-400 border border-subtle hover:text-white hover:border-[#F7931A]/40"
                  }`}
                  title="Acompanhar Endereço: Focar apenas no endereço ativo e ocultar outros locais"
                >
                  <span className={trackAddressMode ? "animate-pulse text-amber-500" : ""}>👁️</span>
                  {trackAddressMode ? "FOCO: ATIVO" : "ACOMPANHAR ENDEREÇO"}
                </button>

                {/* CSV exporter */}
                <button
                  id="btn_export_csv"
                  onClick={exportToCSV}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 border bg-zinc-900 text-zinc-400 border border-subtle hover:bg-zinc-800 hover:text-white transition cursor-pointer"
                  title="Exportar dados para planilha Excel / CSV (PRO)"
                >
                  <Download className="h-4 w-4" />
                  EXPORTAR (.CSV)
                </button>

                {/* Search again back link */}
                <button
                  onClick={() => setReport(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1 bg-zinc-900 border border-subtle hover:border-[#F7931A] text-[#F7931A] hover:bg-[#F7931A]/10 transition cursor-pointer"
                >
                  VOLTAR
                </button>

              </div>
            </div>

            {/* Custom Watchlist Label pop-in model */}
            {showLabelInput && (
              <div className="bg-zinc-950 border border-[#F7931A]/40 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Bookmark className="h-4 w-4 text-[#F7931A]" />
                    Atribuir Rótulo Personalizado
                  </h4>
                  <button onClick={() => setShowLabelInput(false)} className="text-gray-400 hover:text-white">&times;</button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex: Minha carteira Fria, Baleia 01, HODL Invest..."
                    className="flex-1 bg-zinc-900 border border-subtle rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#F7931A] font-mono"
                    value={customLabel}
                    onChange={(e) => setCustomLabel(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveWatchlistLabel()}
                  />
                  <button
                    onClick={handleSaveWatchlistLabel}
                    className="btc-bg-orange hover:bg-[#E87A04] text-black px-4 py-1.5 rounded-md text-xs font-bold font-sans transition"
                  >
                    Salvar rótulo
                  </button>
                </div>
              </div>
            )}

            {/* Address has zero deposits state handler */}
            {report.deposits.length === 0 ? (
              <div className="card-gradient border border-subtle rounded-xl p-12 text-center space-y-4">
                <div className="mx-auto h-12 w-12 rounded-full bg-zinc-900 border border-subtle flex items-center justify-center text-gray-500 text-xl font-mono">
                  ?
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-sans font-bold text-white">Análise Concluída: Endereço sem histórico</h3>
                  <p className="text-xs text-zinc-400 font-mono tracking-tight max-w-lg mx-auto">
                    Este endereço Bitcoin é válido, mas não possui transações de recebimento externas registradas nos blocos da blockchain principal (UTXOs recebidos de saldo total = 0.00 BTC).
                  </p>
                </div>
                <button
                  onClick={() => setReport(null)}
                  className="bg-zinc-900 border border-subtle hover:border-white text-white font-mono text-xs px-5 py-2 rounded transition cursor-pointer"
                >
                  Efetuar Nova Busca
                </button>
              </div>
            ) : (
              
              // Full Dashboard Presentation Grid
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* COLUMN LEFT: SUMMARY CARDS + AI INSIGHTS CARD (LG:4) */}
                <div className="lg:col-span-4 space-y-6">

                  {/* PORTFOLIO METRICS SECTION */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-mono text-zinc-500 tracking-wider font-bold uppercase flex items-center gap-1.5">
                      <span className="status-dot btc-bg-orange inline-block"></span>
                      Resumo Financeiro do Portfólio
                    </h3>

                    <div className="grid grid-cols-1 gap-3.5">
                      
                      {/* CARD 1: CURRENT TOTAL VALUE */}
                      <div className="card-gradient border border-subtle rounded-xl p-4.5 space-y-1.5 hover:border-zinc-800 transition relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 text-[#F7931A]/10 group-hover:text-[#F7931A]/20 transition">
                          <Coins className="h-10 w-10 stroke-[2.5px]" />
                        </div>
                        <span className="text-[10px] font-mono text-zinc-400 tracking-wider block font-bold">
                          SALDO COMPILADO (VALOR CORRENTE)
                        </span>
                        <div className="font-mono text-xl font-extrabold text-white flex items-baseline gap-1 bg-clip-text">
                          {report.summary.totalBTC.toFixed(8)} <span className="text-xs font-normal btc-orange">BTC</span>
                        </div>
                        <div className="font-mono text-sm text-emerald-400 font-extrabold">
                          {renderFiat(report.summary.currentValueUSD, report.summary.currentValueBRL)}
                        </div>
                        <div className="text-[9px] text-zinc-500 font-mono pt-1">
                          Cotação hoje: {renderFiat(report.summary.currentBtcPriceUSD, report.summary.currentBtcPriceBRL)}/BTC
                        </div>
                      </div>

                      {/* CARD 2: TOTAL INVESTED */}
                      <div className="card-gradient border border-subtle rounded-xl p-4.5 space-y-1.5 hover:border-zinc-800 transition">
                        <span className="text-[10px] font-mono text-zinc-400 tracking-wider block font-bold">
                          CAPITAL DISPENDIDO (INVESTIDO)
                        </span>
                        <div className="font-mono text-lg font-bold text-white">
                          {renderFiat(report.summary.totalInvestedUSD, report.summary.totalInvestedBRL)}
                        </div>
                        <div className="text-[9px] font-mono text-zinc-500">
                          Soma dos aportes ao valor cambial do dia exato de recebimento
                        </div>
                      </div>

                      {/* CARD 3: ROI CONSOLIDADO & P&L */}
                      <div className="card-gradient border border-subtle rounded-xl p-4.5 space-y-1.5 hover:border-zinc-800 transition">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-zinc-400 tracking-wider font-bold">
                            ROI CONSOLIDADO & RETORNO LÍQUIDO
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold leading-none ${
                            report.summary.consolidatedROI >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                          }`}>
                            {report.summary.consolidatedROI >= 0 ? "+" : ""}{report.summary.consolidatedROI.toFixed(1)}%
                          </span>
                        </div>
                        
                        <div className={`font-mono text-lg font-bold ${
                          report.summary.totalPnlUSD >= 0 ? "text-emerald-400" : "text-red-400"
                        }`}>
                          {report.summary.totalPnlUSD >= 0 ? "+" : ""}
                          {currency === "USD" 
                            ? `$ ${report.summary.totalPnlUSD.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                            : `R$ ${report.summary.totalPnlBRL.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          }
                        </div>
                        
                        <p className="text-[9px] text-zinc-500 font-mono">
                          Lucro ponderado sem contar change outputs
                        </p>
                      </div>

                      {/* CARD 4: PRECO MEDIO D.C.A. */}
                      <div className="card-gradient border border-subtle rounded-xl p-4.5 space-y-1.5 hover:border-zinc-800 transition">
                        <span className="text-[10px] font-mono text-zinc-400 tracking-wider block font-bold">
                          PREÇO MÉDIO DE AQUISIÇÃO (DCA PRICE)
                        </span>
                        <div className="font-mono text-base font-bold text-white flex items-baseline gap-1 select-all">
                          {renderFiat(report.summary.avgCostBasisUSD, report.summary.avgCostBasisBRL)}
                        </div>
                        <p className="text-[9px] text-zinc-500 font-mono">
                          Média ponderada do preço de compra histórica das moedas guardadas nesse endereço
                        </p>
                      </div>

                      {/* CARD 5: DOUBLE CARD DRAWDOWN & GOLDEN APORTE */}
                      <div className="grid grid-cols-2 gap-3.5">
                        
                        <div className="card-gradient border border-subtle rounded-xl p-3.5 space-y-1.5">
                          <span className="text-[9px] font-mono text-zinc-400 tracking-wider block font-bold uppercase">
                            Drawdown Histórico
                          </span>
                          <div className="font-mono text-sm font-bold text-red-400">
                            -{report.summary.worstDrawdownPercent.toFixed(1)}%
                          </div>
                          <span className="text-[8px] text-zinc-500 block leading-tight font-mono"> queda máx de valor pico-a-fundo </span>
                        </div>

                        <div className="card-gradient border border-subtle rounded-xl p-3.5 space-y-1.5 relative group">
                          <span className="text-[9px] font-mono text-zinc-400 tracking-wider block flex items-center gap-1 font-bold">
                            <Award className="h-3 w-3 text-amber-500 shrink-0" />
                            GOLDEN APORTE
                          </span>
                          <div className="font-mono text-xs font-bold text-emerald-400">
                            +{report.summary.bestDepositRoi.toFixed(0)}% ROI
                          </div>
                          <span className="text-[8px] text-zinc-500 block leading-tight font-mono truncate">
                            {report.summary.bestDepositDate ? report.summary.bestDepositDate : "Sem registros"}
                          </span>
                        </div>

                      </div>

                    </div>
                  </div>

                  {/* AI INTEGRATIONS INSIGHT CARD */}
                  <div className="card-gradient border border-subtle rounded-xl p-5 shadow-lg space-y-4">
                    
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-mono font-bold tracking-wider text-white uppercase flex items-center gap-2">
                        <Brain className="h-4 w-4 text-[#F7931A]" />
                        Análise de IA Soberana
                      </h3>
                      <span className="text-[9px] bg-zinc-900 text-[#F7931A] font-mono px-2 py-0.5 rounded border border-subtle flex items-center gap-1 animate-pulse">
                        <UserCheck className="h-3 w-3" />
                        GEMINI
                      </span>
                    </div>

                    {report.insights ? (
                      <div className="space-y-4 font-mono text-xs text-zinc-300">
                        {/* Profile badging */}
                        <div className="flex items-center justify-between bg-zinc-950 border border-subtle p-3 rounded-lg">
                          <div>
                            <span className="text-[9px] text-zinc-500 block uppercase font-bold">PERFIL ESTABELECIDO</span>
                            <span className="text-white font-bold tracking-tight text-sm btc-orange">
                              {report.insights.investmentProfile}
                            </span>
                          </div>
                          <Terminal className="h-5 w-5 text-[#F7931A]" />
                        </div>

                        {/* Summary analytical text */}
                        <div className="space-y-1 bg-zinc-900/60 p-3 rounded-lg border border-subtle leading-relaxed">
                          <p className="text-[11px] leading-relaxed text-zinc-300">
                            {report.insights.summaryText}
                          </p>
                        </div>

                        {/* Strengths mapping */}
                        <div className="space-y-2">
                          <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">Pontos Fortes Identificados:</span>
                          <div className="space-y-1.5">
                            {report.insights.strengths.map((str, idx) => (
                              <div key={idx} className="flex gap-2 items-start text-[11px] leading-tight">
                                <span className="text-emerald-400 mt-1">✔</span>
                                <p>{str}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Action strategies recommended */}
                        <div className="space-y-2 pt-1 border-t border-subtle">
                          <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">Ações de Gestão Recomendadas:</span>
                          <div className="space-y-1.5">
                            {report.insights.recommendations.map((rec, idx) => (
                              <div key={idx} className="flex gap-2 items-start text-[11px] leading-tight text-zinc-400">
                                <span className="btc-orange mt-1 font-extrabold">&gt;</span>
                                <p>{rec}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <HelpCircle className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                        <p className="text-xs text-gray-500 font-mono">IA Insights Indisponível</p>
                      </div>
                    )}

                  </div>

                </div>

                {/* COLUMN RIGHT: PERFORMANCE CHART + DEPOSITS LISTING TABLE (LG:8) */}
                <div className="lg:col-span-8 space-y-6">
                  
                  {/* PERFORMANCE CHART */}
                  <div className="card-gradient border border-subtle rounded-xl p-5 shadow-lg space-y-4">
                    
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <h3 className="text-xs font-mono font-bold tracking-wider text-white uppercase flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-[#F7931A]" />
                          Desempenho Patrimonial Acumulado
                        </h3>
                        <p className="text-[10px] text-zinc-500 font-mono">Valor global da carteira em escala cambial temporal</p>
                      </div>

                      {/* Timeline selectors */}
                      <div className="flex bg-zinc-900 border border-subtle p-0.5 rounded-lg text-[10px] font-mono">
                        {(["1M", "3M", "6M", "1Y", "Tudo"] as const).map((t) => (
                          <button
                            id={`timeline_${t}`}
                            key={t}
                            onClick={() => setTimeline(t)}
                            className={`px-2.5 py-1 rounded-md transition ${
                              timeline === t 
                                ? "btc-bg-orange text-black font-bold shadow-sm" 
                                : "text-zinc-500 hover:text-white"
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* RENDER THE RECHARTS LINE GRAPH */}
                    <div className="h-80 w-full pt-1.5 font-mono text-xs select-none">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart 
                          data={getFilteredChartData()}
                          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#F7931A" stopOpacity={0.25}/>
                              <stop offset="95%" stopColor="#F7931A" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#5B5C6C" 
                            fontSize={9} 
                            tickLine={false} 
                            dy={10}
                          />
                          <YAxis 
                            stroke="#5B5C6C" 
                            fontSize={9} 
                            tickLine={false} 
                            dx={-5}
                            tickFormatter={(val) => {
                              if (val >= 1e6) return `${(val/1e6).toFixed(1)}M`;
                              if (val >= 1e3) return `${(val/1e3).toFixed(0)}k`;
                              return val;
                            }}
                          />
                          <Tooltip 
                            contentStyle={{ backgroundColor: "#111111", borderColor: "rgba(255,255,255,0.08)", borderRadius: "8px", fontSize: "11px" }}
                            labelClassName="text-[#F7931A] font-bold py-0.5"
                            formatter={(value: any, name: any) => {
                              const title = name === "portfolioValueUSD" || name === "portfolioValueBRL" 
                                ? `Valor do Portfólio (${currency})` 
                                : `Preço do BTC (${currency})`;
                              
                              if (name === "portfolioValueUSD" || name === "btcPriceUSD") {
                                  return [`$ ${Number(value).toLocaleString("en-US", { maximumFractionDigits: 0 })}`, title];
                              }
                              return [`R$ ${Number(value).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`, title];
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey={currency === "USD" ? "portfolioValueUSD" : "portfolioValueBRL"} 
                            stroke="#F7931A" 
                            strokeWidth={2.5}
                            fillOpacity={1} 
                            fill="url(#colorValue)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                  </div>

                  {/* DEPOSITS LEDGER TABLE */}
                  <div className="card-gradient border border-subtle rounded-xl p-5 shadow-lg space-y-4">
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-xs font-mono font-bold tracking-wider text-white uppercase flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 btc-orange" />
                          Livro de Registro de Entradas (Aportes UTXO)
                        </h3>
                        <p className="text-[10px] text-zinc-500 font-mono">
                          Lista cronológica decrescente dos ingressos de Bitcoin e suas equivalências financeiras
                        </p>
                      </div>
                      
                      <span className="text-[10px] bg-zinc-900 border border-subtle px-2 py-0.5 rounded font-mono text-[#F7931A] font-bold">
                        {report.deposits.length} Depósitos
                      </span>
                    </div>

                    <div className="overflow-x-auto border border-subtle rounded-lg">
                      <table className="w-full text-left font-mono border-collapse text-xs">
                        <thead>
                          <tr className="bg-zinc-900/50 text-zinc-400 select-none border-b border-subtle table-header">
                            <th className="p-3 font-semibold text-[10px]">DATA</th>
                            <th className="p-3 font-semibold text-[10px] text-right">BTC RECEBIDO</th>
                            <th className="p-3 font-semibold text-[10px] text-right">PREÇO DO BTC NO DIA</th>
                            <th className="p-3 font-semibold text-[10px] text-right">VALOR RETROATIVO</th>
                            <th className="p-3 font-semibold text-[10px] text-right">VALOR ATUAL</th>
                            <th className="p-3 font-semibold text-[10px] text-right">MARGEM ROI</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-subtle">
                          {report.deposits.map((dep, idx) => (
                            <tr key={idx} className="hover:bg-zinc-900/40 transition group">
                              
                              {/* Date & golden badges */}
                              <td className="p-3 text-[11px] font-bold flex items-center gap-1.5 whitespace-nowrap">
                                <Clock className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                                {dep.date}
                                {dep.isGolden && (
                                  <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[8px] font-bold px-1.5 py-0.5 rounded shadow shadow-amber-500/10">
                                    🌟 GOLDEN
                                  </span>
                                )}
                              </td>

                              {/* Amount BTC */}
                              <td className="p-3 text-[11px] font-semibold text-right text-gray-100 whitespace-nowrap font-mono font-bold">
                                {dep.btcAmount.toFixed(8)} <span className="text-zinc-500 text-[10px]">BTC</span>
                              </td>

                              {/* Historic Price */}
                              <td className="p-3 text-[11px] text-right text-zinc-400 whitespace-nowrap">
                                {renderFiat(dep.btcPriceUSD, dep.btcPriceBRL)}
                              </td>

                              {/* Retroactive Cost */}
                              <td className="p-3 text-[11px] text-right text-zinc-400 whitespace-nowrap">
                                {renderFiat(dep.investedUSD, dep.investedBRL)}
                              </td>

                              {/* Current Valuation estimation */}
                              <td className="p-3 text-[11px] text-right text-emerald-400 font-bold whitespace-nowrap">
                                {renderFiat(dep.currentValueUSD, dep.currentValueBRL)}
                              </td>

                              {/* ROI Percent column */}
                              <td className="p-3 text-right whitespace-nowrap">
                                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                                  dep.roiPercent >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                                }`}>
                                  {dep.roiPercent >= 0 ? "+" : ""}{dep.roiPercent >= 0 ? dep.roiPercent.toFixed(0) : dep.roiPercent.toFixed(0)}%
                                </span>
                              </td>

                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                  </div>

                </div>

              </div>
            )}

          </div>
        )}

      </main>

      {/* Sovereign Footing Disclaimer */}
      <footer className="border-t border-subtle bg-[#08080A] px-6 py-6 mt-16 text-center text-xs font-mono text-zinc-500 relative">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-4 text-[10px]">
            <div className="flex items-center gap-1.5 flex-row">
              <span className="status-dot btc-bg-orange inline-block animate-pulse"></span>
              <span>MEMPOOL: CONECTADO</span>
            </div>
            <div className="flex items-center gap-1.5 flex-row">
              <span className="status-dot bg-emerald-500 inline-block animate-pulse"></span>
              <span>PREÇO BTC: SINCRONIZADO</span>
            </div>
            <div className="flex items-center gap-1.5 flex-row">
              <span className="status-dot bg-blue-500 inline-block"></span>
              <span>AUDIT SOBERANO: ATIVO</span>
            </div>
          </div>

          <div className="text-right space-y-1">
            <p className="text-zinc-400 text-[11px] font-bold">SATOSHILENS — Auditoria de Custódia e Riqueza Soberana Independente</p>
            <p className="text-[10px] text-zinc-650">Don't Trust, Verify • Sem trackers de terceiros • Lógica compilada diretamente da blockchain pública do Bitcoin.</p>
          </div>
          
        </div>
      </footer>

    </div>
  );
}
