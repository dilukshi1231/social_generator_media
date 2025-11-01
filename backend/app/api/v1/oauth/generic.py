from fastapi import APIRouter, HTTPException

router = APIRouter()


@router.get("/{platform}/authorize")
async def generic_authorize(platform: str):
    raise HTTPException(status_code=501, detail=f"OAuth not implemented for {platform}")


@router.get("/{platform}/callback")
async def generic_callback(platform: str):
    raise HTTPException(status_code=501, detail=f"OAuth not implemented for {platform}")
