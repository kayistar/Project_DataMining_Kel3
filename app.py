import streamlit as st
import pandas as pd
import numpy as np
import os
import geopandas as gpd
import matplotlib.pyplot as plt
import seaborn as sns

st.set_page_config(page_title="Dashboard Gempa Bumi Indonesia", layout="wide", page_icon="🌍")

# Constants for data paths
DATA_DIR = "datasets"
DATA_GEMPA_PATH = os.path.join(DATA_DIR, "data.csv")
EEZ_PATH = os.path.join(DATA_DIR, "eez_v12.gpkg")

@st.cache_data
def load_data():
    if not os.path.exists(DATA_GEMPA_PATH):
        st.error(f"Dataset tidak ditemukan di {DATA_GEMPA_PATH}. Silakan masukkan file data.csv.")
        return None, None
    
    data = pd.read_csv(DATA_GEMPA_PATH)
    data['time'] = pd.to_datetime(data['time'])
    
    if os.path.exists(EEZ_PATH):
        try:
            peta_zee_dunia = gpd.read_file(EEZ_PATH)
        except Exception as e:
            st.warning(f"Gagal memuat peta ZEE: {e}")
            peta_zee_dunia = None
    else:
        peta_zee_dunia = None
        st.warning(f"File peta ZEE tidak ditemukan di {EEZ_PATH}.")
        
    return data, peta_zee_dunia

def main():
    st.title("🌍 Dashboard Analisis Gempa Bumi Indonesia")
    st.markdown("Dashboard ini menampilkan hasil EDA, Clustering, dan Prediksi LSTM dari proyek Data Mining Gempa Bumi.")
    
    data, peta_zee_dunia = load_data()
    
    if data is None:
        st.stop()
        
    # Sidebar navigation
    st.sidebar.title("Navigasi")
    menu = st.sidebar.radio("Pilih Analisis", 
                            ["Overview & Temporal EDA", "Spatial EDA", "Clustering Analysis", "LSTM Prediction"])
    
    if menu == "Overview & Temporal EDA":
        show_temporal_eda(data)
    elif menu == "Spatial EDA":
        show_spatial_eda(data, peta_zee_dunia)
    elif menu == "Clustering Analysis":
        show_clustering(data)
    elif menu == "LSTM Prediction":
        show_lstm_prediction(data)

def show_temporal_eda(data):
    st.header("📈 Overview & Temporal EDA")
    
    col1, col2, col3 = st.columns(3)
    col1.metric("Total Gempa", len(data))
    col2.metric("Rata-rata Magnitudo", round(data['mag'].mean(), 2))
    col3.metric("Kedalaman Rata-rata (km)", round(data['depth'].mean(), 2))
    
    st.subheader("Frekuensi Gempa Bulanan")
    monthly_counts = data.set_index('time').resample('ME').size()
    
    fig, ax = plt.subplots(figsize=(14, 4))
    ax.plot(monthly_counts.index, monthly_counts.values, color='teal', linewidth=1)
    ax.set_title('Frekuensi Gempa Bulanan di Indonesia')
    ax.set_xlabel('Tahun')
    ax.set_ylabel('Jumlah Gempa')
    ax.grid(True, alpha=0.3)
    st.pyplot(fig)
    
    st.subheader("Heatmap Tahun vs Bulan")
    data['tahun'] = data['time'].dt.year
    data['bulan'] = data['time'].dt.month
    heatmap_data = data.groupby(['tahun', 'bulan']).size().unstack(fill_value=0)
    
    fig2, ax2 = plt.subplots(figsize=(12, 6))
    sns.heatmap(heatmap_data, cmap="YlOrBr", annot=False, ax=ax2)
    ax2.set_title("Heatmap Kejadian Gempa: Tahun vs Bulan")
    st.pyplot(fig2)

def show_spatial_eda(data, peta_zee_dunia):
    st.header("🗺️ Spatial EDA")
    st.markdown("Peta sebaran gempa bumi berdasarkan latitude dan longitude.")
    
    # Placeholder for map
    st.map(data[['latitude', 'longitude']].dropna())

def show_clustering(data):
    st.header("🧩 Clustering Analysis")
    st.markdown("Hasil pengelompokan wilayah gempa (KMeans / DBSCAN / Agglomerative).")
    st.info("Fitur clustering akan dilatih menggunakan parameter dari notebook.")

def show_lstm_prediction(data):
    st.header("🔮 LSTM Prediction")
    st.markdown("Prediksi magnitudo atau frekuensi gempa menggunakan model LSTM.")
    st.info("Membutuhkan model LSTM terlatih atau akan dilatih secara dinamis.")

if __name__ == "__main__":
    main()
