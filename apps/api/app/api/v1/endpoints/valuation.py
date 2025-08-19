from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from pydantic import BaseModel
import numpy as np

from ....core.deps import get_db
# from ....schemas.valuation import DCFRequest, DCFResponse, LBORequest, LBOResponse

router = APIRouter()


class DCFInputs(BaseModel):
    ticker: str = None
    revenue_base: float = 1000.0  # Base revenue in millions
    revenue_growth: List[float] = [0.15, 0.12, 0.10, 0.08, 0.05]  # 5-year growth rates
    ebitda_margin: List[float] = [0.25, 0.26, 0.27, 0.27, 0.28]  # 5-year margins
    tax_rate: float = 0.25
    capex_pct_revenue: List[float] = [0.08, 0.07, 0.06, 0.06, 0.05]  # CapEx as % of revenue
    nwc_pct_revenue: float = 0.05  # Net working capital as % of revenue
    wacc: float = 0.10  # Weighted average cost of capital
    ltg: float = 0.025  # Long-term growth rate
    years: int = 5


class LBOInputs(BaseModel):
    ticker: str = None
    enterprise_value: float = 5000.0  # EV in millions
    revenue: float = 2000.0  # Revenue in millions
    ebitda: float = 500.0  # EBITDA in millions
    leverage: float = 6.0  # Debt/EBITDA multiple
    entry_multiple: float = 10.0  # Entry EV/EBITDA multiple  
    exit_multiple: float = 12.0  # Exit EV/EBITDA multiple
    interest_rate: float = 0.08  # Interest rate on debt
    years: int = 5
    ebitda_growth: List[float] = [0.08, 0.07, 0.06, 0.06, 0.05]  # EBITDA growth rates


