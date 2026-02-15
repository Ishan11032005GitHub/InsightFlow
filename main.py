# main.py
from file_manager import FileManager
from data_processor import DataProcessor
from report_generator import ReportGenerator

file_manager = FileManager("F101", "data.pdf", "PDF")
processor = DataProcessor()
report_gen = ReportGenerator("R202")

file_path = file_manager.uploadFile("uploads/data.pdf")
processed_data = processor.processData(file_path)
final_report = report_gen.generateReport(processed_data)

print("Report Output:")
print(final_report)
