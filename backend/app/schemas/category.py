from pydantic import BaseModel, Field


class CategoryCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    icon: str | None = None
    color: str | None = None


class CategoryResponse(BaseModel):
    id: int
    name: str
    icon: str | None
    color: str | None
    is_default: bool

    model_config = {"from_attributes": True}
