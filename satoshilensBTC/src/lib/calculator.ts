/**
 * SatoshiLens - Investment Calculations Engine
 */

import { MempoolTx } from "./bitcoin";
import { DepositTransaction, PortfolioSummary, ChartPoint } from "../types";
import { getHistoricalBtcPrice, getHistoricalBrlExchangeRate, getCurrentPrice } from "./prices";

/**
 * Validates if a transaction counts as an external deposit.
 * Excludes transactions where our address was an input (change outputs or self-transfers).
 */
export function isDeposit(tx: MempoolTx, address: string): boolean {
  if (!tx || !tx.vout) return false;
  
  // 1. Must have our address in the outputs list
  const isOutput = tx.vout.some(
    out => out.scriptpubkey_address && out.scriptpubkey_address.trim() === address.trim()
  );
  
  if (!isOutput) return false;
  
  // 2. To avoid change outputs, our address must NOT be in the inputs
  const isInput = tx.vin && tx.vin.some(
    inp => inp.prevout && inp.prevout.scriptpubkey_address && inp.prevout.scriptpubkey_address.trim() === address.trim()
  );
  
  return !isInput;
}

/**
 * Calculates total satoshis received by our address in a transaction
 */
export function getDepositAmount(tx: MempoolTx, address: string): number {
  if (!tx || !tx.vout) return 0;
  return tx.vout
    .filter(out => out.scriptpubkey_address && out.scriptpubkey_address.trim() === address.trim())
    .reduce((sum, out) => sum + out.value, 0);
}

/**
 * Helper to convert Unix timestamp to YYYY-MM-DD string
 */
