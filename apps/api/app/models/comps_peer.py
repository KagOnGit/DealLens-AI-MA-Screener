from sqlalchemy import Column, String, Integer, ForeignKey, Index
from sqlalchemy.orm import relationship
from ..core.database import Base


class CompsPeer(Base):
    __tablename__ = "comps_peers"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    peer_ticker = Column(String, nullable=False)

    # Relationships
    company = relationship("Company")
    
    # Indexes
    __table_args__ = (
        Index('ix_comps_peers_company', 'company_id'),
        Index('ix_comps_peers_ticker', 'peer_ticker'),
    )
