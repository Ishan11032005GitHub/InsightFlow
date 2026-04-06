#Module_1_Document_Ingestion_and_Processing_Module
import datetime

# file_manager.py
class FileManager:
    def __init__(self, file_id, file_name, file_type):
        self.fileID = file_id
        self.fileName = file_name
        self.fileType = file_type
        self.uploadDate=datetime.datetime.now()

    def uploadFile(self, file_path):
        print(f"Uploading file: {self.fileName}")
        return file_path
