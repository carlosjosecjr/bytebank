from typing import Protocol, Optional


class AccountBalanceService(Protocol):
    async def apply_balance_change(
        self,
        account_id: str,
        amount: float,
        transaction_type: str,
        user_id: Optional[str] = None,
    ) -> None:
        """Applies credit or debit to account, verifying ownership and balance."""
        ...

    async def revert_balance_change(
        self,
        account_id: str,
        amount: float,
        transaction_type: str,
        user_id: Optional[str] = None,
    ) -> None:
        """Reverts a previously applied credit or debit."""
        ...