export function formatUnixDate(unixTime: number): string {
  const date = new Date(unixTime * 1000);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Process a Bitcoin address transactions array and return the full parsed wealth report
 */
export async function analyzeBitcoinAddress(address: string, txs: MempoolTx[]): Promise<{
  deposits: DepositTransaction[];
  summary: PortfolioSummary;
  chartData: ChartPoint[];
}> {
  const cleanAddr = address.trim();
  const livePrices = await getCurrentPrice();
  
  // 1. Filter and parse deposits
  const rawDeposits = txs.filter(tx => isDeposit(tx, cleanAddr));
  
  // Sort oldest to newest for chronological simulation (drawdown & cumulative balance)
  const sortedRawDeposits = [...rawDeposits].sort((a, b) => {
    const timeA = a.status.block_time || Math.floor(Date.now() / 1000);
    const timeB = b.status.block_time || Math.floor(Date.now() / 1000);
    return timeA - timeB;
  });

  const parsedDeposits: DepositTransaction[] = [];
  let unconfirmedCount = 0;
  
  for (const tx of sortedRawDeposits) {
    const time = tx.status.block_time || Math.floor(Date.now() / 1000);
    const dateStr = formatUnixDate(time);
    const btcAmount = getDepositAmount(tx, cleanAddr) / 1e8; // Satoshis to BTC
    
    // Get historical price at that day
    const btcPriceUSD = await getHistoricalBtcPrice(dateStr);
    const brlRate = getHistoricalBrlExchangeRate(dateStr);
    const btcPriceBRL = btcPriceUSD * brlRate;
    
    const investedUSD = btcAmount * btcPriceUSD;
    const investedBRL = btcAmount * btcPriceBRL;
    
    const currentValueUSD = btcAmount * livePrices.usd;
    const currentValueBRL = btcAmount * livePrices.brl;
    
    const pnlUSD = currentValueUSD - investedUSD;
    const pnlBRL = currentValueBRL - investedBRL;
    
    const roiPercent = btcPriceUSD > 0 ? ((livePrices.usd - btcPriceUSD) / btcPriceUSD) * 100 : 0;
    
    if (!tx.status.confirmed) {
      unconfirmedCount++;
    }

    parsedDeposits.push({
      txid: tx.txid,
      date: dateStr,
      timestamp: time,
      btcAmount,
      btcPriceUSD,
      btcPriceBRL,
      investedUSD,
      investedBRL,
      currentValueUSD,
      currentValueBRL,
      pnlUSD,
      pnlBRL,
      roiPercent,
      isGolden: false, // will flag later
    });
  }

  // Handle empty state gracefully
  if (parsedDeposits.length === 0) {
    const emptySummary: PortfolioSummary = {
      address: cleanAddr,
      totalBTC: 0,
      currentBtcPriceUSD: livePrices.usd,
      currentBtcPriceBRL: livePrices.brl,
      currentValueUSD: 0,
      currentValueBRL: 0,
      totalInvestedUSD: 0,
      totalInvestedBRL: 0,
      totalPnlUSD: 0,
      totalPnlBRL: 0,
      consolidatedROI: 0,
      avgCostBasisUSD: 0,
      avgCostBasisBRL: 0,
      worstDrawdownPercent: 0,
      bestDepositRoi: 0,
      bestDepositDate: "",
      totalDepositsCount: 0,
      unconfirmedCount: 0,
    };
    
    return { deposits: [], summary: emptySummary, chartData: [] };
  }

  // Identify Golden deposit (Highest ROI)
  let highestRoi = -999999;
  let goldenIdx = -1;
  parsedDeposits.forEach((dep, i) => {
    if (dep.roiPercent > highestRoi) {
      highestRoi = dep.roiPercent;
      goldenIdx = i;
    }
  });
  if (goldenIdx !== -1) {
    parsedDeposits[goldenIdx].isGolden = true;
  }

  // Calculate Consolidated Statistics
  const totalBTC = parsedDeposits.reduce((sum, dep) => sum + dep.btcAmount, 0);
  const totalInvestedUSD = parsedDeposits.reduce((sum, dep) => sum + dep.investedUSD, 0);
  const totalInvestedBRL = parsedDeposits.reduce((sum, dep) => sum + dep.investedBRL, 0);
  
  const currentValueUSD = totalBTC * livePrices.usd;
  const currentValueBRL = totalBTC * livePrices.brl;
  
  const totalPnlUSD = currentValueUSD - totalInvestedUSD;
  const totalPnlBRL = currentValueBRL - totalInvestedBRL;
  
  const consolidatedROI = totalInvestedUSD > 0 ? (totalPnlUSD / totalInvestedUSD) * 100 : 0;
  const avgCostBasisUSD = totalBTC > 0 ? totalInvestedUSD / totalBTC : 0;
  const avgCostBasisBRL = totalBTC > 0 ? totalInvestedBRL / totalBTC : 0;
  
  const bestDep = goldenIdx !== -1 ? parsedDeposits[goldenIdx] : null;

  // 4. Generate Performance Chart Data (Recharts)
  // Step chronological simulation with running balance to calculate historical values and max drawdowns
  const chartData: ChartPoint[] = [];
  let cumulativeBTC = 0;
  let runningPeakValueUSD = 0;
  let maxDrawdown = 0;

  // To build a fluid timeline, calculate portfolio metrics for each deposit occasion
  // and sample the days in-between to build a beautiful visual graph.
  for (let i = 0; i < parsedDeposits.length; i++) {
    const dep = parsedDeposits[i];
    cumulativeBTC += dep.btcAmount;

    chartData.push({
      date: dep.date,
      timestamp: dep.timestamp,
      portfolioValueUSD: cumulativeBTC * dep.btcPriceUSD,
      portfolioValueBRL: cumulativeBTC * dep.btcPriceBRL,
      btcPriceUSD: dep.btcPriceUSD,
      btcPriceBRL: dep.btcPriceBRL,
      cumulativeBTC,
    });

    const valUSD = cumulativeBTC * dep.btcPriceUSD;
    if (valUSD > runningPeakValueUSD) {
      runningPeakValueUSD = valUSD;
    } else if (runningPeakValueUSD > 0) {
      const dd = ((runningPeakValueUSD - valUSD) / runningPeakValueUSD) * 100;
      if (dd > maxDrawdown) {
        maxDrawdown = dd;
      }
    }

    // If there is a large gap between transactions, let's insert synthetic points
    // based on real historical lookup to make the chart curve smooth and realistic.
    if (i < parsedDeposits.length - 1) {
      const nextDep = parsedDeposits[i + 1];
      const gapSeconds = nextDep.timestamp - dep.timestamp;
      const gapDays = Math.floor(gapSeconds / (24 * 3600));

      // Sample spacing based on gap size so we don't generate too many points
      let stepDays = 15;
      if (gapDays > 365) stepDays = 45;
      else if (gapDays > 180) stepDays = 30;
      else if (gapDays < 30) stepDays = 5;

      if (gapDays > stepDays) {
        for (let d = stepDays; d < gapDays; d += stepDays) {
          const sampleTime = dep.timestamp + (d * 24 * 3600);
          const sampleDateStr = formatUnixDate(sampleTime);
          const samplePriceUSD = await getHistoricalBtcPrice(sampleDateStr);
          const sampleBrlRate = getHistoricalBrlExchangeRate(sampleDateStr);
          const samplePriceBRL = samplePriceUSD * sampleBrlRate;
          const sampleValUSD = cumulativeBTC * samplePriceUSD;

          chartData.push({
            date: sampleDateStr,
            timestamp: sampleTime,
            portfolioValueUSD: sampleValUSD,
            portfolioValueBRL: cumulativeBTC * samplePriceBRL,
            btcPriceUSD: samplePriceUSD,
            btcPriceBRL: samplePriceBRL,
            cumulativeBTC,
          });

          if (sampleValUSD > runningPeakValueUSD) {
            runningPeakValueUSD = sampleValUSD;
          } else if (runningPeakValueUSD > 0) {
            const dd = ((runningPeakValueUSD - sampleValUSD) / runningPeakValueUSD) * 100;
            if (dd > maxDrawdown) {
              maxDrawdown = dd;
            }
          }
        }
      }
    }
  }

  // Append a final point representing TODAY's current valuation
  const todayTime = Math.floor(Date.now() / 1000);
  const todayDateStr = formatUnixDate(todayTime);
  const todayVal = cumulativeBTC * livePrices.usd;
  
  chartData.push({
    date: todayDateStr,
    timestamp: todayTime,
    portfolioValueUSD: todayVal,
    portfolioValueBRL: cumulativeBTC * livePrices.brl,
    btcPriceUSD: livePrices.usd,
    btcPriceBRL: livePrices.brl,
    cumulativeBTC,
  });

  if (todayVal > runningPeakValueUSD) {
    runningPeakValueUSD = todayVal;
  } else if (runningPeakValueUSD > 0) {
    const dd = ((runningPeakValueUSD - todayVal) / runningPeakValueUSD) * 100;
    if (dd > maxDrawdown) {
      maxDrawdown = dd;
    }
  }

  // Sort chart data ascending chronologically is required for Recharts rendering
  chartData.sort((a, b) => a.timestamp - b.timestamp);

  const summary: PortfolioSummary = {
    address: cleanAddr,
    totalBTC,
    currentBtcPriceUSD: livePrices.usd,
    currentBtcPriceBRL: livePrices.brl,
    currentValueUSD,
    currentValueBRL,
    totalInvestedUSD,
    totalInvestedBRL,
    totalPnlUSD,
    totalPnlBRL,
    consolidatedROI,
    avgCostBasisUSD,
    avgCostBasisBRL,
    worstDrawdownPercent: maxDrawdown,
    bestDepositRoi: bestDep ? bestDep.roiPercent : 0,
    bestDepositDate: bestDep ? bestDep.date : "",
    totalDepositsCount: parsedDeposits.length,
    unconfirmedCount,
  };

  return {
    deposits: parsedDeposits.reverse(), // Reverse deposits so table shows most recent first
    summary,
    chartData,
  };
}
