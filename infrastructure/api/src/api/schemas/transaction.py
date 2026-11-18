from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class CreateTransactionRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    account_id: str = Field(alias="accountId")
    value: float = Field(gt=0, description="Transaction amount, must be greater than 0")
    type: str = Field(description="Debit or Credit")
    from_party: str = Field(alias="from")
    to_party: str = Field(alias="to")
    anexo: Optional[str] = None
    url_anexo: Optional[str] = Field(default=None, alias="urlAnexo")


class UpdateTransactionRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    value: Optional[float] = Field(default=None, gt=0)
    type: Optional[str] = Field(default=None, description="Debit or Credit")
    from_party: Optional[str] = Field(default=None, alias="from")
    to_party: Optional[str] = Field(default=None, alias="to")
    anexo: Optional[str] = None
    url_anexo: Optional[str] = Field(default=None, alias="urlAnexo")


class TransactionResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str
    account_id: str = Field(alias="accountId")
    value: float
    type: str
    from_party: str = Field(alias="from")
    to_party: str = Field(alias="to")
    anexo: Optional[str] = None
    url_anexo: Optional[str] = Field(default=None, alias="urlAnexo")
    created_at: datetime = Field(alias="createdAt")
