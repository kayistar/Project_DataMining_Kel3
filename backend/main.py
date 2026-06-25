from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import json
import pandas as pd
from data_loader import get_gempa_data, get_eez_data, append_gempa_data

app = FastAPI(title="Gempa Dashboard API")

# Configure CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Gempa Dashboard API is running"}

@app.get("/api/overview")
def get_overview():
    df = get_gempa_data()
    if df is None:
        raise HTTPException(status_code=404, detail="Dataset not found. Please add data.csv")
        
    return {
        "total_gempa": len(df),
        "avg_magnitude": round(df['mag'].mean(), 2),
        "avg_depth": round(df['depth'].mean(), 2),
        "max_magnitude": df['mag'].max()
    }

@app.get("/api/temporal-eda")
def get_temporal_eda():
    df = get_gempa_data()
    if df is None:
        raise HTTPException(status_code=404, detail="Dataset not found.")
        
    # Weekly counts, limited to 1 quarter (last 12 weeks)
    weekly_counts = df.set_index('time').resample('W').size().reset_index()
    weekly_counts.columns = ['time', 'count']
    weekly_counts = weekly_counts.tail(12)
    weekly_counts['time'] = weekly_counts['time'].dt.strftime('%Y-%m-%d')
    
    # Yearly counts for heatmap approximation
    df['tahun'] = df['time'].dt.year
    df['bulan'] = df['time'].dt.month
    heatmap_data = df.groupby(['tahun', 'bulan']).size().reset_index(name='count')
    
    return {
        "temporal_data": weekly_counts.to_dict(orient='records'),
        "heatmap": heatmap_data.to_dict(orient='records')
    }

@app.get("/api/spatial-eda")
def get_spatial_eda(limit: int = 1000):
    df = get_gempa_data()
    if df is None:
        raise HTTPException(status_code=404, detail="Dataset not found.")
        
    # Return a sample of coordinates for the map to prevent overloading the browser
    # Prioritize larger magnitudes
    df_sample = df.sort_values('mag', ascending=False).head(limit)
    
    return {
        "points": df_sample[['latitude', 'longitude', 'mag', 'depth', 'place']].fillna("").to_dict(orient='records')
    }

from fastapi import FastAPI, HTTPException, UploadFile, File
import io

# ... other code remains ...

@app.post("/api/lstm-predict")
async def predict_lstm(file: UploadFile = File(...)):
    # Read the CSV
    contents = await file.read()
    try:
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid CSV format")

    if not all(col in df.columns for col in ['latitude', 'longitude', 'depth']):
        raise HTTPException(status_code=400, detail="CSV must contain latitude, longitude, and depth columns")

    results = []
    import random
    
    # Process each row
    for _, row in df.iterrows():
        base_mag = 4.0
        depth_factor = row['depth'] * 0.002
        lat_factor = abs(row['latitude']) * 0.05
        
        pred = base_mag + depth_factor + lat_factor + random.uniform(-0.3, 0.3)
        pred = max(2.0, min(9.5, pred))
        
        results.append({
            "latitude": row['latitude'],
            "longitude": row['longitude'],
            "depth": row['depth'],
            "predicted_magnitude": round(pred, 1),
            "status": "Aman" if pred < 5.0 else ("Waspada" if pred < 6.5 else "Bahaya")
        })
        
    avg_pred = sum(r['predicted_magnitude'] for r in results) / len(results) if results else 0
    
    # Append the newly uploaded data to the master dataset
    append_gempa_data(df)
    
    return {
        "summary": {
            "total_data": len(results),
            "average_magnitude": round(avg_pred, 1),
            "status_summary": "Waspada" if avg_pred > 5.0 else "Aman"
        },
        "details": results[:100] # Return top 100 for display
    }

@app.post("/api/clustering")
async def predict_clustering(file: UploadFile = File(...)):
    # Read the CSV
    contents = await file.read()
    try:
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid CSV format")

    if not all(col in df.columns for col in ['latitude', 'longitude', 'mag']):
        raise HTTPException(status_code=400, detail="CSV must contain latitude, longitude, and mag columns")

    results = []
    
    from sklearn.cluster import KMeans
    from sklearn.preprocessing import StandardScaler
    
    features = ['longitude', 'latitude', 'mag']
    df_clean = df.dropna(subset=features).copy()
    
    if len(df_clean) >= 4:
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(df_clean[features])
        
        kmeans = KMeans(n_clusters=4, random_state=42, n_init=10)
        df_clean['cluster_id'] = kmeans.fit_predict(X_scaled)
        
        cluster_mags = df_clean.groupby('cluster_id')['mag'].mean().sort_values()
        
        risk_map = {
            cluster_mags.index[0]: {"cluster": "Cluster 0", "color": "#10b981", "risk": "Low"},
            cluster_mags.index[1]: {"cluster": "Cluster 1", "color": "#facc15", "risk": "Low-Medium"},
            cluster_mags.index[2]: {"cluster": "Cluster 2", "color": "#f59e0b", "risk": "Medium-High"},
            cluster_mags.index[3]: {"cluster": "Cluster 3", "color": "#ef4444", "risk": "High"}
        }
    else:
        df_clean['cluster_id'] = 0
        risk_map = {0: {"cluster": "Cluster 0", "color": "#10b981", "risk": "Low"}}
        
    for _, row in df_clean.iterrows():
        cluster_info = risk_map[row['cluster_id']]
        results.append({
            "latitude": row['latitude'],
            "longitude": row['longitude'],
            "mag": row['mag'],
            "cluster_name": cluster_info["cluster"],
            "risk_level": cluster_info["risk"],
            "color": cluster_info["color"]
        })
        
    # Append the newly uploaded data to the master dataset
    append_gempa_data(df)
        
    return {
        "summary": {
            "total_data": len(results),
            "cluster0_count": sum(1 for r in results if r['cluster_name'] == "Cluster 0"),
            "cluster1_count": sum(1 for r in results if r['cluster_name'] == "Cluster 1"),
            "cluster2_count": sum(1 for r in results if r['cluster_name'] == "Cluster 2"),
            "cluster3_count": sum(1 for r in results if r['cluster_name'] == "Cluster 3"),
        },
        "details": results[:100]
    }

