# 🍽️ Restaurante Los Patos - Sistema de Predicción de Demanda

## 📋 Requisitos del Docente Cumplidos:
✅ **3 Modelos Clásicos**: Regresión Lineal, Random Forest, Red Neuronal MLP  
✅ **2 Modelos Híbridos**: Híbrido Lineal-MLP, Híbrido Stacking (RF + MLP)  
✅ **Tecnologías**: Python con FastAPI y StreamLit  


## 🚀 Cómo Ejecutar el Proyecto:

### 1. Instalar Dependencias:
```powershell
# Activar el entorno virtual
.venv\Scripts\activate

# Instalar dependencias de Python
pip install -r backend\requirements.txt
```

### 2. Ejecutar los Servicios:
#### a. **StreamLit (Interfaz de IA)**:
```powershell
streamlit run streamlit_app.py
```
Se abrirá en: http://localhost:8501

#### b. **FastAPI (Backend de Predicciones)**:
```powershell
cd backend
uvicorn main:app --reload
```
Documentación: http://localhost:8000/docs

#### c. **Frontend React**:
```powershell
cd frontend
npm run dev
```
Se abrirá en: http://localhost:5173

#### d. **Backend Spring Boot**:
```powershell
cd backend
.\gradlew.bat bootRun
```
Se ejecuta en: http://localhost:8000


## 🤖 Modelos de Inteligencia Artificial:
### Modelos Clásicos:
1. **Regresión Lineal**: Modelo básico para pronóstico de demanda
2. **Random Forest**: Ensamble de árboles de decisión para mayor precisión
3. **Red Neuronal MLP**: Multi-Layer Perceptron con 2 capas ocultas

### Modelos Híbridos:
1. **Híbrido Lineal-MLP**:
   - Paso 1: Entrena una Regresión Lineal
   - Paso 2: Entrena un MLP sobre los residuos de la Regresión Lineal
   - Paso 3: Combina las predicciones de ambos modelos

2. **Híbrido Stacking**:
   - Base Models: Random Forest y MLP
   - Final Estimator: Ridge Regression
   - Combina las predicciones de los modelos base para mejorar el rendimiento


## 📊 Funcionalidades de StreamLit:
1. **Análisis Exploratorio (EDA)**: Estadísticos descriptivos, gráficos de demanda por día
2. **Entrenamiento de Modelos**: Comparación de rendimiento, validación cruzada, pruebas estadísticas
3. **Predicción de Demanda**: Pronóstico para los próximos 7 días
4. **Reportes**: Generación de reportes en PDF, Word y Excel


## 📁 Estructura del Proyecto:
```
proyecto los patos/
├── backend/                # Backend (Spring Boot + FastAPI)
│   ├── main.py            # FastAPI
│   ├── predicts_pipeline.py # Lógica de IA
│   ├── requirements.txt    # Dependencias de Python
│   └── src/               # Código de Spring Boot
├── frontend/              # Frontend React
├── streamlit_app.py       # Aplicación StreamLit
└── README.md             # Este archivo
```
