import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_accounts_and_transactions_flow(client: AsyncClient):
    # 1. Register and login User 1
    await client.post(
        "/user",
        json={
            "username": "financial_user",
            "email": "finance@bytebank.com",
            "password": "mypassword",
            "name": "Finance User",
        },
    )

    auth_res = await client.post(
        "/user/auth",
        json={"email": "finance@bytebank.com", "password": "mypassword"},
    )
    token = auth_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. List accounts
    acc_res = await client.get("/account", headers=headers)
    assert acc_res.status_code == 200
    accounts = acc_res.json()
    assert len(accounts) >= 1
    account_id = accounts[0]["id"]
    initial_balance = accounts[0]["balance"]
    assert initial_balance == 1000.0

    # 3. Create a Debit transaction
    debit_payload = {
        "accountId": account_id,
        "value": 150.0,
        "type": "Debit",
        "from": "Finance User",
        "to": "Supermercado XYZ",
        "anexo": "recibo.png",
        "urlAnexo": "https://bytebank.com/anexos/recibo.png",
    }
    tx_res = await client.post("/account/transaction", json=debit_payload, headers=headers)
    assert tx_res.status_code == 201
    tx_data = tx_res.json()
    assert tx_data["value"] == 150.0
    assert tx_data["type"] == "Debit"
    assert tx_data["from"] == "Finance User"
    assert tx_data["to"] == "Supermercado XYZ"
    assert tx_data["anexo"] == "recibo.png"
    assert tx_data["urlAnexo"] == "https://bytebank.com/anexos/recibo.png"
    tx_id = tx_data["id"]

    # 4. Check statement after debit
    stmt_res = await client.get(f"/account/{account_id}/statement", headers=headers)
    assert stmt_res.status_code == 200
    stmt_data = stmt_res.json()
    assert stmt_data["account"]["balance"] == 850.0
    assert len(stmt_data["transactions"]) == 1
    assert stmt_data["transactions"][0]["id"] == tx_id

    # 5. Create a Credit transaction
    credit_payload = {
        "accountId": account_id,
        "value": 500.0,
        "type": "Credit",
        "from": "Cliente ABC",
        "to": "Finance User",
    }
    credit_res = await client.post("/account/transaction", json=credit_payload, headers=headers)
    assert credit_res.status_code == 201
    assert credit_res.json()["value"] == 500.0

    # Statement check after credit
    stmt_res2 = await client.get(f"/account/{account_id}/statement", headers=headers)
    assert stmt_res2.json()["account"]["balance"] == 1350.0
    assert len(stmt_res2.json()["transactions"]) == 2

    # 6. Test insufficient balance on debit
    excessive_debit = {
        "accountId": account_id,
        "value": 999999.0,
        "type": "Debit",
        "from": "Finance User",
        "to": "Car Dealer",
    }
    excess_res = await client.post("/account/transaction", json=excessive_debit, headers=headers)
    assert excess_res.status_code == 400
    assert "Insufficient" in excess_res.json()["detail"]

    # 7. Update transaction
    update_payload = {
        "to": "Supermercado ABC",
        "value": 200.0,  # Changed from 150 to 200 debit (an extra 50 debited)
    }
    update_res = await client.put(f"/account/transaction/{tx_id}", json=update_payload, headers=headers)
    assert update_res.status_code == 200
    assert update_res.json()["to"] == "Supermercado ABC"
    assert update_res.json()["value"] == 200.0

    stmt_res3 = await client.get(f"/account/{account_id}/statement", headers=headers)
    assert stmt_res3.json()["account"]["balance"] == 1300.0

    # 8. Delete transaction
    del_res = await client.delete(f"/account/transaction/{tx_id}", headers=headers)
    assert del_res.status_code == 200

    # Statement check after delete (the 200 debit was reverted -> balance increases back by 200)
    stmt_res4 = await client.get(f"/account/{account_id}/statement", headers=headers)
    assert stmt_res4.json()["account"]["balance"] == 1500.0
    assert len(stmt_res4.json()["transactions"]) == 1


@pytest.mark.asyncio
async def test_cross_user_isolation(client: AsyncClient):
    # Create User 1
    await client.post(
        "/user",
        json={
            "username": "user_one",
            "email": "user1@bytebank.com",
            "password": "password123",
        },
    )
    auth1 = await client.post("/user/auth", json={"email": "user1@bytebank.com", "password": "password123"})
    token1 = auth1.json()["token"]
    headers1 = {"Authorization": f"Bearer {token1}"}

    acc1_res = await client.get("/account", headers=headers1)
    acc1_id = acc1_res.json()[0]["id"]

    # Create User 2
    await client.post(
        "/user",
        json={
            "username": "user_two",
            "email": "user2@bytebank.com",
            "password": "password123",
        },
    )
    auth2 = await client.post("/user/auth", json={"email": "user2@bytebank.com", "password": "password123"})
    token2 = auth2.json()["token"]
    headers2 = {"Authorization": f"Bearer {token2}"}

    # User 2 tries to access User 1's statement -> 403 Forbidden
    stmt_forbidden = await client.get(f"/account/{acc1_id}/statement", headers=headers2)
    assert stmt_forbidden.status_code == 403

    # User 2 tries to create transaction on User 1's account -> 403 Forbidden
    tx_forbidden = await client.post(
        "/account/transaction",
        json={
            "accountId": acc1_id,
            "value": 50.0,
            "type": "Debit",
            "from": "Hacker",
            "to": "Receiver",
        },
        headers=headers2,
    )
    assert tx_forbidden.status_code == 403


@pytest.mark.asyncio
async def test_non_existent_resources(client: AsyncClient):
    # Create and authenticate user
    await client.post(
        "/user",
        json={"username": "user_three", "email": "user3@bytebank.com", "password": "password123"},
    )
    auth = await client.post("/user/auth", json={"email": "user3@bytebank.com", "password": "password123"})
    headers = {"Authorization": f"Bearer {auth.json()['token']}"}

    # Statement of non-existent account -> 404
    stmt_404 = await client.get("/account/unknown-id/statement", headers=headers)
    assert stmt_404.status_code == 404

    # Delete non-existent transaction -> 404
    del_404 = await client.delete("/account/transaction/unknown-id", headers=headers)
    assert del_404.status_code == 404