@router.post("/dcf", )
async def calculate_dcf(
    inputs: DCFInputs,
    db: Session = Depends(get_db)
):
    """Calculate DCF valuation with sensitivity analysis."""
    try:
        # DCF calculation logic
        revenues = []
        ebitdas = []
        fcfs = []
        
        base_revenue = inputs.revenue_base
        
        for i in range(inputs.years):
            revenue = base_revenue * (1 + inputs.revenue_growth[i])
            ebitda = revenue * inputs.ebitda_margin[i]
            
            # NOPAT calculation
            nopat = ebitda * (1 - inputs.tax_rate)
            
            # Free Cash Flow
            capex = revenue * inputs.capex_pct_revenue[i]
            nwc_change = revenue * inputs.nwc_pct_revenue * inputs.revenue_growth[i]
            fcf = nopat - capex - nwc_change
            
            revenues.append(round(revenue, 1))
            ebitdas.append(round(ebitda, 1))
            fcfs.append(round(fcf, 1))
            
            base_revenue = revenue
        
        # Terminal value
        terminal_fcf = fcfs[-1] * (1 + inputs.ltg)
        terminal_value = terminal_fcf / (inputs.wacc - inputs.ltg)
        
        # Present values
        pv_fcfs = []
        for i, fcf in enumerate(fcfs):
            pv = fcf / ((1 + inputs.wacc) ** (i + 1))
            pv_fcfs.append(round(pv, 1))
        
        pv_terminal = terminal_value / ((1 + inputs.wacc) ** inputs.years)
        
        enterprise_value = sum(pv_fcfs) + pv_terminal
        
        # Sensitivity analysis
        wacc_range = [inputs.wacc - 0.02, inputs.wacc - 0.01, inputs.wacc, inputs.wacc + 0.01, inputs.wacc + 0.02]
        ltg_range = [inputs.ltg - 0.01, inputs.ltg - 0.005, inputs.ltg, inputs.ltg + 0.005, inputs.ltg + 0.01]
        
        sensitivity_grid = []
        for wacc in wacc_range:
            row = []
            for ltg in ltg_range:
                if wacc <= ltg:
                    ev = enterprise_value  # Avoid division by zero
                else:
                    terminal_val = terminal_fcf / (wacc - ltg)
                    pv_terminal_sens = terminal_val / ((1 + wacc) ** inputs.years)
                    pv_fcfs_sens = [fcf / ((1 + wacc) ** (i + 1)) for i, fcf in enumerate(fcfs)]
                    ev = sum(pv_fcfs_sens) + pv_terminal_sens
                row.append(round(ev, 0))
            sensitivity_grid.append(row)
        
        response = {
            "inputs": inputs.dict(),
            "projections": {
                "revenues": revenues,
                "ebitdas": ebitdas,
                "free_cash_flows": fcfs
            },
            "valuation": {
                "pv_of_fcfs": round(sum(pv_fcfs), 1),
                "pv_of_terminal": round(pv_terminal, 1),
                "enterprise_value": round(enterprise_value, 1),
                "terminal_value": round(terminal_value, 1)
            },
            "sensitivity": {
                "wacc_range": wacc_range,
                "ltg_range": ltg_range,
                "ev_grid": sensitivity_grid
            }
        }
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/lbo", )
async def calculate_lbo(
    inputs: LBOInputs,
    db: Session = Depends(get_db)
):
    """Calculate LBO returns with sensitivity analysis."""
    try:
        # LBO calculation
        initial_debt = inputs.ebitda * inputs.leverage
        initial_equity = inputs.enterprise_value - initial_debt
        
        # Project EBITDA
        ebitdas = []
        base_ebitda = inputs.ebitda
        
        for i in range(inputs.years):
            ebitda = base_ebitda * (1 + inputs.ebitda_growth[i])
            ebitdas.append(round(ebitda, 1))
            base_ebitda = ebitda
        
        # Exit valuation
        exit_ebitda = ebitdas[-1]
        exit_ev = exit_ebitda * inputs.exit_multiple
        
        # Debt paydown (simplified)
        annual_debt_paydown = initial_debt * 0.15  # Assume 15% annual paydown
        exit_debt = max(0, initial_debt - (annual_debt_paydown * inputs.years))
        
        exit_equity_value = exit_ev - exit_debt
        
        # Returns calculation
        money_multiple = exit_equity_value / initial_equity
        irr = (money_multiple ** (1/inputs.years)) - 1
        
        # Sources and uses
        sources_uses = {
            "sources": {
                "debt": round(initial_debt, 1),
                "equity": round(initial_equity, 1),
                "total": round(inputs.enterprise_value, 1)
            },
            "uses": {
                "enterprise_value": round(inputs.enterprise_value, 1),
                "fees": round(inputs.enterprise_value * 0.02, 1),  # 2% fees
                "total": round(inputs.enterprise_value * 1.02, 1)
            }
        }
        
        # Sensitivity analysis
        exit_multiples = [inputs.exit_multiple - 1, inputs.exit_multiple - 0.5, inputs.exit_multiple, inputs.exit_multiple + 0.5, inputs.exit_multiple + 1]
        leverage_multiples = [inputs.leverage - 1, inputs.leverage - 0.5, inputs.leverage, inputs.leverage + 0.5, inputs.leverage + 1]
        
        irr_grid = []
        for exit_mult in exit_multiples:
            row = []
            for lev in leverage_multiples:
                debt = inputs.ebitda * lev
                equity = inputs.enterprise_value - debt
                exit_val = exit_ebitda * exit_mult
                exit_eq = exit_val - max(0, debt - (annual_debt_paydown * inputs.years))
                mm = exit_eq / equity
                calc_irr = (mm ** (1/inputs.years)) - 1
                row.append(round(calc_irr * 100, 1))  # Convert to percentage
            irr_grid.append(row)
        
        response = {
            "inputs": inputs.dict(),
            "projections": {
                "ebitdas": ebitdas
            },
            "returns": {
                "initial_equity": round(initial_equity, 1),
                "exit_equity_value": round(exit_equity_value, 1),
                "money_multiple": round(money_multiple, 2),
                "irr": round(irr * 100, 1)  # Percentage
            },
            "sources_and_uses": sources_uses,
            "sensitivity": {
                "exit_multiples": exit_multiples,
                "leverage_multiples": leverage_multiples,
                "irr_grid": irr_grid
            }
        }
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
