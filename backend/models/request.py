from datetime import datetime
from sqlalchemy import Integer, String, Enum, DateTime, func, Column
from sqlalchemy.orm import Mapped, mapped_column
from .base import Base

class Request(Base):
    __tablename__ = "request"

    request_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)  # 또는 아예 컬럼 자체를 삭제해도 됨
    activity_name: Mapped[str] = mapped_column(String(200), nullable=False)
    platform: Mapped[str] = mapped_column(
        Enum('youtube','instagram','tiktok','x','etc', name="platform_enum"),
        nullable=False
    )
    channel_name: Mapped[str] = mapped_column(String(200), nullable=False)
    category_code: Mapped[str] = mapped_column(
        Enum('skin_toner','essence_serum_ampoule','lotion','cream','mist_oil', name="category_enum"),
        nullable=False
    )
    brand_concept: Mapped[str] = mapped_column(String(5000), nullable=False)
    contact_method: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    view_pw_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    # 🔹 DB에 이미 있는 컬럼과 매칭
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
