from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from user.domain.entities import User
from api.dependencies import (
    get_current_user,
    get_account_repository,
    get_transaction_repository,
    get_account_balance_service,
)
from api.schemas.account import AccountResponse, AccountStatementResponse, StatementTransactionResponse
from api.schemas.transaction import (
    CreateTransactionRequest,
    UpdateTransactionRequest,
    TransactionResponse,
)
from database.repository import (
    AsyncpgAccountRepository,
    AsyncpgTransactionRepository,
    AsyncpgAccountBalanceService,
)
from account.application.use_cases import ListAccountsUseCase, GetAccountStatementUseCase
from transaction.application.dtos import CreateTransactionInput, UpdateTransactionInput
from transaction.application.use_cases import (
    CreateTransactionUseCase,
    UpdateTransactionUseCase,
    DeleteTransactionUseCase,
)

router = APIRouter(prefix="/account", tags=["Accounts & Transactions"])


@router.get("", response_model=list[AccountResponse])
async def list_accounts(
    current_user: User = Depends(get_current_user),
    account_repo: AsyncpgAccountRepository = Depends(get_account_repository),
) -> list[AccountResponse]:
    use_case = ListAccountsUseCase(account_repo)
    accounts = await use_case.execute(current_user.id)
    return [
        AccountResponse(
            id=acc.id,
            userId=acc.user_id,
            accountNumber=acc.account_number,
            balance=acc.balance,
            createdAt=acc.created_at,
        )
        for acc in accounts
    ]


@router.post("/transaction", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    payload: CreateTransactionRequest,
    current_user: User = Depends(get_current_user),
    tx_repo: AsyncpgTransactionRepository = Depends(get_transaction_repository),
    balance_service: AsyncpgAccountBalanceService = Depends(get_account_balance_service),
) -> TransactionResponse:
    use_case = CreateTransactionUseCase(
        transaction_repository=tx_repo,
        account_service=balance_service,
    )
    result = await use_case.execute(
        CreateTransactionInput(
            account_id=payload.account_id,
            value=payload.value,
            type=payload.type,
            from_party=payload.from_party,
            to_party=payload.to_party,
            anexo=payload.anexo,
            url_anexo=payload.url_anexo,
            user_id=current_user.id,
        )
    )
    return TransactionResponse(
        id=result.id,
        accountId=result.account_id,
        value=result.value,
        type=result.type,
        from_party=result.from_party,
        to_party=result.to_party,
        anexo=result.anexo,
        urlAnexo=result.url_anexo,
        createdAt=result.created_at,
    )


@router.put("/transaction/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    transaction_id: str,
    payload: UpdateTransactionRequest,
    current_user: User = Depends(get_current_user),
    tx_repo: AsyncpgTransactionRepository = Depends(get_transaction_repository),
    balance_service: AsyncpgAccountBalanceService = Depends(get_account_balance_service),
) -> TransactionResponse:
    use_case = UpdateTransactionUseCase(
        transaction_repository=tx_repo,
        account_service=balance_service,
    )
    result = await use_case.execute(
        UpdateTransactionInput(
            transaction_id=transaction_id,
            value=payload.value,
            type=payload.type,
            from_party=payload.from_party,
            to_party=payload.to_party,
            anexo=payload.anexo,
            url_anexo=payload.url_anexo,
            user_id=current_user.id,
        )
    )
    return TransactionResponse(
        id=result.id,
        accountId=result.account_id,
        value=result.value,
        type=result.type,
        from_party=result.from_party,
        to_party=result.to_party,
        anexo=result.anexo,
        urlAnexo=result.url_anexo,
        createdAt=result.created_at,
    )


@router.delete("/transaction/{transaction_id}", status_code=status.HTTP_200_OK)
async def delete_transaction(
    transaction_id: str,
    current_user: User = Depends(get_current_user),
    tx_repo: AsyncpgTransactionRepository = Depends(get_transaction_repository),
    balance_service: AsyncpgAccountBalanceService = Depends(get_account_balance_service),
) -> dict[str, str]:
    use_case = DeleteTransactionUseCase(
        transaction_repository=tx_repo,
        account_service=balance_service,
    )
    await use_case.execute(transaction_id, user_id=current_user.id)
    return {"message": "Transaction deleted successfully"}


@router.get("/{account_id}/statement", response_model=AccountStatementResponse)
async def get_statement(
    account_id: str,
    limit: Optional[int] = Query(
        default=None, ge=1, le=100, description="Tamanho da página. Sem limit, devolve o extrato completo."
    ),
    offset: int = Query(default=0, ge=0, description="Quantas transações pular (mais recentes primeiro)"),
    current_user: User = Depends(get_current_user),
    account_repo: AsyncpgAccountRepository = Depends(get_account_repository),
    tx_repo: AsyncpgTransactionRepository = Depends(get_transaction_repository),
) -> AccountStatementResponse:
    use_case = GetAccountStatementUseCase(
        account_repository=account_repo,
        transaction_repository=tx_repo,
    )
    statement = await use_case.execute(account_id, requesting_user_id=current_user.id, limit=limit, offset=offset)
    return AccountStatementResponse(
        account=AccountResponse(
            id=statement.account.id,
            userId=statement.account.user_id,
            accountNumber=statement.account.account_number,
            balance=statement.account.balance,
            createdAt=statement.account.created_at,
        ),
        transactions=[
            StatementTransactionResponse(
                id=tx.id,
                accountId=tx.account_id,
                value=tx.value,
                type=tx.type,
                from_party=tx.from_party,
                to_party=tx.to_party,
                anexo=tx.anexo,
                urlAnexo=tx.url_anexo,
                createdAt=tx.created_at,
            )
            for tx in statement.transactions
        ],
        total=statement.total,
        limit=statement.limit,
        offset=statement.offset,
        hasMore=statement.offset + len(statement.transactions) < statement.total,
    )
