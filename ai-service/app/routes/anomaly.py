from fastapi import APIRouter 
 
router = APIRouter() 
 
@router.get("/") 
def get_anomaly(): 
    return {"message": "Anomaly detection endpoint ready"} 
