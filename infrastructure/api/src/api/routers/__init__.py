from api.routers.users import router as users_router
from api.routers.auth import router as auth_router
from api.routers.accounts import router as accounts_router
from api.routers.static import router as static_router

__all__ = [
    "users_router",
    "auth_router",
    "accounts_router",
    "static_router",
]