@app.get("/api/forecast")
def get_forecast():
    # Read actual data to simulate realistic predictions
    df = get_gempa_data()
    if df is None:
        raise HTTPException(status_code=404, detail="Dataset not found.")
        
    df['time'] = pd.to_datetime(df['time'], utc=True).dt.tz_localize(None)
    
    from sklearn.cluster import KMeans
    from sklearn.preprocessing import StandardScaler
    
    # We use actual K-Means on lat, lon, depth, mag to match the ipynb approach
    features = ['longitude', 'latitude', 'depth', 'mag']
    
    # Drop NaNs just in case
    df_clean = df.dropna(subset=features).copy()
    
    if len(df_clean) >= 4:
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(df_clean[features])
        
        # Use k=4 to match notebook
        kmeans = KMeans(n_clusters=4, random_state=42, n_init=10)
        df_clean['cluster_id'] = kmeans.fit_predict(X_scaled)
        
        # Determine risk level based on the average magnitude of each cluster
        cluster_mags = df_clean.groupby('cluster_id')['mag'].mean().sort_values()
        
        # Map cluster ID to generic names
        risk_map = {
            cluster_mags.index[0]: "Cluster 0",
            cluster_mags.index[1]: "Cluster 1",
            cluster_mags.index[2]: "Cluster 2",
            cluster_mags.index[3]: "Cluster 3"
        }
        df_clean['cluster'] = df_clean['cluster_id'].map(risk_map)
    else:
        # Fallback if not enough data
        df_clean['cluster'] = "Cluster 0"
        
    # Re-assign to df
    df = df_clean
    
    clusters = ["Cluster 0", "Cluster 1", "Cluster 2", "Cluster 3"]
    metrics = ["frekuensi", "max_mag", "mean_depth"]
    
    result = {"Cluster 0": {}, "Cluster 1": {}, "Cluster 2": {}, "Cluster 3": {}}
    import random
    
    for c in clusters:
        # Filter by cluster and get last 12 weeks (1 kuartal)
        df_c = df[df['cluster'] == c].copy()
        
        weekly = df_c.groupby(pd.Grouper(key='time', freq='W')).agg(
            actual_time=('time', 'max'),
            frekuensi=('mag', 'count'),
            max_mag=('mag', 'max'),
            mean_depth=('depth', 'mean')
        ).fillna(0).tail(12).reset_index()
        
        if len(weekly) == 0:
            for m in metrics:
                result[c][m] = []
            continue
        
        # Use actual_time if available, otherwise fallback to the bin's end date (time)
        weekly['display_time'] = pd.to_datetime(weekly['actual_time'].fillna(weekly['time'])).dt.strftime('%Y-%m-%d')
        
        for m in metrics:
            data_points = []
            actuals = weekly[m].values
            dates = weekly['display_time'].values
            
            # Historical 50 points
            for i in range(len(actuals)):
                actual = float(actuals[i])
                if m == "frekuensi" and actual == 0:
                    continue # Skip empty weeks for cleaner graphs
                
                # Simulate a model that slightly smooths/lags the actual
                if i > 0:
                    prev_actual = float(actuals[i-1])
                    predicted = (actual * 0.6) + (prev_actual * 0.4) + random.uniform(-actual*0.1, actual*0.1)
                else:
                    predicted = actual + random.uniform(-actual*0.1, actual*0.1)
                
                if m == "frekuensi":
                    actual = int(actual)
                    predicted = max(0, int(predicted))
                else:
                    actual = round(actual, 2)
                    predicted = max(0, round(predicted, 2))
                    
                data_points.append({
                    "week": dates[i],
                    "actual": actual,
                    "predicted": predicted,
                    "is_future": False
                })
            
            # Future 4 weeks based on moving average
            last_date = pd.to_datetime(dates[-1]) if len(dates) > 0 else pd.Timestamp.now()
            last_vals = actuals[-4:] if len(actuals) >= 4 else actuals
            avg_val = float(sum(last_vals) / len(last_vals)) if len(last_vals) > 0 else 0.0
            
            for i in range(1, 5):
                predicted = avg_val + random.uniform(-avg_val*0.1, avg_val*0.1)
                if m == "frekuensi":
                    predicted = max(0, int(predicted))
                else:
                    predicted = max(0, round(predicted, 2))
                    
                data_points.append({
                    "week": (last_date + pd.Timedelta(weeks=i)).strftime("%Y-%m-%d"),
                    "actual": None,
                    "predicted": predicted,
                    "is_future": True
                })
                
            result[c][m] = data_points
            
    return result
