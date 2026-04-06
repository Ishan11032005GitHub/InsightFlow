#Module_2_Report_Generation_and_Download_Module

# report_generator.py
class ReportGenerator:
    def __init__(self, report_id, report_format="PDF"):
        self.reportID = report_id
        self.reportFormat = report_format
        self.reportContent = ""

    def generateReport(self, cleaned_data):
        print("Generating report...")
        self.reportContent = "\n".join(cleaned_data)
        return self.reportContent
