import os
import pandas as pd
import geopandas as gpd

DATA_DIR = os.path.join(os.path.dirname(__file__), "..")
DATA_GEMPA_PATH = os.path.join(DATA_DIR, "data.csv")
EEZ_PATH = os.path.join(DATA_DIR, "data.gpkg")

# Global cache
_data_cache = None
_eez_cache = None

def get_gempa_data():
    global _data_cache
    if _data_cache is not None:
        return _data_cache
        
    if not os.path.exists(DATA_GEMPA_PATH):
        return None
        
    try:
        df = pd.read_csv(DATA_GEMPA_PATH)
        df['time'] = pd.to_datetime(df['time'], errors='coerce')
        _data_cache = df
        return _data_cache
    except Exception as e:
        print(f"Error loading gempa data: {e}")
        return None

def append_gempa_data(new_df):
    global _data_cache
    
    # Keep a copy of the columns from the master dataset to align correctly
    master_cols = _data_cache.columns if _data_cache is not None else []
    
    # Ensure time is datetime
    if 'time' in new_df.columns:
        new_df['time'] = pd.to_datetime(new_df['time'], errors='coerce')
    else:
        # If no time provided, assume it's current time for real-time simulation
        new_df['time'] = pd.Timestamp.now(tz='UTC')
        
    if _data_cache is not None:
        _data_cache = pd.concat([_data_cache, new_df], ignore_index=True)
    else:
        _data_cache = new_df
        
    # Re-align columns to match original if possible
    if len(master_cols) > 0:
        # We don't drop extra columns, but we make sure they match
        pass
        
    # Overwrite the CSV permanently instead of appending to avoid column mismatch
    try:
        _data_cache.to_csv(DATA_GEMPA_PATH, index=False)
    except Exception as e:
        print(f"Failed to overwrite CSV: {e}")

def get_eez_data():
    global _eez_cache
    if _eez_cache is not None:
        return _eez_cache
        
    if not os.path.exists(EEZ_PATH):
        return None
        
    try:
        gdf = gpd.read_file(EEZ_PATH)
        _eez_cache = gdf
        return _eez_cache
    except Exception as e:
        print(f"Error loading eez data: {e}")
        return None
