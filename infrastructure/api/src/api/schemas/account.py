from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class AccountResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str
    user_id: str = Field(alias="userId")
    account_number: str = Field(alias="accountNumber")
    balance: float
    created_at: datetime = Field(alias="createdAt")


class StatementTransactionResponse(BaseModel):
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


class AccountStatementResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    account: AccountResponse
    transactions: list[StatementTransactionResponse]
    total: int = Field(description="Total de transações da conta (todas as páginas)")
    limit: Optional[int] = Field(default=None, description="Tamanho da página pedido (null = extrato completo)")
    offset: int = 0
    has_more: bool = Field(default=False, alias="hasMore")
