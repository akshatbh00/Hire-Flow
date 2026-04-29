from pydantic import BaseModel
from typing import Optional


class KarenMessageRequest(BaseModel):
    message: str


class KarenMessageResponse(BaseModel):
    reply:        str
    action_taken: Optional[str] = None   # e.g. "Applied to job: Senior Engineer at Google"
    suggestions:  list[str]     = []     # follow-up suggestions