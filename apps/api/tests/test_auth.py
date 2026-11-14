def test_register_login_and_current_user(client):
    register = client.post(
        "/api/v1/auth/register",
        json={"full_name": "A Customer", "email": "a@example.com", "password": "LongEnoughPassword123"},
    )
    assert register.status_code == 201
    assert register.json()["role"] == "customer"

    login = client.post("/api/v1/auth/login", json={"email": "a@example.com", "password": "LongEnoughPassword123"})
    assert login.status_code == 200
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    me = client.get("/api/v1/auth/me", headers=headers)
    assert me.status_code == 200
    assert me.json()["email"] == "a@example.com"


def test_registration_rejects_duplicate_email(client):
    payload = {"full_name": "A Customer", "email": "a@example.com", "password": "LongEnoughPassword123"}
    assert client.post("/api/v1/auth/register", json=payload).status_code == 201
    duplicate = client.post("/api/v1/auth/register", json=payload)
    assert duplicate.status_code == 409


def test_private_endpoint_requires_authentication(client):
    response = client.get("/api/v1/cart")
    assert response.status_code == 401


def test_customer_cannot_access_admin_api(client, customer_headers):
    response = client.get("/api/v1/admin/products", headers=customer_headers)
    assert response.status_code == 403
