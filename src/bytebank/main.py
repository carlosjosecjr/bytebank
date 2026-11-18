import uvicorn
from api.settings import get_settings


def main() -> None:
    settings = get_settings()
    uvicorn.run(
        "api:create_app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        factory=True,
    )


if __name__ == "__main__":
    main()
