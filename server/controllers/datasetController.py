import os
import re
import json
from flask import jsonify

def secure_filename(filename: str) -> str:
    """Basic implementation to sanitize filenames."""
    filename = re.sub(r'[^a-zA-Z0-9_.-]', '_', os.path.basename(filename))
    return filename

_llm_client = None
def get_llm():
    global _llm_client
    if _llm_client is None:
        from rag.llm.llm_client import LLMClient
        _llm_client = LLMClient()
    return _llm_client

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

    @staticmethod
    def _build_data_snapshot(data):
        """Build a text snapshot of the data for the AI prompt."""
        columns = data.get('columns', [])
        sample = data.get('sampleData', [])
        stats = data.get('stats', [])
        row_count = data.get('rowCount', len(sample))
        file_name = data.get('fileName', 'dataset')

        # Build column type info
        numeric_cols = data.get('numericColumns', [])
        categorical_cols = data.get('categoricalColumns', [])

        lines = [
            f"Dataset: {file_name}",
            f"Total rows: {row_count}, Total columns: {len(columns)}",
            f"Columns: {', '.join(columns)}",
            f"Numeric columns: {', '.join(numeric_cols) if numeric_cols else 'auto-detect from data'}",
            f"Categorical columns: {', '.join(categorical_cols) if categorical_cols else 'auto-detect from data'}",
            "",
            "Sample data (first rows as JSON):",
            json.dumps(sample[:30], default=str)[:6000],
        ]
        if stats:
            lines.append("\nComputed statistics:")
            for s in stats[:10]:
                sub = f" ({s['sub']})" if s.get('sub') else ""
                lines.append(f"  {s['label']}: {s['value']}{sub}")

        return "\n".join(lines)

    @staticmethod
    def analyze_with_ai(data):
        """Use Gemini AI to analyze the dataset and return summary + chart recommendations."""
        try:
            llm = get_llm()
            snapshot = DatasetController._build_data_snapshot(data)

            prompt = f"""You are a senior data analyst. Analyze the following dataset and return a JSON response.

{snapshot}

Return ONLY valid JSON (no markdown, no code fences) with this exact structure:
{{
  "summary": "A comprehensive 3-5 sentence summary of what this dataset contains, key patterns, and notable findings.",
  "charts": [
    {{
      "type": "bar",
      "title": "Chart title",
      "description": "Why this chart is useful",
      "xColumn": "column_name_for_x_axis",
      "yColumn": "column_name_for_y_axis",
      "aggregation": "sum|avg|count"
    }},
    {{
      "type": "pie",
      "title": "Chart title",
      "description": "Why this chart is useful",
      "column": "categorical_column_name",
      "valueColumn": "optional_numeric_column_for_values"
    }}
  ],
  "insights": [
    {{
      "title": "Insight title",
      "text": "Detailed insight explanation",
      "type": "positive|warning|info|suggestion"
    }}
  ]
}}

IMPORTANT RULES:
- Use ONLY column names that exist in the data: {', '.join(data.get('columns', []))}
- Recommend 3-5 charts total (mix of bar and pie charts)
- For bar charts: pick the most meaningful numeric vs categorical comparisons
- For pie charts: pick categorical columns that show meaningful distributions (avoid columns with too many unique values)
- Generate 3-5 data-driven insights based on the actual data values
- The summary should mention specific numbers and patterns from the data
- If a column has numeric data that represents categories (like IDs), treat it as categorical"""

            import requests
            api_key = llm.api_key
            api_url = llm.api_url

            response = requests.post(
                f"{api_url}?key={api_key}",
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {
                        "temperature": 0.3,
                        "maxOutputTokens": 4096,
                    }
                },
                timeout=45
            )
            response.raise_for_status()
            result = response.json()
            answer = result["candidates"][0]["content"]["parts"][0]["text"].strip()

            # Clean markdown fences if present
            if answer.startswith("```"):
                answer = answer.split("\n", 1)[1] if "\n" in answer else answer[3:]
            if answer.endswith("```"):
                answer = answer[:-3]
            answer = answer.strip()

            parsed = json.loads(answer)
            return jsonify(parsed), 200

        except json.JSONDecodeError:
            # If AI didn't return valid JSON, return the raw text as summary
            return jsonify({
                "summary": answer if 'answer' in dir() else "Unable to parse AI response.",
                "charts": [],
                "insights": []
            }), 200
        except Exception as e:
            print(f"AI analysis error: {e}")
            return jsonify({"error": str(e)}), 500

    @staticmethod
    def ask_data_question(data):
        """Let user ask a question about their data, answered by AI."""
        try:
            llm = get_llm()
            snapshot = DatasetController._build_data_snapshot(data)
            question = data.get('question', '')

            prompt = f"""You are a data analyst assistant. Answer the user's question about this dataset.

{snapshot}

User's question: {question}

Provide a detailed, accurate answer based on the actual data. Use specific numbers and values from the data.
If the question asks for a chart or visualization, suggest the best chart type and which columns to use.
Format your answer with markdown (headers, bullets, bold) for readability."""

            import requests
            response = requests.post(
                f"{llm.api_url}?key={llm.api_key}",
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {
                        "temperature": 0.4,
                        "maxOutputTokens": 3072,
                    }
                },
                timeout=45
            )
            response.raise_for_status()
            result = response.json()
            answer = result["candidates"][0]["content"]["parts"][0]["text"].strip()
            return jsonify({"answer": answer}), 200
        except Exception as e:
            print(f"AI question error: {e}")
            return jsonify({"error": str(e)}), 500
