import pytest
from app.models.user import User

def test_register_and_login_flow(client):
    # 1. Register User with strong password and accepted terms
    reg_payload = {
        "email": "officer@legalmetrology.gov.in",
        "full_name": "Inspector Rajesh Kumar",
        "password": "StrongPassword@2026",
        "confirm_password": "StrongPassword@2026",
        "accept_terms": True
    }
    reg_resp = client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_resp.status_code == 201
    data = reg_resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["email"] == "officer@legalmetrology.gov.in"
    assert data["user"]["role"] == "USER"

    # 2. Login User
    login_payload = {
        "email": "officer@legalmetrology.gov.in",
        "password": "StrongPassword@2026",
        "remember_me": True
    }
    login_resp = client.post("/api/v1/auth/login", json=login_payload)
    assert login_resp.status_code == 200
    token_data = login_resp.json()
    token = token_data["access_token"]
    refresh_token = token_data["refresh_token"]
    assert token is not None
    assert refresh_token is not None

    # 3. Get /me with Bearer token
    headers = {"Authorization": f"Bearer {token}"}
    me_resp = client.get("/api/v1/auth/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["full_name"] == "Inspector Rajesh Kumar"
    assert me_resp.json()["email"] == "officer@legalmetrology.gov.in"

def test_role_cannot_be_escalated_on_register(client):
    # Attacker tries to pass role: SYSTEM_ADMIN
    reg_payload = {
        "email": "hacker@legalmetrology.gov.in",
        "full_name": "Malicious User",
        "password": "StrongPassword@2026",
        "confirm_password": "StrongPassword@2026",
        "accept_terms": True,
        "role": "SYSTEM_ADMIN"
    }
    reg_resp = client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_resp.status_code == 201
    # Must remain USER, not SYSTEM_ADMIN
    assert reg_resp.json()["user"]["role"] == "USER"

def test_auth_invalid_credentials_and_duplicate(client):
    reg_payload = {
        "email": "unique@legalmetrology.gov.in",
        "full_name": "Test Officer",
        "password": "StrongPassword@2026",
        "confirm_password": "StrongPassword@2026",
        "accept_terms": True
    }
    # Register once
    res1 = client.post("/api/v1/auth/register", json=reg_payload)
    assert res1.status_code == 201

    # Register duplicate email
    res2 = client.post("/api/v1/auth/register", json=reg_payload)
    assert res2.status_code == 400
    assert "already registered" in res2.json()["detail"].lower()

    # Invalid password login test
    bad_login = {
        "email": "unique@legalmetrology.gov.in",
        "password": "WrongPassword@2026"
    }
    res_bad = client.post("/api/v1/auth/login", json=bad_login)
    assert res_bad.status_code == 400
    assert "invalid email or password" in res_bad.json()["detail"].lower()

def test_refresh_token_rotation_and_revocation(client):
    # Register and get initial tokens
    reg_payload = {
        "email": "refresh@legalmetrology.gov.in",
        "full_name": "Refresh Tester",
        "password": "StrongPassword@2026",
        "confirm_password": "StrongPassword@2026",
        "accept_terms": True
    }
    reg_resp = client.post("/api/v1/auth/register", json=reg_payload)
    initial_refresh = reg_resp.json()["refresh_token"]

    # Refresh access token
    ref_resp = client.post("/api/v1/auth/refresh", json={"refresh_token": initial_refresh})
    assert ref_resp.status_code == 200
    new_data = ref_resp.json()
    new_access = new_data["access_token"]
    new_refresh = new_data["refresh_token"]
    assert new_access is not None
    assert new_refresh != initial_refresh  # Token rotated

    # Attempt to reuse old revoked refresh token -> 401
    reuse_resp = client.post("/api/v1/auth/refresh", json={"refresh_token": initial_refresh})
    assert reuse_resp.status_code == 401

def test_logout_revokes_token(client):
    reg_payload = {
        "email": "logout@legalmetrology.gov.in",
        "full_name": "Logout Tester",
        "password": "StrongPassword@2026",
        "confirm_password": "StrongPassword@2026",
        "accept_terms": True
    }
    reg_resp = client.post("/api/v1/auth/register", json=reg_payload)
    access_token = reg_resp.json()["access_token"]
    refresh_token = reg_resp.json()["refresh_token"]

    # Logout
    logout_resp = client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {access_token}"},
        json={"refresh_token": refresh_token}
    )
    assert logout_resp.status_code == 200

    # Refresh with revoked token should fail
    ref_resp = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert ref_resp.status_code == 401

def test_profile_update_and_cannot_modify_role(client):
    reg_payload = {
        "email": "profile@legalmetrology.gov.in",
        "full_name": "Initial Name",
        "password": "StrongPassword@2026",
        "confirm_password": "StrongPassword@2026",
        "accept_terms": True
    }
    reg_resp = client.post("/api/v1/auth/register", json=reg_payload)
    access_token = reg_resp.json()["access_token"]

    # Update profile
    update_payload = {
        "full_name": "Updated Official Name",
        "location_unit": "Northern Zone 2",
        "role": "SYSTEM_ADMIN"  # Attempt to inject role
    }
    update_resp = client.put(
        "/api/v1/auth/profile",
        headers={"Authorization": f"Bearer {access_token}"},
        json=update_payload
    )
    assert update_resp.status_code == 200
    user_data = update_resp.json()
    assert user_data["full_name"] == "Updated Official Name"
    assert user_data["location_unit"] == "Northern Zone 2"
    assert user_data["role"] == "USER"  # Role was NOT changed

def test_change_password(client):
    reg_payload = {
        "email": "changepwd@legalmetrology.gov.in",
        "full_name": "Pwd Officer",
        "password": "OriginalPassword@2026",
        "confirm_password": "OriginalPassword@2026",
        "accept_terms": True
    }
    reg_resp = client.post("/api/v1/auth/register", json=reg_payload)
    access_token = reg_resp.json()["access_token"]

    # Change password
    pwd_payload = {
        "current_password": "OriginalPassword@2026",
        "new_password": "NewSecretPassword@2026",
        "confirm_password": "NewSecretPassword@2026"
    }
    pwd_resp = client.post(
        "/api/v1/auth/change-password",
        headers={"Authorization": f"Bearer {access_token}"},
        json=pwd_payload
    )
    assert pwd_resp.status_code == 200

    # Old password no longer works
    bad_login = client.post("/api/v1/auth/login", json={
        "email": "changepwd@legalmetrology.gov.in",
        "password": "OriginalPassword@2026"
    })
    assert bad_login.status_code == 400

    # New password works
    good_login = client.post("/api/v1/auth/login", json={
        "email": "changepwd@legalmetrology.gov.in",
        "password": "NewSecretPassword@2026"
    })
    assert good_login.status_code == 200

def test_forgot_password_generic_response(client):
    # Registered email
    resp1 = client.post("/api/v1/auth/forgot-password", json={"email": "existing@legalmetrology.gov.in"})
    assert resp1.status_code == 200
    assert "password reset link" in resp1.json()["message"].lower()

    # Non-existent email gives same generic message (prevents enumeration)
    resp2 = client.post("/api/v1/auth/forgot-password", json={"email": "nonexistent@legalmetrology.gov.in"})
    assert resp2.status_code == 200
    assert resp2.json()["message"] == resp1.json()["message"]
