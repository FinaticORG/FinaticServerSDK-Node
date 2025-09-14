/**
 * Portfolio-related type definitions.
 */

export interface Holding {
  /** Trading symbol */
  symbol: string;
  /** Quantity held */
  quantity: number;
  /** Average purchase price */
  average_price: number;
  /** Current market price */
  current_price: number;
  /** Current market value */
  market_value: number;
  /** Unrealized profit/loss */
  unrealized_pnl: number;
  /** Realized profit/loss */
  realized_pnl: number;
  /** Total cost basis */
  cost_basis: number;
  /** Currency */
  currency: string;
}

export interface PerformanceMetrics {
  /** Total return percentage */
  total_return: number;
  /** Daily return percentage */
  daily_return: number;
  /** Weekly return percentage */
  weekly_return: number;
  /** Monthly return percentage */
  monthly_return: number;
  /** Yearly return percentage */
  yearly_return: number;
  /** Maximum drawdown */
  max_drawdown: number;
  /** Sharpe ratio */
  sharpe_ratio: number;
  /** Beta */
  beta: number;
  /** Alpha */
  alpha: number;
}

export interface Portfolio {
  /** Portfolio ID */
  id: string;
  /** Portfolio name */
  name: string;
  /** Portfolio type */
  type: string;
  /** Portfolio status */
  status: string;
  /** Available cash */
  cash: number;
  /** Buying power */
  buying_power: number;
  /** Total equity */
  equity: number;
  /** Long market value */
  long_market_value: number;
  /** Short market value */
  short_market_value: number;
  /** Initial margin requirement */
  initial_margin: number;
  /** Maintenance margin requirement */
  maintenance_margin: number;
  /** Last equity value */
  last_equity: number;
  /** Portfolio positions */
  positions: Holding[];
  /** Performance metrics */
  performance: PerformanceMetrics;
  /** Total portfolio value */
  total_value?: number;
  /** Holdings */
  holdings?: Holding[];
}

export interface PortfolioSnapshot {
  /** Snapshot timestamp */
  timestamp: string;
  /** Total portfolio value */
  total_value: number;
  /** Available cash */
  cash: number;
  /** Total equity */
  equity: number;
  /** Position data */
  positions: Record<string, any>[];
}
