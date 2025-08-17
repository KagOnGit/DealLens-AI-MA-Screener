"""
Basic tests for the main API endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestCompanyEndpoints:
    """Test company-related endpoints"""
    
    def test_company_detail_404(self):
        """Test company detail endpoint returns 404 for non-existent ticker"""
        response = client.get("/api/v1/companies/NONEXISTENT")
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    def test_company_timeseries_404(self):
        """Test timeseries endpoint returns 404 for non-existent ticker"""
        response = client.get("/api/v1/companies/NONEXISTENT/timeseries")
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    def test_company_ownership_404(self):
        """Test ownership endpoint returns 404 for non-existent ticker"""
        response = client.get("/api/v1/companies/NONEXISTENT/ownership")
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    def test_company_news_404(self):
        """Test news endpoint returns 404 for non-existent ticker"""
        response = client.get("/api/v1/companies/NONEXISTENT/news")
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()


class TestDealEndpoints:
    """Test deal-related endpoints"""
    
    def test_deals_list_200(self):
        """Test deals list endpoint returns 200"""
        response = client.get("/api/v1/deals")
        assert response.status_code == 200
        assert "deals" in response.json()
        assert "total" in response.json()
    
    def test_deals_with_filters_200(self):
        """Test deals endpoint with filters"""
        response = client.get("/api/v1/deals?industry=Technology&status=Closed")
        assert response.status_code == 200
        assert "deals" in response.json()
    
    def test_deal_detail_200_known(self):
        """Test deal detail for known deal ID"""
        response = client.get("/api/v1/deals/msft-atvi")
        assert response.status_code == 200
        assert "id" in response.json()
        assert "title" in response.json()
    
    def test_deal_detail_200_unknown(self):
        """Test deal detail generates data for unknown deal ID"""
        response = client.get("/api/v1/deals/unknown-deal")
        assert response.status_code == 200
        assert response.json()["id"] == "unknown-deal"


class TestSearchEndpoints:
    """Test search-related endpoints"""
    
    def test_search_200(self):
        """Test search endpoint returns 200"""
        response = client.get("/api/v1/search?q=apple")
        assert response.status_code == 200
        assert "suggestions" in response.json()
    
    def test_search_empty_query(self):
        """Test search with empty query"""
        response = client.get("/api/v1/search?q=")
        assert response.status_code == 422  # Validation error for min_length=1
    
    def test_search_returns_suggestions(self):
        """Test search returns actual suggestions"""
        response = client.get("/api/v1/search?q=microsoft")
        assert response.status_code == 200
        suggestions = response.json()["suggestions"]
        assert isinstance(suggestions, list)


class TestDebugEndpoints:
    """Test debug endpoints"""
    
    def test_debug_contracts_200(self):
        """Test debug contracts endpoint"""
        response = client.get("/api/v1/_debug/contracts")
        assert response.status_code == 200
        assert "contracts" in response.json()
        assert "generated_at" in response.json()
    
    def test_debug_health_200(self):
        """Test debug health endpoint"""
        response = client.get("/api/v1/_debug/health")
        assert response.status_code == 200
        assert "status" in response.json()
        assert "services" in response.json()


class TestEndpointStructure:
    """Test that endpoints return expected data structure"""
    
    def test_deals_response_structure(self):
        """Test deals endpoint returns proper structure"""
        response = client.get("/api/v1/deals")
        assert response.status_code == 200
        data = response.json()
        
        assert "deals" in data
        assert "total" in data
        assert isinstance(data["deals"], list)
        assert isinstance(data["total"], int)
        
        # Test deal structure if deals exist
        if data["deals"]:
            deal = data["deals"][0]
            required_fields = ["id", "title", "date", "status"]
            for field in required_fields:
                assert field in deal
    
    def test_search_response_structure(self):
        """Test search endpoint returns proper structure"""
        response = client.get("/api/v1/search?q=test")
        assert response.status_code == 200
        data = response.json()
        
        assert "suggestions" in data
        assert isinstance(data["suggestions"], list)
        
        # Test suggestion structure if suggestions exist
        if data["suggestions"]:
            suggestion = data["suggestions"][0]
            required_fields = ["type", "label", "value"]
            for field in required_fields:
                assert field in suggestion


if __name__ == "__main__":
    pytest.main([__file__])
