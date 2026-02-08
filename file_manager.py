#Module_1_Document_Ingestion_and_Processing_Module

# file_manager.py
class FileManager:
    def __init__(self, file_id, file_name, file_type):
        self.fileID = file_id
        self.fileName = file_name
        self.fileType = file_type

    def uploadFile(self, file_path):
        print(f"Uploading file: {self.fileName}")
        return file_path
