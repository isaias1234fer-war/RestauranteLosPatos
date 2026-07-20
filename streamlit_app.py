import os
import sys
import joblib
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import streamlit as st

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from backend.models import Producto, FactVenta, DimTiempo
from backend.predicts_pipeline import (
    load_or_generate_data,
    preprocess_data,
    run_eda,
    train_models,
    run_cross_validation,
    run_hyperparameter_tuning,
    run_statistical_tests,
    run_demand_forecast
)

# --- Configuración de la página ---
st.set_page_config(
    page_title="Sistema de Predicción de Demanda - Los Patos",
    page_icon="🦆",
    layout="wide"
)

# --- Conexión a la base de datos ---
DATABASE_URL = "postgresql://postgres:76858382@localhost:5432/los_patos"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        return db
    finally:
        db.close()

# --- Sidebar ---
st.sidebar.title("🦆 Restaurante Los Patos")
page = st.sidebar.radio(
    "Selecciona una sección:",
    ["1. Análisis Exploratorio (EDA)", "2. Entrenamiento de Modelos", "3. Predicción de Demanda", "4. Reportes"]
)

# --- Caché para datos y modelos ---
@st.cache_data
def get_data():
    db = get_db()
    df, products = load_or_generate_data(db)
    return df, products

@st.cache_resource
def get_trained_models():
    df, products = get_data()
    if df.empty or len(products) == 0:
        return None
    try:
        X, y, df, enc = preprocess_data(df)
        eda_stats = run_eda(df)
        train_results, best_name, y_test, predictions_test = train_models(X, y, df)
        cv_results = run_cross_validation(X, y)
        hp_results = run_hyperparameter_tuning(X, y)
        stat_tests = run_statistical_tests(y_test, predictions_test, best_name)
        return eda_stats, train_results, best_name, cv_results, hp_results, stat_tests, X, y, df, enc
    except Exception as e:
        st.error(f"Error entrenando modelos: {str(e)}")
        return None

# --- Páginas ---
if page == "1. Análisis Exploratorio (EDA)":
    st.title("📊 Análisis Exploratorio de Datos (EDA)")
    df, products = get_data()
    
    if df.empty or not products:
        st.warning("No hay suficientes datos o productos en la base de datos. Asegúrate de que Spring Boot esté corriendo y la base de datos tenga datos!")
    else:
        col1, col2, col3, col4 = st.columns(4)
        eda_stats = run_eda(df)
        
        with col1:
            st.metric("Total de registros", int(eda_stats["count"]))
        with col2:
            st.metric("Demanda promedio", f"{eda_stats['mean']:.2f}")
        with col3:
            st.metric("Desviación estándar", f"{eda_stats['std']:.2f}")
        with col4:
            st.metric("Demanda máxima", int(eda_stats["max"]))
        
        st.subheader("📈 Demanda por día de la semana")
        weekday_df = pd.DataFrame(list(eda_stats["weekday_stats"].items()), columns=["Día", "Demanda Promedio"])
        day_names = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
        weekday_df["Día"] = weekday_df["Día"].map(lambda x: day_names[x])
        st.bar_chart(weekday_df.set_index("Día"))
        
        st.subheader("🍽️ Estadísticas por producto")
        st.dataframe(pd.DataFrame(eda_stats["prod_stats"]))

