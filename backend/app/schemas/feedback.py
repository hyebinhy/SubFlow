import enum

from pydantic import BaseModel, Field


class FeedbackType(str, enum.Enum):
    BUG = "bug"
    SUGGESTION = "suggestion"
    OTHER = "other"


class FeedbackRequest(BaseModel):
    """사용자가 보내는 오류 신고·의견.

    본문 외에 클라이언트가 아는 것들(앱 버전, 화면 이름 등)을 client에 담아 보낸다.
    "안 돼요" 한 줄만 오면 재현할 수가 없어서, 화면과 버전만이라도 같이 받는다.
    """

    type: FeedbackType = FeedbackType.BUG
    message: str = Field(min_length=5, max_length=2000)
    # 자유 형식. 어떤 키가 오든 메일 본문에 그대로 적는다.
    # 값이 길어지면 메일이 못 읽게 되므로 개수와 길이는 서버에서 자른다.
    client: dict[str, str] = Field(default_factory=dict)


class FeedbackResponse(BaseModel):
    sent: bool
