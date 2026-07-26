import logging

logger = logging.getLogger(__name__)

class HealthMonitor:
    def __init__(self):
        self.status = {
            "whisper": "healthy",
            "gemini": "healthy",
            "tts": "healthy",
            "network": "healthy"
        }
        self.errors = []

    def report_error(self, component: str, error: str):
        logger.error(f"HealthMonitor - {component} error: {error}")
        self.status[component] = "degraded"
        self.errors.append({"component": component, "error": error})

    def get_status(self):
        return self.status

monitor = HealthMonitor()
