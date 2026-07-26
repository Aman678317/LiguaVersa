from health_monitor import monitor

class DiagnosticsEngine:
    def analyze(self):
        issues = []
        for comp, status in monitor.get_status().items():
            if status != "healthy":
                issues.append({
                    "component": comp,
                    "diagnosis": f"Detected degradation in {comp} pipeline.",
                    "action_required": "restart"
                })
        return issues

diagnostics_engine = DiagnosticsEngine()
