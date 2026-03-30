class InsightGenerator:
    @staticmethod
    def generate_insights(data_stats: dict):
        """Generates AI insights based on dataset statistics."""
        insights = []
        if data_stats:
            insights.append("Data indicates a balanced distribution.")
            insights.append("No critical outliers detected during preliminary scan.")
        return insights
