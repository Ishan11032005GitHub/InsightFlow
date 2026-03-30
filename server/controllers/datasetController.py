import os
import re

def secure_filename(filename: str) -> str:
    """Basic implementation to sanitize filenames."""
    filename = re.sub(r'[^a-zA-Z0-9_.-]', '_', os.path.basename(filename))
    return filename

class DatasetController:
    """
    Controller for managing dataset uploads and retrievals.
    Provides methods to integrate with a web framework like Flask or FastAPI.
    """
    def __init__(self, upload_folder='./uploads'):
        self.upload_folder = upload_folder
        if not os.path.exists(self.upload_folder):
            os.makedirs(self.upload_folder)

    def upload_dataset(self, file_obj, filename: str) -> dict:
        """
        Handles the dataset upload process.
        """
        if not file_obj or not filename:
            return {"error": "Missing file or filename", "status": 400}
            
        try:
            secure_name = secure_filename(filename)
            file_path = os.path.join(self.upload_folder, secure_name)
            
            # Save the file
            if hasattr(file_obj, 'save'):
                file_obj.save(file_path) # Typical Flask object behavior
            else:
                with open(file_path, 'wb') as f:
                    f.write(file_obj.read())
                    
            return {
                "message": "Dataset uploaded successfully",
                "filename": secure_name,
                "path": file_path,
                "status": 200
            }
        except Exception as e:
            return {"error": str(e), "status": 500}

    def list_datasets(self) -> dict:
        """
        Lists all uploaded datasets.
        """
        try:
            files = [f for f in os.listdir(self.upload_folder) if os.path.isfile(os.path.join(self.upload_folder, f))]
            return {"datasets": files, "status": 200}
        except Exception as e:
            return {"error": str(e), "status": 500}

    def delete_dataset(self, filename: str) -> dict:
        """
        Deletes a specific dataset.
        """
        try:
            file_path = os.path.join(self.upload_folder, secure_filename(filename))
            if os.path.exists(file_path):
                os.remove(file_path)
                return {"message": f"Dataset {filename} deleted", "status": 200}
            return {"error": "Dataset not found", "status": 404}
        except Exception as e:
            return {"error": str(e), "status": 500}
