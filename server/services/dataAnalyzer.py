import pandas as pd
import numpy as np

class DataAnalyzer:
    """
    DataAnalyzer provides methods for statistical analysis, 
    data cleaning, and generating insights from CSV and Excel datasets.
    """
    
    @staticmethod
    def analyze_dataset(file_path: str, file_type: str = 'csv') -> dict:
        """
        Reads a dataset and computes core statistics and preview data.
        """
        try:
            if file_type.lower() == 'csv':
                df = pd.read_csv(file_path)
            elif file_type.lower() in ['xls', 'xlsx']:
                df = pd.read_excel(file_path)
            else:
                raise ValueError("Unsupported file format. Please provide CSV or Excel files.")
                
            return DataAnalyzer._compute_stats(df)
            
        except pd.errors.EmptyDataError:
            raise ValueError("The provided file is empty.")
        except Exception as e:
            raise ValueError(f"Error analyzing dataset: {str(e)}")
            
    @staticmethod
    def _compute_stats(df: pd.DataFrame) -> dict:
        """
        Computes summary statistics comparable to the frontend implementation.
        """
        stats = []
        stats.append({"label": "Total Rows", "value": f"{len(df):,}"})
        stats.append({"label": "Total Columns", "value": len(df.columns)})
        
        # Select numeric columns
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        
        # Calculate stats for up to 4 numeric columns
        for col in numeric_cols[:4]:
            col_data = df[col].dropna()
            if not col_data.empty:
                mean = col_data.mean()
                max_val = col_data.max()
                min_val = col_data.min()
                
                stats.append({
                    "label": f"{col} (Avg)",
                    "value": round(mean, 2),
                    "sub": f"Min: {round(min_val, 2)} | Max: {round(max_val, 2)}"
                })
                
        # Handle nan values for JSON serialization
        preview_df = df.head(10).replace({np.nan: None})
        
        return {
            "columns": df.columns.tolist(),
            "stats": stats,
            "preview_data": preview_df.to_dict(orient="records"),
            "row_count": len(df)
        }
        
    @staticmethod
    def perform_cleaning(df: pd.DataFrame) -> pd.DataFrame:
        """
        Basic data cleaning utility.
        """
        # Drop completely empty rows and columns
        df_cleaned = df.dropna(how='all', axis=0)
        df_cleaned = df_cleaned.dropna(how='all', axis=1)
        
        # Fill missing numeric values with the column mean
        numeric_cols = df_cleaned.select_dtypes(include=[np.number]).columns
        df_cleaned[numeric_cols] = df_cleaned[numeric_cols].apply(lambda x: x.fillna(x.mean()))
        
        return df_cleaned
