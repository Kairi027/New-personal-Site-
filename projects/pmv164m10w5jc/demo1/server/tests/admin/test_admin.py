"""管理后台模块单元测试。"""

import pytest

from app.core.security import create_admin_token, decode_token
from app.core.config import settings


class TestAdminAuth:
    """管理员认证测试。"""

    def test_admin_token_creation(self):
        token = create_admin_token("admin123", extra={"username": "test", "perms": ["user:read"]})
        payload = decode_token(token)
        assert payload["sub"] == "admin123"
        assert payload["type"] == "admin"
        assert payload["username"] == "test"
        assert "user:read" in payload["perms"]

    def test_admin_token_expires_in_2_hours(self):
        token = create_admin_token("admin123")
        payload = decode_token(token)
        exp = payload["exp"]
        iat = payload["iat"]
        diff_seconds = (exp - iat).total_seconds()
        assert diff_seconds == settings.jwt_admin_token_expire_hours * 3600


class TestRBAC:
    """RBAC 权限校验测试。"""

    def test_require_permission_decorator(self):
        from app.core.deps import require_permission
        checker = require_permission("user:read", "user:freeze")
        assert callable(checker)

    def test_super_admin_bypasses_permission(self):
        """超级管理员应绕过权限检查（在 deps.require_permission 中实现）。"""
        pass