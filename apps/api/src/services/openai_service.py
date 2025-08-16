import openai
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
import json
import logging
from ..core.config import settings

logger = logging.getLogger(__name__)

class OpenAIService:
    """Service for generating AI-driven insights using OpenAI API."""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.OPENAI_API_KEY
        if self.api_key:
            openai.api_key = self.api_key
        self.model = "gpt-4-turbo-preview"  # Use latest GPT-4 model
        self.max_tokens = 4000
        
    async def _make_completion_request(self, messages: List[Dict[str, str]], 
                                    temperature: float = 0.3, 
                                    max_tokens: Optional[int] = None) -> Optional[Dict[str, Any]]:
        """Make completion request to OpenAI API with error handling."""
        if not self.api_key:
            logger.error("OpenAI API key not configured")
            return None
            
        try:
            response = await openai.ChatCompletion.acreate(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens or self.max_tokens,
                presence_penalty=0.0,
                frequency_penalty=0.0
            )
            
            return {
                "content": response.choices[0].message.content,
                "model": response.model,
                "usage": response.usage._asdict(),
                "finish_reason": response.choices[0].finish_reason
            }
            
        except Exception as e:
            logger.error(f"Error calling OpenAI API: {e}")
            return None

    async def generate_company_analysis(self, company_data: Dict[str, Any], 
                                      financial_data: Optional[Dict[str, Any]] = None,
                                      market_data: Optional[List[Dict[str, Any]]] = None) -> Optional[Dict[str, Any]]:
        """
        Generate comprehensive company analysis and investment outlook.
        
        Args:
            company_data: Basic company information
            financial_data: Financial metrics and ratios
            market_data: Recent stock price data
        """
        
        # Build context for the AI
        context = self._build_company_context(company_data, financial_data, market_data)
        
        messages = [
            {
                "role": "system",
                "content": """You are a professional financial analyst specializing in equity research. 
                Analyze the provided company data and generate a comprehensive investment analysis. 
                Focus on financial health, business fundamentals, competitive position, risks, and opportunities. 
                Provide a clear investment outlook (positive, neutral, negative) with supporting rationale."""
            },
            {
                "role": "user", 
                "content": f"""Please analyze this company and provide a comprehensive investment analysis:

{context}

Please structure your analysis with the following sections:
1. Executive Summary (2-3 sentences)
2. Financial Health Assessment
3. Business Fundamentals & Competitive Position  
4. Key Risks
5. Growth Opportunities
6. Investment Outlook (Positive/Neutral/Negative with price target if possible)

Keep the analysis concise but insightful, suitable for institutional investors."""
            }
        ]
        
        result = await self._make_completion_request(messages)
        if not result:
            return None
            
        return {
            "analysis": result["content"],
            "confidence_score": 0.8,  # Could be calculated based on data completeness
            "generated_at": datetime.utcnow().isoformat(),
            "model_info": {
                "model": result["model"],
                "tokens": result["usage"]
            }
        }

    async def generate_deal_analysis(self, deal_data: Dict[str, Any], 
                                   acquirer_data: Optional[Dict[str, Any]] = None,
                                   target_data: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        """
        Generate M&A deal analysis including rationale, synergies, and risks.
        
        Args:
            deal_data: Deal information (value, structure, timeline, etc.)
            acquirer_data: Acquiring company information
            target_data: Target company information
        """
        
        context = self._build_deal_context(deal_data, acquirer_data, target_data)
        
        messages = [
            {
                "role": "system",
                "content": """You are an M&A analyst with expertise in deal evaluation and strategic transactions. 
                Analyze the provided M&A transaction and generate a professional deal analysis memo. 
                Focus on strategic rationale, synergies, valuation, risks, and likelihood of completion."""
            },
            {
                "role": "user",
                "content": f"""Please analyze this M&A transaction:

{context}

Please structure your analysis with the following sections:
1. Deal Overview
2. Strategic Rationale
3. Valuation Analysis (fair value assessment)
4. Synergy Potential (revenue and cost synergies)
5. Key Risks & Regulatory Concerns
6. Completion Probability & Timeline
7. Investment Recommendation

Provide actionable insights for investors and stakeholders."""
            }
        ]
        
        result = await self._make_completion_request(messages)
        if not result:
            return None
            
        return {
            "analysis": result["content"],
            "confidence_score": 0.85,
            "generated_at": datetime.utcnow().isoformat(),
            "model_info": {
                "model": result["model"],
                "tokens": result["usage"]
            }
        }

    async def generate_market_commentary(self, market_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Generate AI commentary on market trends and M&A activity.
        
        Args:
            market_data: Aggregated market statistics and trends
        """
        
        context = json.dumps(market_data, indent=2)
        
        messages = [
            {
                "role": "system",
                "content": """You are a market strategist providing commentary on M&A market trends. 
                Analyze the provided market data and generate insightful commentary on current trends, 
                drivers, and outlook. Focus on actionable insights for investment professionals."""
            },
            {
                "role": "user",
                "content": f"""Analyze these M&A market trends and provide commentary:

{context}

Please provide:
1. Key Market Trends (3-4 main trends)
2. Sector Analysis (which sectors are hot/cold and why)
3. Deal Activity Drivers (what's driving current M&A activity)
4. Outlook & Predictions (next 6-12 months)
5. Investment Implications

Keep it concise and focus on actionable insights."""
            }
        ]
        
        result = await self._make_completion_request(messages)
        if not result:
            return None
            
        return {
            "commentary": result["content"],
            "confidence_score": 0.75,
            "generated_at": datetime.utcnow().isoformat(),
            "model_info": {
                "model": result["model"],
                "tokens": result["usage"]
            }
        }

    async def explain_alert(self, alert_data: Dict[str, Any], 
                          context_data: Optional[Dict[str, Any]] = None) -> Optional[str]:
        """
        Generate natural language explanation for an alert.
        
        Args:
            alert_data: Alert details (type, trigger, value, etc.)
            context_data: Additional context (company info, recent news, etc.)
        """
        
        alert_context = self._build_alert_context(alert_data, context_data)
        
        messages = [
            {
                "role": "system",
                "content": """You are a financial analyst explaining market alerts to investors. 
                Provide clear, concise explanations of what triggered the alert and why it matters. 
                Focus on practical implications and potential actions."""
            },
            {
                "role": "user",
                "content": f"""Explain this alert to an investor:

{alert_context}

Provide a 2-3 sentence explanation that covers:
- What happened (the trigger)
- Why it matters (significance)
- Potential implications

Keep it conversational and actionable."""
            }
        ]
        
        result = await self._make_completion_request(messages, temperature=0.2, max_tokens=200)
        if not result:
            return None
            
        return result["content"]

    async def generate_sector_analysis(self, sector: str, 
                                     deal_data: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """Generate sector-specific M&A analysis."""
        
        deal_summary = self._summarize_sector_deals(sector, deal_data)
        
        messages = [
            {
                "role": "system",
                "content": f"""You are an industry analyst specializing in the {sector} sector. 
                Analyze recent M&A activity and provide sector-specific insights including consolidation trends, 
                key drivers, and outlook."""
            },
            {
                "role": "user",
                "content": f"""Analyze M&A activity in the {sector} sector:

{deal_summary}

Please provide:
1. Sector Consolidation Trends
2. Key M&A Drivers
3. Valuation Trends
4. Active Strategic Buyers
5. Sector Outlook

Focus on sector-specific insights and implications for investors."""
            }
        ]
        
        result = await self._make_completion_request(messages)
        if not result:
            return None
            
        return {
            "analysis": result["content"],
            "sector": sector,
            "confidence_score": 0.8,
            "generated_at": datetime.utcnow().isoformat(),
            "model_info": {
                "model": result["model"],
                "tokens": result["usage"]
            }
        }

    def _build_company_context(self, company_data: Dict[str, Any], 
                             financial_data: Optional[Dict[str, Any]], 
                             market_data: Optional[List[Dict[str, Any]]]) -> str:
        """Build context string for company analysis."""
        
        context_parts = [
            f"Company: {company_data.get('name', 'Unknown')} ({company_data.get('ticker', 'N/A')})",
            f"Sector: {company_data.get('sector', 'Unknown')}",
            f"Industry: {company_data.get('industry', 'Unknown')}",
            f"Market Cap: ${company_data.get('market_cap', 'N/A'):,.0f}" if company_data.get('market_cap') else "Market Cap: N/A",
            f"Description: {company_data.get('description', 'No description available')}"
        ]
        
        if financial_data:
            context_parts.extend([
                "\nFinancial Metrics:",
                f"Revenue: ${financial_data.get('revenue', 'N/A'):,.0f}" if financial_data.get('revenue') else "Revenue: N/A",
                f"EBITDA: ${financial_data.get('ebitda', 'N/A'):,.0f}" if financial_data.get('ebitda') else "EBITDA: N/A",
                f"Net Income: ${financial_data.get('net_income', 'N/A'):,.0f}" if financial_data.get('net_income') else "Net Income: N/A",
                f"P/E Ratio: {financial_data.get('pe_ratio', 'N/A')}" if financial_data.get('pe_ratio') else "P/E Ratio: N/A",
                f"Debt/Equity: {financial_data.get('debt_to_equity', 'N/A')}" if financial_data.get('debt_to_equity') else "Debt/Equity: N/A"
            ])
            
        if market_data and len(market_data) > 0:
            recent_price = market_data[0].get('close', 'N/A')
            context_parts.append(f"\nRecent Stock Price: ${recent_price}")
            
        return "\n".join(context_parts)
    
    def _build_deal_context(self, deal_data: Dict[str, Any], 
                          acquirer_data: Optional[Dict[str, Any]], 
                          target_data: Optional[Dict[str, Any]]) -> str:
        """Build context string for deal analysis."""
        
        context_parts = [
            f"Deal: {deal_data.get('title', 'Unknown Transaction')}",
            f"Value: ${deal_data.get('deal_value', 'Undisclosed'):,.0f}" if deal_data.get('deal_value') else "Value: Undisclosed",
            f"Type: {deal_data.get('deal_type', 'Unknown')}",
            f"Status: {deal_data.get('status', 'Unknown')}",
            f"Announced: {deal_data.get('announced_date', 'Unknown')}"
        ]
        
        if acquirer_data:
            context_parts.extend([
                f"\nAcquirer: {acquirer_data.get('name', 'Unknown')} ({acquirer_data.get('ticker', 'N/A')})",
                f"Acquirer Sector: {acquirer_data.get('sector', 'Unknown')}"
            ])
            
        if target_data:
            context_parts.extend([
                f"\nTarget: {target_data.get('name', 'Unknown')} ({target_data.get('ticker', 'N/A')})",
                f"Target Sector: {target_data.get('sector', 'Unknown')}"
            ])
            
        return "\n".join(context_parts)
    
    def _build_alert_context(self, alert_data: Dict[str, Any], 
                           context_data: Optional[Dict[str, Any]]) -> str:
        """Build context string for alert explanation."""
        
        context_parts = [
            f"Alert Type: {alert_data.get('category', 'Unknown')}",
            f"Message: {alert_data.get('message', 'No message')}",
            f"Triggered At: {alert_data.get('triggered_at', 'Unknown')}"
        ]
        
        if context_data:
            context_parts.append(f"Additional Context: {json.dumps(context_data, indent=2)}")
            
        return "\n".join(context_parts)
    
    def _summarize_sector_deals(self, sector: str, deals: List[Dict[str, Any]]) -> str:
        """Summarize deals for sector analysis."""
        
        if not deals:
            return f"No recent M&A deals found in {sector} sector."
            
        total_value = sum(deal.get('deal_value', 0) for deal in deals if deal.get('deal_value'))
        
        summary = [
            f"Sector: {sector}",
            f"Recent Deals: {len(deals)}",
            f"Total Value: ${total_value:,.0f}" if total_value else "Total Value: Undisclosed",
        ]
        
        # Top deals
        top_deals = sorted(deals, key=lambda x: x.get('deal_value', 0), reverse=True)[:5]
        if top_deals:
            summary.append("\nTop Deals:")
            for deal in top_deals:
                value = f"${deal.get('deal_value', 0):,.0f}" if deal.get('deal_value') else "Undisclosed"
                summary.append(f"- {deal.get('title', 'Unknown')}: {value}")
                
        return "\n".join(summary)
