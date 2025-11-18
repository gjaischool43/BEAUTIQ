from sqlalchemy import Integer, String, Enum
from sqlalchemy.orm import Mapped, mapped_column
from .base import Base

class Request(Base):
    __tablename__ = "request"
    request_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int]    = mapped_column(Integer, nullable=False, default=1)
    activity_name: Mapped[str] = mapped_column(String(200), nullable=False)
    platform: Mapped[str] = mapped_column(Enum('youtube','instagram','tiktok','x','etc', name="platform_enum"), nullable=False)
    channel_name: Mapped[str] = mapped_column(String(200), nullable=False)
    category_code: Mapped[str] = mapped_column(Enum('skin_toner','essence_serum_ampoule','lotion','cream','mist_oil', name="category_enum"), nullable=False)
    brand_concept: Mapped[str] = mapped_column(String(5000), nullable=False)
    contact_method: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    view_pw_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    
