"""出行规划 Pydantic 模型。"""

from enum import Enum

from pydantic import BaseModel, Field


class TravelMode(str, Enum):
    WALKING = "walking"
    RIDING = "riding"
    DRIVING = "driving"
    TRANSIT = "transit"


class GeoPoint(BaseModel):
    lng: float = Field(..., ge=-180, le=180)
    lat: float = Field(..., ge=-90, le=90)


class RoutePlanRequest(BaseModel):
    origin: GeoPoint
    destination: GeoPoint
    mode: TravelMode = TravelMode.DRIVING


class RoutePlanResponse(BaseModel):
    route_id: str
    distance: int
    duration: int
    steps: list[dict]


class PlaceSearchResponse(BaseModel):
    name: str
    address: str
    lng: float
    lat: float


class NaviStartRequest(BaseModel):
    route_id: str


class GPSReport(BaseModel):
    lng: float
    lat: float
    speed: float = 0.0
    bearing: float = 0.0
    accuracy: float = 0.0