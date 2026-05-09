from fastapi import APIRouter 
 
router = APIRouter() 
 
@router.get("/") 
def get_nlquery(): 
    return {"message": "The NL query endpoint is ready"} 
