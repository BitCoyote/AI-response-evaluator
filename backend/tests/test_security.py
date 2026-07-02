import pytest

from app.core.security import create_access_token, get_password_hash, verify_password


def test_password_hashing():
    hashed = get_password_hash("mypassword")
    assert verify_password("mypassword", hashed)
    assert not verify_password("wrongpassword", hashed)


def test_create_and_decode_token():
    token = create_access_token("42")
    assert isinstance(token, str)
    assert len(token) > 0
