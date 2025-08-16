import httpx
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from ..core.config import settings
import logging

logger = logging.getLogger(__name__)

class NewsAPIService:
    """Service for interacting with NewsAPI for financial news."""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.NEWS_API_KEY
        self.base_url = "https://newsapi.org/v2"
        self.timeout = httpx.Timeout(30.0)
        
    async def _make_request(self, endpoint: str, params: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Make request to NewsAPI with error handling."""
        if not self.api_key:
            logger.error("NewsAPI key not configured")
            return None
            
        headers = {"X-API-Key": self.api_key}
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/{endpoint}", 
                    params=params, 
                    headers=headers
                )
                response.raise_for_status()
                
                data = response.json()
                
                if data.get("status") != "ok":
                    logger.error(f"NewsAPI Error: {data.get('message', 'Unknown error')}")
                    return None
                    
                return data
                
        except httpx.HTTPError as e:
            logger.error(f"HTTP error calling NewsAPI: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error calling NewsAPI: {e}")
            return None

    async def get_company_news(self, company_name: str, ticker: Optional[str] = None, 
                             days_back: int = 30, language: str = "en") -> Optional[List[Dict[str, Any]]]:
        """
        Get news articles related to a specific company.
        
        Args:
            company_name: Company name to search for
            ticker: Optional stock ticker symbol
            days_back: Number of days back to search (max 30 for free tier)
            language: Language code (e.g., 'en', 'es', 'fr')
        """
        # Build search query
        query_parts = [f'"{company_name}"']
        if ticker:
            query_parts.append(f'"{ticker}"')
            
        # Add financial keywords to improve relevance
        financial_keywords = ["earnings", "revenue", "profit", "acquisition", "merger", "IPO", "stock"]
        query = f"({' OR '.join(query_parts)}) AND ({' OR '.join(financial_keywords)})"
        
        from_date = (datetime.now() - timedelta(days=days_back)).strftime("%Y-%m-%d")
        
        params = {
            "q": query,
            "from": from_date,
            "language": language,
            "sortBy": "publishedAt",
            "pageSize": 100  # Max articles per request
        }
        
        data = await self._make_request("everything", params)
        if not data or "articles" not in data:
            return None
            
        articles = []
        for article in data["articles"]:
            articles.append({
                "title": article.get("title"),
                "description": article.get("description"),
                "content": article.get("content"),
                "url": article.get("url"),
                "source": article.get("source", {}).get("name"),
                "author": article.get("author"),
                "published_at": article.get("publishedAt"),
                "url_to_image": article.get("urlToImage")
            })
            
        return articles

    async def get_ma_news(self, days_back: int = 7, language: str = "en") -> Optional[List[Dict[str, Any]]]:
        """
        Get M&A related news articles.
        
        Args:
            days_back: Number of days back to search
            language: Language code
        """
        ma_keywords = [
            "merger", "acquisition", "takeover", "buyout", "deal", 
            "M&A", "mergers and acquisitions", "consolidation",
            "joint venture", "strategic partnership"
        ]
        
        query = " OR ".join([f'"{keyword}"' for keyword in ma_keywords])
        from_date = (datetime.now() - timedelta(days=days_back)).strftime("%Y-%m-%d")
        
        params = {
            "q": query,
            "from": from_date,
            "language": language,
            "category": "business",
            "sortBy": "publishedAt",
            "pageSize": 100
        }
        
        data = await self._make_request("everything", params)
        if not data or "articles" not in data:
            return None
            
        articles = []
        for article in data["articles"]:
            # Calculate relevance score based on M&A keywords in title/description
            relevance_score = self._calculate_ma_relevance(article, ma_keywords)
            
            articles.append({
                "title": article.get("title"),
                "description": article.get("description"),
                "content": article.get("content"),
                "url": article.get("url"),
                "source": article.get("source", {}).get("name"),
                "author": article.get("author"),
                "published_at": article.get("publishedAt"),
                "url_to_image": article.get("urlToImage"),
                "relevance_score": relevance_score,
                "category": "M&A"
            })
            
        # Sort by relevance score and published date
        articles.sort(key=lambda x: (x["relevance_score"], x["published_at"]), reverse=True)
        return articles

    async def get_earnings_news(self, days_back: int = 7, language: str = "en") -> Optional[List[Dict[str, Any]]]:
        """Get earnings-related news articles."""
        earnings_keywords = [
            "earnings", "quarterly results", "financial results",
            "revenue", "profit", "EPS", "earnings per share",
            "guidance", "outlook", "quarterly report"
        ]
        
        query = " OR ".join([f'"{keyword}"' for keyword in earnings_keywords])
        from_date = (datetime.now() - timedelta(days=days_back)).strftime("%Y-%m-%d")
        
        params = {
            "q": query,
            "from": from_date,
            "language": language,
            "category": "business",
            "sortBy": "publishedAt",
            "pageSize": 100
        }
        
        data = await self._make_request("everything", params)
        if not data:
            return None
            
        articles = []
        for article in data.get("articles", []):
            articles.append({
                "title": article.get("title"),
                "description": article.get("description"),
                "content": article.get("content"),
                "url": article.get("url"),
                "source": article.get("source", {}).get("name"),
                "author": article.get("author"),
                "published_at": article.get("publishedAt"),
                "url_to_image": article.get("urlToImage"),
                "category": "Earnings"
            })
            
        return articles

    async def get_sector_news(self, sector: str, days_back: int = 7, 
                            language: str = "en") -> Optional[List[Dict[str, Any]]]:
        """Get news articles for a specific sector."""
        sector_queries = {
            "technology": ["technology", "tech", "software", "AI", "cloud", "cybersecurity"],
            "healthcare": ["healthcare", "pharmaceutical", "biotech", "medical", "drug"],
            "finance": ["banking", "financial", "fintech", "insurance", "credit"],
            "energy": ["energy", "oil", "gas", "renewable", "solar", "wind"],
            "retail": ["retail", "consumer", "e-commerce", "shopping"],
            "automotive": ["automotive", "car", "electric vehicle", "EV", "autonomous"]
        }
        
        keywords = sector_queries.get(sector.lower(), [sector])
        query = " OR ".join([f'"{keyword}"' for keyword in keywords])
        from_date = (datetime.now() - timedelta(days=days_back)).strftime("%Y-%m-%d")
        
        params = {
            "q": query,
            "from": from_date,
            "language": language,
            "category": "business",
            "sortBy": "publishedAt",
            "pageSize": 100
        }
        
        data = await self._make_request("everything", params)
        if not data:
            return None
            
        articles = []
        for article in data.get("articles", []):
            articles.append({
                "title": article.get("title"),
                "description": article.get("description"),
                "content": article.get("content"),
                "url": article.get("url"),
                "source": article.get("source", {}).get("name"),
                "author": article.get("author"),
                "published_at": article.get("publishedAt"),
                "url_to_image": article.get("urlToImage"),
                "sector": sector,
                "category": "Sector News"
            })
            
        return articles

    async def search_news(self, query: str, days_back: int = 30, 
                         language: str = "en") -> Optional[List[Dict[str, Any]]]:
        """Search for news articles with custom query."""
        from_date = (datetime.now() - timedelta(days=days_back)).strftime("%Y-%m-%d")
        
        params = {
            "q": query,
            "from": from_date,
            "language": language,
            "sortBy": "publishedAt",
            "pageSize": 100
        }
        
        data = await self._make_request("everything", params)
        if not data:
            return None
            
        return data.get("articles", [])

    def _calculate_ma_relevance(self, article: Dict[str, Any], keywords: List[str]) -> float:
        """Calculate relevance score for M&A news based on keyword presence."""
        title = (article.get("title") or "").lower()
        description = (article.get("description") or "").lower()
        
        score = 0.0
        for keyword in keywords:
            keyword_lower = keyword.lower()
            if keyword_lower in title:
                score += 2.0  # Title matches get higher weight
            if keyword_lower in description:
                score += 1.0
                
        return score

    def _extract_companies_from_article(self, article: Dict[str, Any]) -> List[str]:
        """Extract potential company names from article (simple regex-based)."""
        import re
        
        text = f"{article.get('title', '')} {article.get('description', '')}"
        
        # Simple pattern for company names (capitalized words, potentially with Corp, Inc, etc.)
        company_pattern = r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:Corp|Inc|LLC|Ltd|Co)\.?)?\b'
        
        companies = re.findall(company_pattern, text)
        
        # Filter out common false positives
        stopwords = {"The", "This", "That", "These", "Those", "News", "Report", "Monday", "Tuesday", 
                    "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", "January", "February",
                    "March", "April", "May", "June", "July", "August", "September", "October",
                    "November", "December"}
        
        return [company for company in companies if company not in stopwords]
