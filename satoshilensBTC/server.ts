/**
 * SatoshiLens - Express Server & Full-Stack Entrypoint
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { validateBitcoinAddress } from "./src/lib/validators.ts";
import { fetchAllTransactions } from "./src/lib/bitcoin.ts";
import { analyzeBitcoinAddress } from "./src/lib/calculator.ts";
import { initializePriceHistory } from "./src/lib/prices.ts";

// Initialize Gemini SDK with client telemetry
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for JSON
  app.use(express.json());

  // Warm up price caches on boot
  console.log("Preloading historical price charts...");
  await initializePriceHistory();

  // API Endpoints
  app.post("/api/analyze", async (req, res) => {
    try {
      const { address } = req.body;
      if (!address) {
        return res.status(400).json({ error: "Endereço Bitcoin é obrigatório." });
      }

      // 1. Validate
      const validation = validateBitcoinAddress(address);
      if (!validation.isValid) {
        return res.json({
          address,
          isValid: false,
          summary: null,
          deposits: [],
          chartData: [],
          insights: null,
        });
      }

      // 2. Fetch all txs
      console.log(`Analyzing blockchain transactions for address: ${address}`);
      const txs = await fetchAllTransactions(address);

      // 3. Calculator engine P&L
      const report = await analyzeBitcoinAddress(address, txs);

      // 4. Generate Portfolio Insights via Gemini Pro or fallback local engine
      let insights = null;
      if (report.deposits.length > 0) {
        insights = await generateInsights(address, report.summary, report.deposits.length);
      }

      return res.json({
        address,
        isValid: true,
        summary: report.summary,
        deposits: report.deposits,
        chartData: report.chartData,
        insights,
      });
    } catch (error: any) {
      console.error("Analysis route error:", error);
      return res.status(500).json({ error: "Erro interno ao processar endereço Bitcoin: " + error.message });
    }
  });

  // Vite middleware setup for Development/Production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SatoshiLens Server running on http://0.0.0.0:${PORT}`);
  });
}

/**
 * Generate premium portfolio strategic insights
 */
