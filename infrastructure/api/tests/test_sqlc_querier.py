from datetime import datetime, timezone
import pytest
from database.connection.session import get_pool, get_database_url
from database.sqlc.querier import Querier


@pytest.mark.asyncio
async def test_sqlc_querier_full_crud():
    db_url = get_database_url()
    pool = await get_pool(db_url)
    async with pool.acquire() as conn:
        querier = Querier(conn)

        now = datetime.now(timezone.utc)

        # 1. User Queries
        user = await querier.create_user(
            id="user-123",
            username="sqlc_user",
            name="SQLc Master",
            email="sqlc@bytebank.com",
            password_hash="hash_abc",
            created_at=now,
        )
        assert user.id == "user-123"
        assert user.username == "sqlc_user"

        by_id = await querier.get_user_by_id("user-123")
        assert by_id is not None
        assert by_id.name == "SQLc Master"

        by_email = await querier.get_user_by_email("sqlc@bytebank.com")
        assert by_email is not None
        assert by_email.id == "user-123"

        by_username = await querier.get_user_by_username("sqlc_user")
        assert by_username is not None

        users = await querier.list_users()
        assert len(users) == 1

        # 2. Account Queries
        account = await querier.create_account(
            id="acc-123",
            user_id="user-123",
            account_number="998877",
            balance=500.0,
            created_at=now,
            updated_at=now,
        )
        assert account.id == "acc-123"
        assert account.balance == 500.0

        acc_by_id = await querier.get_account_by_id("acc-123")
        assert acc_by_id is not None
        assert acc_by_id.account_number == "998877"

        acc_by_num = await querier.get_account_by_number("998877")
        assert acc_by_num is not None

        acc_list = await querier.list_accounts_by_user_id("user-123")
        assert len(acc_list) == 1

        updated_acc = await querier.update_account_balance(
            id="acc-123",
            balance=750.0,
            updated_at=datetime.now(timezone.utc),
        )
        assert updated_acc is not None
        assert updated_acc.balance == 750.0

        # 3. Transaction Queries
        tx = await querier.create_transaction(
            id="tx-123",
            account_id="acc-123",
            value=250.0,
            type="Credit",
            from_party="Alice",
            to_party="SQLc Master",
            anexo="receipt.pdf",
            url_anexo="https://example.com/receipt.pdf",
            created_at=now,
        )
        assert tx.id == "tx-123"
        assert tx.value == 250.0

        tx_by_id = await querier.get_transaction_by_id("tx-123")
        assert tx_by_id is not None
        assert tx_by_id.from_party == "Alice"

        tx_list = await querier.list_transactions_by_account_id("acc-123")
        assert len(tx_list) == 1

        updated_tx = await querier.update_transaction(
            id="tx-123",
            value=300.0,
            type="Credit",
            from_party="Alice",
            to_party="SQLc Master Updated",
            anexo=None,
            url_anexo=None,
        )
        assert updated_tx is not None
        assert updated_tx.value == 300.0
        assert updated_tx.to_party == "SQLc Master Updated"

        del_status = await querier.delete_transaction("tx-123")
        assert "DELETE 1" in del_status

        tx_after_del = await querier.get_transaction_by_id("tx-123")
        assert tx_after_del is None
