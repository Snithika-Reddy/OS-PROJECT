from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime
from app.core.database import Base


class AppSetting(Base):
    __tablename__ = "settings"

    key = Column(String(100), primary_key=True, index=True)
    value = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