async function generateInsights(address: string, summary: any, depositCount: number) {
  const hasApiKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY";

  if (!hasApiKey) {
    return generateLocalFallbackInsights(address, summary, depositCount);
  }

  try {
    const prompt = `
Você é SatoshiLens, o analista financeiro de elite especializado em blockchain Bitcoin e economia austríaca.
Analise os seguintes dados consolidados e histórico de aportes para o endereço Bitcoin "${address}":

- Total Acumulado: ${summary.totalBTC.toFixed(8)} BTC
- Preço Atual do BTC: R$ ${summary.currentBtcPriceBRL.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} BRL / $ ${summary.currentBtcPriceUSD.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD
- Valor de Mercado Atual: R$ ${summary.currentValueBRL.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} BRL / $ ${summary.currentValueUSD.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD
- Total de Capital Investido: R$ ${summary.totalInvestedBRL.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} BRL / $ ${summary.totalInvestedUSD.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD
- Preço Médio de Aquisição (DCA Price): R$ ${summary.avgCostBasisBRL.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} BRL / $ ${summary.avgCostBasisUSD.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD
- Retorno sobre Investimento Geral (ROI): ${summary.consolidatedROI.toFixed(2)}%
- Lucro/Prejuízo Total em USD (P&L): $ ${summary.totalPnlUSD.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD
- Retorno do Melhor Aporte Isolado (Golden IP): ${summary.bestDepositRoi.toFixed(2)}% efetuado em ${summary.bestDepositDate}
- drawdown Máximo Histórico do Portfólio: ${summary.worstDrawdownPercent.toFixed(2)}%
- Quantidade total de depósitos filtrados: ${depositCount} aportes

Escreva um relatório de crítica de finanças soberanas em PORTUGUÊS BRASILEIRO com tom refinado, como um estrategista-chefe de investimentos.
As suas recomendações devem obedecer 100% à segurança e privacidade na blockchain.
A sua resposta deve ser em formato JSON de acordo com o seguinte esquema obrigatório:

{
  "summaryText": "Breve parágrafo analítico opinativo sobre a conduta financeira desse endereço Bitcoin.",
  "investmentProfile": "Uma das categorias: DCA Accumulator, Whale Hodler, Active Swing Trader, Micro-Stacker, Passive Saver",
  "strengths": [
    "Primeiro ponto forte específico, ex: cronometragem ideal de entrada no ano X",
    "Segundo ponto forte específico baseado na média de preço favorável",
    "Terceiro ponto forte específico sobre a preservação patrimonial"
  ],
  "recommendations": [
    "Primeiro conselho de ação prático baseado focando em UTXO management",
    "Segundo conselho focando em privacidade ou taxas de envio",
    "Terceiro conselho geral de aporte ou estratégia"
  ]
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summaryText: { type: Type.STRING },
            investmentProfile: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["summaryText", "investmentProfile", "strengths", "recommendations"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return {
      address,
      createdAt: new Date().toISOString(),
      ...parsed,
    };
  } catch (error) {
    console.error("Gemini AI API insight generation error:", error);
    return generateLocalFallbackInsights(address, summary, depositCount);
  }
}

/**
 * Highly customized mathematical Portuguese analyzer framework mapping directly to portfolio states.
 */
function generateLocalFallbackInsights(address: string, summary: any, depositCount: number) {
  let investmentProfile: "DCA Accumulator" | "Whale Hodler" | "Active Swing Trader" | "Micro-Stacker" | "Passive Saver" = "DCA Accumulator";
  let summaryText = `Este endereço acumula ${summary.totalBTC.toFixed(5)} BTC divididos em ${depositCount} aportes sequenciais, com preço médio de aquisição de R$ ${summary.avgCostBasisBRL.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}.`;
  
  const strengths = [
    "Histórico consistente de acumulação soberana fora das exchanges",
    "Mitigação inteligente da volatilidade através de aquisições fracionadas chronológicas",
  ];
  
  const recommendations = [
    "Consolide seus UTXOs (saídas de transação) quando as taxas da rede mempool estiverem baixas (abaixo de 12 sat/vB).",
    "Considere estabelecer uma estratégia de DCA programada para blindar emocionalmente sua acumulação contra picos de mercado.",
    "Evite fazer envios de partes exatas que exponham seu saldo residual para manter sua soberania de privacidade.",
  ];

  // Specific profile classifications based on authentic metrics
  if (summary.totalBTC >= 1.0) {
    investmentProfile = "Whale Hodler";
    summaryText += " Seu patrimônio supera a marca crítica de 1 wholecoin, posicionando você no seleto topo global da rede monetária Bitcoin.";
    strengths.push("Presença expressiva de capital com soberania network extraordinária");
    recommendations.unshift("Recomendado implementar solução multifirmas (multi-sig Cold Storage) para montantes acima de 1 BTC.");
  } else if (depositCount >= 10) {
    investmentProfile = "DCA Accumulator";
    summaryText += " Padrão evidente de aporte frequente tipo DCA (Dollar Cost Averaging), técnica ideal para minimizar o estresse financeiro nas tendências cíclicas.";
    strengths.push(`Frequência notável de aportes provendo excelente suavização matemática`);
  } else if (depositCount <= 2) {
    investmentProfile = "Passive Saver";
    summaryText += " Perfil de poupança estática. Os fundos ingressaram em aportes grandes únicos e permanecem inertes, típico de cofres frios institucionais ou HODLers raiz.";
    strengths.push("Postura firme de convicção absoluta sem movimentações desnecessárias de curtíssimo prazo");
  } else {
    investmentProfile = "Micro-Stacker";
    summaryText += " Perfil focado em empilhar satoshis aos poucos (micro-stacking), estabelecendo uma excelente base econômica de longo prazo.";
    strengths.push("Inclusão financeira soberana ideal com baixo risco de liquidez inicial");
  }

  if (summary.consolidatedROI > 50) {
    strengths.push(`Excelente margem de ROI total consolidada de ${summary.consolidatedROI.toFixed(1)}% devido ao timing das aquisições.`);
  } else if (summary.consolidatedROI < 0) {
    strengths.push("Resiliência comprovada mantendo o portfólio firme mesmo em momentos temporários de correção cíclica.");
    recommendations.push("Excelente janela histórica de oportunidade para baratear o seu Preço Médio de entrada atual.");
  }

  return {
    address,
    createdAt: new Date().toISOString(),
    summaryText,
    investmentProfile,
    strengths: strengths.slice(0, 3),
    recommendations: recommendations.slice(0, 3),
  };
}

startServer();
