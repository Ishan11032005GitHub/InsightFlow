class VisualizationService:
    @staticmethod
    def generate_chart_config(data_frame_snippet: dict, chart_type: str = 'bar'):
        """Generates configuration for frontend charting libraries (e.g. Chart.js, Recharts)."""
        return {
            "type": chart_type,
            "data": data_frame_snippet,
            "options": {"responsive": True}
        }
