import os
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from api.settings import get_settings

router = APIRouter(tags=["System"])


@router.get("/health")
async def health_check() -> JSONResponse:
    settings = get_settings()
    return JSONResponse(
        content={
            "status": "healthy",
            "app": settings.APP_NAME,
        }
    )
