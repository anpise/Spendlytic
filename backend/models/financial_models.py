from pydantic import BaseModel, Field
from typing import List, Dict, Any

class FinancialData(BaseModel):
    merchant_name: str = Field(description="Name of the merchant or business")
    total_amount: float = Field(description="Total amount of the transaction")
    date: str = Field(description="Date of the transaction in YYYY-MM-DD format")
    items: List[Dict[str, Any]] = Field(description="List of items purchased") 