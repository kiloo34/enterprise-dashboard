import os
import logging
import time
import httpx
from typing import List, Dict, Any
from app.schemas.ml_scoring import ScoringRequest, ScoringResult

logger = logging.getLogger(__name__)

class DataikuScoringService:
    _instance = None
    
    def __init__(self):
        self.model = None
        self.model_path = os.getenv("DATAIKU_MODEL_PATH", "./app/ml_models/churn_retail_model")
        self.last_checked = 0
        self.ttl = 300  # 5 minutes
        self.iam_public_config_url = os.getenv("IAM_CONFIG_URL", "http://ent_dash_iam:8000/api/system-config/public")
        self._load_model()
        
    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _check_and_reload_path(self):
        current_time = time.time()
        if current_time - self.last_checked > self.ttl:
            self.last_checked = current_time
            try:
                # Fetch new path from IAM
                url = f"{self.iam_public_config_url}/analytics.ml_models.churn_retail.path"
                with httpx.Client(timeout=2.0) as client:
                    resp = client.get(url)
                    if resp.status_code == 200:
                        data = resp.json()
                        new_path = data.get("value")
                        if new_path and new_path != self.model_path:
                            logger.info(f"Model path changed from {self.model_path} to {new_path}. Reloading model.")
                            self.model_path = new_path
                            self._load_model()
            except Exception as e:
                logger.warning(f"Failed to fetch model path from IAM: {e}")

    def _load_model(self):
        try:
            # We import here so that if the dependency is missing it only fails on init
            from dataikuscoring import load_model
            
            absolute_path = os.path.abspath(self.model_path)
            logger.info(f"Loading Dataiku model from: {absolute_path}")
            self.model = load_model(absolute_path)
            logger.info("Dataiku model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load Dataiku model from {self.model_path}: {str(e)}")
            self.model = None

    def predict(self, request: ScoringRequest) -> ScoringResult:
        # Check for model path updates before predicting
        self._check_and_reload_path()
        
        if self.model is None:
            raise ValueError("Model is not loaded or not available.")
            
        # Convert pydantic models to list of dicts required by Dataiku model
        data_to_score = [item.dict() if hasattr(item, "dict") else item for item in request.data]
        
        predictions = self.model.predict(data_to_score)
        predict_proba = self.model.predict_proba(data_to_score)
        
        return ScoringResult(
            predictions=predictions.tolist() if hasattr(predictions, "tolist") else predictions,
            probabilities=predict_proba.tolist() if hasattr(predict_proba, "tolist") else predict_proba
        )
