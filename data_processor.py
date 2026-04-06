#Module_1_Document_Ingestion_and_Processing_Module

# data_processor.py
class DataProcessor:
    def __init__(self):
        self.rawData = []
        self.cleanedData = []

    def extractData(self, file_path):
        print("Extracting raw data...")
        self.rawData = ["sample raw text"]
        return self.rawData

    def cleanData(self):
        print("Cleaning data...")
        self.cleanedData = [data.lower() for data in self.rawData]
        return self.cleanedData

    def processData(self, file_path):
        self.extractData(file_path)
        return self.cleanData()
