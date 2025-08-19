from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import numpy as np

from ....core.deps import get_db
# from ....schemas.valuation import DCFRequest, DCFResponse, LBORequest, LBOResponse

router = APIRouter()


class DCFInput(BaseModel):
    base_revenue: float  # millions
    growth: List[float]  # 5-year growth rates
    ebitda_margin: List[float]  # 5-year EBITDA margins
    wacc: float  # discount rate
    ltm_pe: Optional[float] = None
    ltm_ev_ebitda: Optional[float] = None
    tax_rate: float = 0.25
    lgr: float  # long-term growth rate
    shares_out: Optional[float] = None  # shares outstanding
    net_debt: float = 0.0  # net debt, default 0

class Projection(BaseModel):
    year: int
    revenue: float
    ebitda: float
    fcff: float  # Free Cash Flow to Firm
    pv: float  # Present Value

class SensitivityPoint(BaseModel):
    wacc: float
    g: float  # long-term growth
    ev: float

class DCFResponse(BaseModel):
    projections: List[Projection]
    pv_sum: float  # Sum of PV of FCFFs
    tv_pv: float  # Present Value of Terminal Value
    ev: float  # Enterprise Value
    equity_value: Optional[float] = None  # EV - Net Debt
    implied_price: Optional[float] = None  # Equity Value / Shares Outstanding
    implied_pe: Optional[float] = None
    implied_ev_ebitda: Optional[float] = None
    sensitivity: List[SensitivityPoint]


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


@router.post("/dcf", response_model=DCFResponse)
async def calculate_dcf(inputs: DCFInput):
    """Calculate DCF valuation with sensitivity analysis."""
    
    projections = []
    current_year = 2024
    
    # Calculate 5-year projections
    for i in range(5):
        year = current_year + i + 1
        
        # Revenue projection
        if i == 0:
            revenue = inputs.base_revenue * (1 + inputs.growth[i])
        else:
            revenue = projections[i-1].revenue * (1 + inputs.growth[i])
        
        # EBITDA calculation
        ebitda = revenue * inputs.ebitda_margin[i]
        
        # Simplified FCFF calculation
        # FCFF = EBITDA * (1 - tax_rate) - ΔWorking Capital - Capex
        # Assumptions: ΔWC = 1% of revenue, Capex = 4% of revenue
        delta_wc = revenue * 0.01
        capex = revenue * 0.04
        
        fcff = ebitda * (1 - inputs.tax_rate) - delta_wc - capex
        
        # Present Value
        pv = fcff / ((1 + inputs.wacc) ** (i + 1))
        
        projections.append(Projection(
            year=year,
            revenue=revenue,
            ebitda=ebitda,
            fcff=fcff,
            pv=pv
        ))
    
    # Sum of PV of projections
    pv_sum = sum(p.pv for p in projections)
    
    # Terminal Value calculation (Gordon Growth Model)
    terminal_fcff = projections[-1].fcff * (1 + inputs.lgr)
    terminal_value = terminal_fcff / (inputs.wacc - inputs.lgr)
    tv_pv = terminal_value / ((1 + inputs.wacc) ** 5)  # Discount to present value
    
    # Enterprise Value
    ev = pv_sum + tv_pv
    
    # Equity calculations
    equity_value = None
    implied_price = None
    implied_pe = None
    implied_ev_ebitda = None
    
    if inputs.shares_out and inputs.shares_out > 0:
        equity_value = ev - inputs.net_debt
        implied_price = equity_value / inputs.shares_out
        
        # Implied multiples (using LTM if provided)
        if inputs.ltm_pe and inputs.ltm_pe > 0:
            # Approximate current earnings from P/E
            current_earnings = equity_value / inputs.ltm_pe if inputs.ltm_pe else None
            implied_pe = equity_value / current_earnings if current_earnings else None
    
    if inputs.ltm_ev_ebitda and inputs.ltm_ev_ebitda > 0:
        current_ebitda = ev / inputs.ltm_ev_ebitda
        implied_ev_ebitda = ev / current_ebitda if current_ebitda else None
    
    # Sensitivity Analysis
    sensitivity = []
    wacc_range = [inputs.wacc - 0.01, inputs.wacc - 0.005, inputs.wacc, inputs.wacc + 0.005, inputs.wacc + 0.01]
    lgr_range = [inputs.lgr - 0.01, inputs.lgr - 0.005, inputs.lgr, inputs.lgr + 0.005, inputs.lgr + 0.01]
    
    for wacc in wacc_range:
        for lgr in lgr_range:
            if wacc > lgr:  # Ensure WACC > LTG for valid calculation
                # Recalculate PV with different rates
                sens_pv_sum = sum(p.fcff / ((1 + wacc) ** (i + 1)) for i, p in enumerate(projections))
                sens_terminal_fcff = projections[-1].fcff * (1 + lgr)
                sens_terminal_value = sens_terminal_fcff / (wacc - lgr)
                sens_tv_pv = sens_terminal_value / ((1 + wacc) ** 5)
                sens_ev = sens_pv_sum + sens_tv_pv
                
                sensitivity.append(SensitivityPoint(
                    wacc=round(wacc, 3),
                    g=round(lgr, 3),
                    ev=round(sens_ev, 0)
                ))
    
    return DCFResponse(
        projections=projections,
        pv_sum=pv_sum,
        tv_pv=tv_pv,
        ev=ev,
        equity_value=equity_value,
        implied_price=implied_price,
        implied_pe=implied_pe,
        implied_ev_ebitda=implied_ev_ebitda,
        sensitivity=sensitivity
    )


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