elif page == "2. Entrenamiento de Modelos":
    st.title("🤖 Entrenamiento y Comparación de Modelos")
    
    result = get_trained_models()
    if result is None:
        st.error("No hay datos suficientes para entrenar modelos. Asegúrate de que Spring Boot esté corriendo y la base de datos tenga productos y ventas!")
    else:
        eda_stats, train_results, best_name, cv_results, hp_results, stat_tests, X, y, df, enc = result
        
        st.success(f"✅ Mejor modelo: **{best_name}**")
        
        st.subheader("📋 Modelos Implementados")
        st.markdown("""
        ### 📌 Modelos Clásicos (3):
        1. Regresión Lineal
        2. Random Forest
        3. Red Neuronal MLP (Multi-Layer Perceptron)
        
        ### 📌 Modelos Híbridos (2):
        1. **Híbrido Lineal-MLP**: Regresión Lineal + MLP entrenado sobre los residuos
        2. **Híbrido Stacking**: Ensamble de Random Forest + MLP, con Ridge como estimador final
        """)
        
        st.subheader("📊 Resultados de entrenamiento (Test Set)")
        results_df = pd.DataFrame(train_results).T
        st.dataframe(results_df.style.highlight_max(axis=0, color="#90EE90"))
        
        st.subheader("🔍 Validación Cruzada (k=5)")
        cv_df = pd.DataFrame(cv_results).T
        st.dataframe(cv_df)
        
        st.subheader("⚙️ Hiperparámetros optimizados (MLP)")
        st.json(hp_results)
        
        st.subheader("📈 Pruebas estadísticas")
        st.dataframe(pd.DataFrame(stat_tests))
        
        st.subheader("📉 Visualizaciones")
        img_dir = os.path.join(os.path.dirname(__file__), "backend", "static", "img")
        if os.path.exists(os.path.join(img_dir, "confusion_matrix.png")):
            st.image(os.path.join(img_dir, "confusion_matrix.png"), caption="Matrices de Confusión para todos los modelos")
        if os.path.exists(os.path.join(img_dir, "roc_curve.png")):
            st.image(os.path.join(img_dir, "roc_curve.png"), caption="Curvas ROC Comparativas")
        if os.path.exists(os.path.join(img_dir, "heatmap_corr.png")):
            st.image(os.path.join(img_dir, "heatmap_corr.png"), caption="Mapa de Calor de Métricas")

elif page == "3. Predicción de Demanda":
    st.title("🔮 Predicción de Demanda para los próximos 7 días")
    db = get_db()
    forecast = run_demand_forecast(db)
    
    if not forecast:
        st.warning("No hay predicciones disponibles.")
    else:
        forecast_df = pd.DataFrame(forecast)
        st.dataframe(forecast_df)
        
        st.subheader("📊 Predicción por producto y fecha")
        pivot_df = forecast_df.pivot(index="fecha", columns="nombre", values="demanda")
        st.line_chart(pivot_df)

elif page == "4. Reportes":
    st.title("📄 Generar Reportes")
    db = get_db()
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        if st.button("📄 Generar Reporte PDF"):
            df, products = get_data()
            X, y, df, enc = preprocess_data(df)
            eda_stats = run_eda(df)
            train_results, best_name, y_test, preds_test = train_models(X, y, df)
            stat_tests = run_statistical_tests(y_test, preds_test, best_name)
            forecast_data = run_demand_forecast(db)
            
            from backend.predicts_pipeline import generate_pdf_report
            pdf_path = os.path.join(os.path.dirname(__file__), "reporte_demanda.pdf")
            generate_pdf_report(eda_stats, train_results, best_name, stat_tests, forecast_data, pdf_path)
            st.success("✅ Reporte PDF generado!")
            with open(pdf_path, "rb") as f:
                st.download_button("📥 Descargar PDF", f, "reporte_demanda.pdf")
    
    with col2:
        if st.button("📘 Generar Reporte Word"):
            df, products = get_data()
            X, y, df, enc = preprocess_data(df)
            eda_stats = run_eda(df)
            train_results, best_name, y_test, preds_test = train_models(X, y, df)
            stat_tests = run_statistical_tests(y_test, preds_test, best_name)
            forecast_data = run_demand_forecast(db)
            
            from backend.predicts_pipeline import generate_word_report
            doc_path = os.path.join(os.path.dirname(__file__), "reporte_demanda.docx")
            generate_word_report(eda_stats, train_results, best_name, stat_tests, forecast_data, doc_path)
            st.success("✅ Reporte Word generado!")
            with open(doc_path, "rb") as f:
                st.download_button("📥 Descargar Word", f, "reporte_demanda.docx")
    
    with col3:
        if st.button("📊 Generar Reporte Excel"):
            df, products = get_data()
            X, y, df, enc = preprocess_data(df)
            eda_stats = run_eda(df)
            train_results, best_name, y_test, preds_test = train_models(X, y, df)
            stat_tests = run_statistical_tests(y_test, preds_test, best_name)
            forecast_data = run_demand_forecast(db)
            
            from backend.predicts_pipeline import generate_excel_report
            xlsx_path = os.path.join(os.path.dirname(__file__), "reporte_demanda.xlsx")
            generate_excel_report(eda_stats, train_results, best_name, stat_tests, forecast_data, xlsx_path)
            st.success("✅ Reporte Excel generado!")
            with open(xlsx_path, "rb") as f:
                st.download_button("📥 Descargar Excel", f, "reporte_demanda.xlsx")
