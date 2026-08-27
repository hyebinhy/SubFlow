from pydantic import BaseModel, Field


class CategoryCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    icon: str | None = Field(default=None, max_length=50)
    color: str | None = Field(default=None, max_length=7)


class CategoryResponse(BaseModel):
    id: int
    name: str
    icon: str | None
    color: str | None
    is_default: bool
    # 내가 직접 만든 항목인지. 지우기 버튼을 이 값으로 가른다.
    is_custom: bool = False

    model_config = {"from_attributes": True}
