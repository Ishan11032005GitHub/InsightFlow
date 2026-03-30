import csv

class CSVReader:
    @staticmethod
    def read_csv_preview(file_path: str, max_rows: int = 10):
        """Safely reads the first few rows of a CSV file for preview."""
        rows = []
        with open(file_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for i, row in enumerate(reader):
                if i >= max_rows:
                    break
                rows.append(row)
        return rows
