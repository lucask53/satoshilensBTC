/**
 * SatoshiLens Type Definitions
 */

export interface DepositTransaction {
  txid: string;
  date: string; // YYYY-MM-DD
  timestamp: number; // Unix timestamp
  btcAmount: number; // BTC values
  btcPriceUSD: number; // BTC price in USD at deposit date
  btcPriceBRL: number; // BTC price in BRL at deposit date
  investedUSD: number; // btcAmount * btcPriceUSD
  investedBRL: number; // btcAmount * btcPriceBRL
  currentValueUSD: number; // btcAmount * currentBtcPriceUSD
  currentValueBRL: number; // btcAmount * currentBtcPriceBRL
  pnlUSD: number; // currentValueUSD - investedUSD
  pnlBRL: number; // currentValueBRL - investedBRL
  roiPercent: number; // ((currentBtcPriceUSD - btcPriceUSD) / btcPriceUSD) * 100
  isGolden: boolean; // True if this deposit has the highest ROI
}

export interface PortfolioSummary {
  address: string;
  totalBTC: number;
  currentBtcPriceUSD: number;
  currentBtcPriceBRL: number;
  currentValueUSD: number;
  currentValueBRL: number;
  totalInvestedUSD: number;
  totalInvestedBRL: number;
  totalPnlUSD: number;
  totalPnlBRL: number;
  consolidatedROI: number;
  avgCostBasisUSD: number; // DCA price in USD
  avgCostBasisBRL: number; // DCA price in BRL
  worstDrawdownPercent: number; // Simulated or historical max drawdown
  bestDepositRoi: number; // Best individual deposit ROI
  bestDepositDate: string;
  totalDepositsCount: number;
  unconfirmedCount: number;
}

export interface ChartPoint {
  date: string; // YYYY-MM-DD
  timestamp: number;
  portfolioValueUSD: number;
  portfolioValueBRL: number;
  btcPriceUSD: number;
  btcPriceBRL: number;
  cumulativeBTC: number;
}

export interface AiInsights {
  address: string;
  createdAt: string;
  summaryText: string;
  investmentProfile: "DCA Accumulator" | "Whale Hodler" | "Active Swing Trader" | "Micro-Stacker" | "Passive Saver";
  strengths: string[];
  recommendations: string[];
}

export interface AnalysisResult {
  address: string;
  isValid: boolean;
  summary: PortfolioSummary;
  deposits: DepositTransaction[];
  chartData: ChartPoint[];
  insights: AiInsights | null;
}

export interface WatchlistItem {
  address: string;
  label: string;
  addedAt: string;
  lastBalanceBTC: number;
}
