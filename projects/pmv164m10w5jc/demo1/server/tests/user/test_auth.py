"""用户账户模块单元测试。"""

import pytest

from app.core.exceptions import UserError
from app.schemas.user import RegisterRequest


class TestPasswordValidation:
    """密码复杂度校验测试。"""

    def test_valid_password(self):
        req = RegisterRequest(account="13800138000", password="abc12345", nickname="测试", code="123456")
        assert req.password == "abc12345"

    def test_password_no_letter(self):
        with pytest.raises(Exception):
            RegisterRequest(account="13800138000", password="12345678", nickname="测试", code="123456")

    def test_password_no_digit(self):
        with pytest.raises(Exception):
            RegisterRequest(account="13800138000", password="abcdefgh", nickname="测试", code="123456")

    def test_password_too_short(self):
        with pytest.raises(Exception):
            RegisterRequest(account="13800138000", password="ab1", nickname="测试", code="123456")

    def test_password_too_long(self):
        with pytest.raises(Exception):
            RegisterRequest(account="13800138000", password="a" * 25, nickname="测试", code="123456")


class TestAccountValidation:
    """账号格式校验测试。"""

    def test_valid_phone(self):
        from app.services.auth_service import _validate_account
        assert _validate_account("13800138000") == "13800138000"

    def test_valid_email(self):
        from app.services.auth_service import _validate_account
        assert _validate_account("test@example.com") == "test@example.com"

    def test_invalid_account(self):
        from app.services.auth_service import _validate_account
        with pytest.raises(UserError) as exc_info:
            _validate_account("invalid_account")
        assert exc_info.value.code == 10001


class TestSecurity:
    """密码哈希测试。"""

    def test_hash_and_verify(self):
        from app.core.security import hash_password, verify_password
        raw = "testpass123"
        hashed = hash_password(raw)
        assert hashed != raw
        assert verify_password(raw, hashed)
        assert not verify_password("wrong", hashed)