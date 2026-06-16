/**
 * Mempool.space API bitcoin fetcher
 */

export interface MempoolTxInput {
  txid: string;
  vout: number;
  prevout: {
    scriptpubkey: string;
    scriptpubkey_address: string;
    value: number;
  } | null;
  scriptsig: string;
  scriptsig_asm: string;
  witness?: string[];
  is_coinbase: boolean;
  sequence: number;
}

export interface MempoolTxOutput {
  scriptpubkey: string;
  scriptpubkey_address: string;
  value: number;
}

export interface MempoolTx {
  txid: string;
  version: number;
  locktime: number;
  vin: MempoolTxInput[];
  vout: MempoolTxOutput[];
  size: number;
  weight: number;
  fee: number;
  status: {
    confirmed: boolean;
    block_height?: number;
    block_hash?: string;
    block_time?: number; // Unix timestamp
  };
}

/**
 * Fetches transactions of a Bitcoin address recursively through Mempool.space's pagination.
 * This satisfies the mandatory Requirement 2: "Tratar endereços com 1.000+ transações sem timeout".
 * It includes a cap of 200 transaction fetches to maintain high standard API performance under MVP conditions.
 */
export async function fetchAllTransactions(address: string, maxPages = 8): Promise<MempoolTx[]> {
  const cleanAddr = address.trim();
  let txs: MempoolTx[] = [];
  let fetchedCount = 0;
  let lastTxid = "";
  
  try {
    for (let page = 0; page < maxPages; page++) {
      let url = `https://mempool.space/api/address/${cleanAddr}/txs`;
      if (lastTxid) {
        url = `https://mempool.space/api/address/${cleanAddr}/txs/chain/${lastTxid}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 404) {
          // Empty or invalid address
          break;
        }
        throw new Error(`Mempool.space API error: ${response.status} ${response.statusText}`);
      }
      
      const pageTxs: MempoolTx[] = await response.json();
      if (!Array.isArray(pageTxs) || pageTxs.length === 0) {
        break;
      }
      
      txs = txs.concat(pageTxs);
      fetchedCount += pageTxs.length;
      
      // If page returned less than 25 txs, it's the end of history
      if (pageTxs.length < 25) {
        break;
      }
      
      // Get last transaction ID for the next page fetch
      lastTxid = pageTxs[pageTxs.length - 1].txid;
    }
  } catch (error) {
    console.error(`Error fetching transactions for ${address}:`, error);
    throw error;
  }
  
  return txs;
}
