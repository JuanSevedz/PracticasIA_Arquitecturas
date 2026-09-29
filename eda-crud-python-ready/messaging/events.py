from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any
import uuid
@dataclass
class Event:
    data: dict[str, Any]
    event_id: str=field(default_factory=lambda: str(uuid.uuid4()))
    occurred_at: str=field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    @property
    def event_type(self): return self.__class__.__name__
@dataclass
class UserCreated(Event): pass
@dataclass
class UserUpdated(Event): pass
@dataclass
class UserDeleted(Event): pass
