from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict, Field


class UserCreateRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    name: Optional[str] = None


class UserUpdateRequest(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(default=None, min_length=6)


class UserAuthRequest(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    password: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    email: str
    username: Optional[str] = None


class TokenResponse(BaseModel):
    token: str
    access_token: str
    token_type: str = "bearer"
