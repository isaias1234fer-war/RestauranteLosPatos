import React, { useState, useEffect } from "react";


import { 
  Sparkles, 
  Calendar, 
  Sliders, 
  Activity, 
  CheckCircle,
  TrendingUp,
  FileSpreadsheet,
  FileText,
  BarChart,
  Info
} from "lucide-react";

// The 5 Machine Learning models we train on the backend
const ALGORITHMS = [
  { name: "Regresion Lineal", bg: "#fef3c7", color: "#d97706" },
  { name: "Random Forest", bg: "#e0e7ff", color: "#4f46e5" },
  { name: "Red Neuronal MLP", bg: "#fae8ff", color: "#c026d3" },
  { name: "Hibrido Lineal-MLP", bg: "#d1fae5", color: "#059669" },
  { name: "Hibrido Stacking (RF+MLP)", bg: "#e0f2fe", color: "#0284c7" }
];

interface ModelResultRow {
  algoritmo: string;
  r2: number;
  rmse: number;
  mae: number;
  mape: number;
  timeMs: number;
}

interface PredictionRow {
  productoId: number;
  nombre: string;
  fecha: string;
  demanda: number;
  algoritmo: string;
  confianza: number;
}

interface StatisticalTestRow {
  comparador: string;
  t_statistic: number;
  t_p_value: number;
  wilcoxon_statistic: number;
  wilcoxon_p_value: number;
  significativo: boolean;
  interpretacion: string;
}

interface CrossValidationRow {
  algoritmo: string;
  rmse_mean: number;
  rmse_std: number;
  r2_mean: number;
  r2_std: number;
}

interface EdaProductStat {
  nombre: string;
  mean: number;
  std: number;
  min: number;
  max: number;
}

interface EdaStats {
  count: number;
  mean: number;
  std: number;
  median: number;
  min: number;
  max: number;
  prod_stats: EdaProductStat[];
}

interface PredictsProps {
  setVistaActual?: (vista: string) => void;
}

export const Predicts: React.FC<PredictsProps> = ({ setVistaActual }) => {

  const [comparing, setComparing] = useState<boolean>(false);
  const [generating, setGenerating] = useState<boolean>(false);
  const [optimizing, setOptimizing] = useState<boolean>(false);
  const [validating, setValidating] = useState<boolean>(false);
  const [runningCv, setRunningCv] = useState<boolean>(false);
  const [loadingEda, setLoadingEda] = useState<boolean>(false);

  // Core Data States
  const [modelResults, setModelResults] = useState<ModelResultRow[]>([]);
  const [bestModelName, setBestModelName] = useState<string>("");
  const [predictions, setPredictions] = useState<PredictionRow[]>([]);
  const [statTests, setStatTests] = useState<StatisticalTestRow[]>([]);
  const [cvResults, setCvResults] = useState<CrossValidationRow[]>([]);
  const [edaStats, setEdaStats] = useState<EdaStats | null>(null);
  
  // Tuning parameters output
  const [tunedParams, setTunedParams] = useState<any>(null);
  
  // Configs
  const [cvFolds, setCvFolds] = useState<number>(5);
  const [chartsVersion, setChartsVersion] = useState<number>(Date.now());
  const [activeTab, setActiveTab] = useState<"train" | "cv" | "tuning" | "stats" | "eda">("train");
  
  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" } | null>(null);

  useEffect(() => {
    // Silent pre-load of predictions if model is already trained
    fetchForecast();
  }, []);

  const triggerToast = (message: string, type: "success" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Base URL for FastAPI
  const API_BASE_URL = "http://localhost:8002/api/predicts";
  const STATIC_IMG_URL = "http://localhost:8002/static/img";

  // FETCH FORECAST DIRECTLY
  const fetchForecast = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/forecast`);
      if (res.ok) {
        const data = await res.json();
        setPredictions(data || []);
      }
    } catch (e) {
      console.error("Error fetching forecast", e);
    }
  };

  // 1. COMPARAR Y ENTRENAR MODELOS
  const handleCompareModels = async () => {
    setComparing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/train`, {
        method: "POST"
      });
      if (!res.ok) throw new Error("Error en el servidor");
      const data = await res.json();
      
      // Parse dictionary of metrics
      const rows: ModelResultRow[] = Object.entries(data.results).map(([key, val]: [string, any]) => ({
        algoritmo: key,
        r2: val.r2,
        rmse: val.rmse,
        mae: val.mae,
        mape: val.mape,
        timeMs: val.time_ms
      }));
      
      setModelResults(rows);
      setBestModelName(data.best_model);
      setChartsVersion(Date.now()); // Refresh charts to bypass cache
      triggerToast("¡Los 5 modelos han sido reentrenados y evaluados en el servidor!");
      // Automatically refresh demand forecast table
      fetchForecast();
    } catch (e) {
      triggerToast("Ocurrió un error al entrenar los modelos.", "info");
    } finally {
      setComparing(false);
    }
  };

  // 2. GENERAR PREDICCIONES (7 DÍAS EN ADELANTE)
  const handleGeneratePredictions = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/forecast`);
      if (!res.ok) throw new Error("Error en el servidor");
      const data = await res.json();
      setPredictions(data || []);
      triggerToast("¡Predicciones de demanda sugeridas para los próximos 7 días!");
    } catch (e) {
      triggerToast("Error al obtener la proyección de demanda.", "info");
    } finally {
      setGenerating(false);
    }
  };

  // 3. OPTIMIZAR HIPERPARÁMETROS
  const handleOptimizeHyperparameters = async () => {
    setOptimizing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/tune`, {
        method: "POST"
      });
      if (!res.ok) throw new Error("Error en el tuning");
      const data = await res.json();
      setTunedParams(data);
      triggerToast("Hiperparámetros optimizados con GridSearchCV exitosamente.");
    } catch (e) {
      triggerToast("Error al sintonizar parámetros.", "info");
    } finally {
      setOptimizing(false);
    }
  };

  // 4. EJECUTAR VALIDACIÓN ESTADÍSTICA (WILCOXON & T-TEST)
  const handleStatisticalValidation = async () => {
    setValidating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/statistical_tests`);
      if (!res.ok) throw new Error("Error en test");
      const data = await res.json();
      setStatTests(data || []);
      triggerToast("Pruebas estadísticas ejecutadas sobre los residuos absolutos.");
    } catch (e) {
      triggerToast("Error al ejecutar análisis estadístico.", "info");
    } finally {
      setValidating(false);
    }
  };

  // 5. VALIDACIÓN CRUZADA
  const handleRunCrossValidation = async () => {
    setRunningCv(true);
    try {
      const res = await fetch(`${API_BASE_URL}/cross_validation?folds=${cvFolds}`);
      if (!res.ok) throw new Error("Error en CV");
      const data = await res.json();
      const rows: CrossValidationRow[] = Object.entries(data).map(([key, val]: [string, any]) => ({
        algoritmo: key,
        rmse_mean: val.rmse_mean,
        rmse_std: val.rmse_std,
        r2_mean: val.r2_mean,
        r2_std: val.r2_std
      }));
      setCvResults(rows);
      triggerToast(`Validación Cruzada completada en K=${cvFolds} folds.`);
    } catch (e) {
      triggerToast("Error al correr Validación Cruzada.", "info");
    } finally {
      setRunningCv(false);
    }
  };

  // 6. CARGAR EDA ESTADÍSTICOS
  const handleLoadEda = async () => {
    setLoadingEda(true);
    try {
      const res = await fetch(`${API_BASE_URL}/eda`);
      if (!res.ok) throw new Error("Error en EDA");
      const data = await res.json();
      setEdaStats(data);
      triggerToast("Datos históricos analizados descriptivamente.");
    } catch (e) {
      triggerToast("Error al cargar descriptivos EDA.", "info");
    } finally {
      setLoadingEda(false);
    }
  };

  return (
    <div className="predicts-demand-view">
      {/* Toast Notification */}
      {toast && (
        <div className={`toast-notification ${toast.type}`}>
          <CheckCircle size={16} />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Panel */}
      <div className="demand-header-panel glass-panel">
        <div className="demand-header-left">
          <div className="demand-title-row">
            <span className="brain-emoji" role="img" aria-label="brain">🧠</span>
            <h1>Redes Neuronales y Predicción de Demanda</h1>
          </div>
          <div className="algorithms-badges-row">
            {ALGORITHMS.map((algo, i) => (
              <span 
                key={i} 
                className="algo-badge"
                style={{ backgroundColor: algo.bg, color: algo.color }}
              >
                {algo.name}
              </span>
            ))}
          </div>
        </div>
        
        {/* Reports Download Area */}
        <div className="download-reports-area" style={{ gap: "8px" }}>
          <button 
            className="btn-report-download info-btn" 
            onClick={() => setVistaActual?.("modelos-ia")}
            style={{ 
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", 
              color: "white",
              textDecoration: "none",
              padding: "10px 16px",
              border: "none",
              borderRadius: "8px",
              fontWeight: 600,
              fontSize: "0.875rem",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer"
            }}
          >
            <Info size={16} />
            Info Modelos
          </button>
          <a href={`${API_BASE_URL}/reports/pdf`} target="_blank" rel="noreferrer" className="btn-report-download pdf">
            <FileText size={16} />
            PDF
          </a>
          <a href={`${API_BASE_URL}/reports/word`} target="_blank" rel="noreferrer" className="btn-report-download docx">
            <FileText size={16} />
            Word
          </a>
          <a href={`${API_BASE_URL}/reports/excel`} target="_blank" rel="noreferrer" className="btn-report-download xlsx">
            <FileSpreadsheet size={16} />
            Excel
          </a>
        </div>
      </div>

      {/* Button Operations Row */}
      <div className="operations-buttons-row">
        <button 
          className="op-btn purple" 
          onClick={handleCompareModels}
          disabled={comparing}
        >
          <Sparkles size={16} className={comparing ? "animate-spin" : ""} />
          {comparing ? "Entrenando Modelos..." : "Comparar 5 Modelos (Servidor)"}
        </button>
        <button 
          className="op-btn blue" 
          onClick={handleGeneratePredictions}
          disabled={generating}
        >
          <Calendar size={16} className={generating ? "animate-spin" : ""} />
          {generating ? "Proyectando..." : "Generar Predicciones (7 días)"}
        </button>
        <button 
          className="op-btn dark-blue" 
          onClick={handleOptimizeHyperparameters}
          disabled={optimizing}
        >
          <Sliders size={16} className={optimizing ? "animate-spin" : ""} />
          {optimizing ? "Sintonizando..." : "Tuning Hiperparámetros"}
        </button>
        <button 
          className="op-btn yellow-blue" 
          onClick={handleLoadEda}
          disabled={loadingEda}
        >
          <BarChart size={16} className={loadingEda ? "animate-spin" : ""} />
          {loadingEda ? "Calculando..." : "Análisis EDA Descriptivo"}
        </button>
      </div>

      {/* Navigation tabs for pipeline parts */}
      <div className="pipeline-tabs-nav glass-panel">
        <button className={`tab-nav-btn ${activeTab === "train" ? "active" : ""}`} onClick={() => setActiveTab("train")}>
          1 & 2. Entrenamiento y Curvas
        </button>
        <button className={`tab-nav-btn ${activeTab === "cv" ? "active" : ""}`} onClick={() => setActiveTab("cv")}>
          3. Validación Cruzada (K-Fold)
        </button>
        <button className={`tab-nav-btn ${activeTab === "tuning" ? "active" : ""}`} onClick={() => setActiveTab("tuning")}>
          4. Hiperparámetros (Tuning)
        </button>
        <button className={`tab-nav-btn ${activeTab === "stats" ? "active" : ""}`} onClick={() => { setActiveTab("stats"); handleStatisticalValidation(); }}>
          5. Pruebas Estadísticas Robustas
        </button>
        <button className={`tab-nav-btn ${activeTab === "eda" ? "active" : ""}`} onClick={() => { setActiveTab("eda"); handleLoadEda(); }}>
          Fase EDA Histórico
        </button>
      </div>

      {/* Tab Panels */}
      <div className="tab-panels-container">
        
        {/* PANEL 1: ENTRENAMIENTO Y CURVAS */}
        {activeTab === "train" && (
          <div className="tab-pane animate-fade-in">
            <div className="demand-glass-panel">
              <div className="panel-title-row">
                <span className="trophy-emoji" role="img" aria-label="trophy">🏆</span>
                <h3>Precisión de los Modelos Entrenados</h3>
              </div>
              
              {comparing ? (
                <div className="table-loader-wrapper">
                  <div className="spinner"></div>
                  <span>Entrenando modelos lineales, bosques y redes neuronales en el servidor...</span>
                </div>
              ) : modelResults.length === 0 ? (
                <div className="empty-table-placeholder">
                  <Activity size={32} className="text-muted" />
                  <span>Presione "Comparar 5 Modelos (Servidor)" para iniciar el entrenamiento y obtener estadísticos.</span>
                </div>
              ) : (
                <div className="demand-table-container">
                  <table className="demand-custom-table">
                    <thead>
                      <tr>
                        <th>ALGORITMO</th>
                        <th>R² (PRECISIÓN)</th>
                        <th>RMSE (ERROR MEDIO)</th>
                        <th>MAE (ERR. ABSOLUTO)</th>
                        <th>MAPE (ERROR %)</th>
                        <th>TIEMPO DE PROCESO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modelResults.map((row, idx) => {
                        const isBest = row.algoritmo === bestModelName;
                        let r2Color = "#ef4444";
                        if (row.r2 > 0.7) r2Color = "#10b981";
                        else if (row.r2 > 0.5) r2Color = "#f59e0b";

                        return (
                          <tr key={idx} className={isBest ? "best-model-row" : ""}>
                            <td className="product-name-cell">
                              {row.algoritmo} {isBest && " 🌟 (Mejor Modelo)"}
                            </td>
                            <td className="metric-r2" style={{ color: r2Color }}>
                              {(row.r2 * 100).toFixed(1)}%
                            </td>
                            <td className="metric-rmse">{row.rmse.toFixed(3)}</td>
                            <td>{row.mae.toFixed(3)}</td>
                            <td>{row.mape.toFixed(1)}%</td>
                            <td className="algo-cell">{row.timeMs.toFixed(2)} ms</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* CURVES AND CHARTS GENERATED BY BACKEND */}
            {modelResults.length > 0 && (
              <div className="charts-visual-grid">
                <div className="demand-glass-panel chart-box">
                  <h4>Matriz de Confusión (Heatmap)</h4>
                  <p className="chart-explanation">
                    Clasificación de la demanda en tres rangos (Baja, Media, Alta). Indica el acierto diagonal del modelo óptimo.
                  </p>
                  <div className="image-wrapper">
                    <img 
                      src={`${STATIC_IMG_URL}/confusion_matrix.png?v=${chartsVersion}`} 
                      alt="Matriz de Confusión" 
                      className="real-chart-img"
                    />
                  </div>
                </div>

                <div className="demand-glass-panel chart-box">
                  <h4>Curvas ROC Comparativas (Macro)</h4>
                  <p className="chart-explanation">
                    Comparativa de la tasa de verdaderos positivos contra falsos positivos para cada uno de los 5 modelos (Promedio Macro). Un AUC mayor a 0.8 indica alta especificidad.
                  </p>
                  <div className="image-wrapper">
                    <img 
                      src={`${STATIC_IMG_URL}/roc_curve.png?v=${chartsVersion}`} 
                      alt="Curva ROC" 
                      className="real-chart-img"
                    />
                  </div>
                </div>

                <div className="demand-glass-panel chart-box">
                  <h4>Comparativa de Métricas (Heatmap)</h4>
                  <p className="chart-explanation">
                    Comparación del rendimiento (R², RMSE, MAE, MAPE) de los 5 modelos. El color representa el desempeño relativo (Verde = Mejor, Rojo = Peor).
                  </p>
                  <div className="image-wrapper">
                    <img 
                      src={`${STATIC_IMG_URL}/heatmap_corr.png?v=${chartsVersion}`} 
                      alt="Mapa de Calor Comparativo de Métricas" 
                      className="real-chart-img"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PANEL 2: VALIDACIÓN CRUZADA */}
        {activeTab === "cv" && (
          <div className="tab-pane animate-fade-in">
            <div className="demand-glass-panel">
              <div className="panel-title-row flex-header-between">
                <h3>Validación Cruzada K-Fold Configurable</h3>
                <div className="cv-controls">
                  <label htmlFor="folds-slider">Folds (K): {cvFolds}</label>
                  <input 
                    id="folds-slider"
                    type="range" 
                    min="2" 
                    max="10" 
                    value={cvFolds} 
                    onChange={(e) => setCvFolds(parseInt(e.target.value))}
                    disabled={runningCv}
                  />
                  <button className="op-btn purple mini-btn" onClick={handleRunCrossValidation} disabled={runningCv}>
                    {runningCv ? "Corriendo..." : "Ejecutar"}
                  </button>
                </div>
              </div>
              <p className="panel-subtitle">
                Evalúa la estabilidad de las redes neuronales y regresores dividiendo los datos en K partes homogéneas.
              </p>

              {runningCv ? (
                <div className="table-loader-wrapper">
                  <div className="spinner"></div>
                  <span>Corriendo entrenamiento iterativo en K={cvFolds} subconjuntos del historial...</span>
                </div>
              ) : cvResults.length === 0 ? (
                <div className="empty-table-placeholder">
                  <span>Ajuste el número de folds y pulse "Ejecutar" para visualizar los puntajes promedios.</span>
                </div>
              ) : (
                <div className="demand-table-container">
                  <table className="demand-custom-table">
                    <thead>
                      <tr>
                        <th>ALGORITMO</th>
                        <th>R² PROMEDIO (MEAN)</th>
                        <th>R² DESVIACIÓN (STD)</th>
                        <th>RMSE PROMEDIO (MEAN)</th>
                        <th>RMSE DESVIACIÓN (STD)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cvResults.map((row, idx) => (
                        <tr key={idx}>
                          <td className="product-name-cell">{row.algoritmo}</td>
                          <td className="font-bold text-green">{(row.r2_mean * 100).toFixed(1)}%</td>
                          <td>{(row.r2_std * 100).toFixed(2)}%</td>
                          <td className="font-bold">{row.rmse_mean.toFixed(3)}</td>
                          <td>{row.rmse_std.toFixed(3)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PANEL 3: TUNING HIPERPARÁMETROS */}
        {activeTab === "tuning" && (
          <div className="tab-pane animate-fade-in">
            <div className="demand-glass-panel">
              <div className="panel-title-row">
                <h3>Sintonía Fina y Búsqueda en Rejilla (GridSearchCV)</h3>
              </div>
              <p className="panel-subtitle">
                Ajusta las neuronas de la red MLP y los estimadores del Bosque Aleatorio para maximizar el ajuste R².
              </p>

              {optimizing ? (
                <div className="table-loader-wrapper">
                  <div className="spinner"></div>
                  <span>Realizando GridSearch en el servidor FastAPI...</span>
                </div>
              ) : !tunedParams ? (
                <div className="empty-table-placeholder">
                  <span>Pulse "Tuning Hiperparámetros" en las opciones superiores para ver los parámetros optimizados.</span>
                </div>
              ) : (
                <div className="tuning-results-box">
                  <div className="metrics-summary-alert">
                    <h4>¡Optimización Completada!</h4>
                    <p>
                      El tuning de hiperparámetros de las Redes Neuronales reporta un RMSE óptimo estimado de: 
                      <strong> {tunedParams.best_rmse} unidades</strong>.
                    </p>
                  </div>
                  <div className="params-json-render">
                    <h5>Parámetros Ganadores Seleccionados:</h5>
                    <pre>{JSON.stringify(tunedParams.best_params, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PANEL 4: PRUEBAS ESTADÍSTICAS */}
        {activeTab === "stats" && (
          <div className="tab-pane animate-fade-in">
            <div className="demand-glass-panel">
              <div className="panel-title-row">
                <h3>Validación Estadística de Residuos (Pruebas de Hipótesis)</h3>
              </div>
              <p className="panel-subtitle">
                Evalúa si la diferencia entre los errores del modelo ganador y los demás algoritmos es estadísticamente significativa (Alpha=0.05).
              </p>

              {validating ? (
                <div className="table-loader-wrapper">
                  <div className="spinner"></div>
                  <span>Calculando p-valores de Wilcoxon y Student-T...</span>
                </div>
              ) : statTests.length === 0 ? (
                <div className="empty-table-placeholder">
                  <span>No hay análisis de significancia cargado.</span>
                </div>
              ) : (
                <div className="demand-table-container">
                  <table className="demand-custom-table">
                    <thead>
                      <tr>
                        <th>MODELO COMPARADO</th>
                        <th>PRUEBA T DE STUDENT (P-VAL)</th>
                        <th>PRUEBA WILCOXON (P-VAL)</th>
                        <th>SIGNIFICATIVO (P &lt; 0.05)</th>
                        <th>INTERPRETACIÓN CIENTÍFICA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statTests.map((row, idx) => (
                        <tr key={idx}>
                          <td className="product-name-cell">{row.comparador}</td>
                          <td>{row.t_p_value.toFixed(6)}</td>
                          <td className="font-bold">{row.wilcoxon_p_value.toFixed(6)}</td>
                          <td>
                            <span className={`sig-badge ${row.significativo ? "yes" : "no"}`}>
                              {row.significativo ? "SÍ" : "NO"}
                            </span>
                          </td>
                          <td className="italic-text">{row.interpretacion}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PANEL 5: EDA HISTÓRICO */}
        {activeTab === "eda" && (
          <div className="tab-pane animate-fade-in">
            <div className="demand-glass-panel">
              <div className="panel-title-row">
                <h3>Análisis Descriptivo Histórico de Demanda (EDA)</h3>
              </div>
              
              {loadingEda ? (
                <div className="table-loader-wrapper">
                  <div className="spinner"></div>
                  <span>Calculando descriptivos del historial de ventas...</span>
                </div>
              ) : !edaStats ? (
                <div className="empty-table-placeholder">
                  <span>No hay datos de EDA disponibles.</span>
                </div>
              ) : (
                <div className="eda-content-wrapper">
                  {/* General KPIs */}
                  <div className="eda-kpis-row">
                    <div className="eda-kpi">
                      <span className="label">Total Observaciones</span>
                      <span className="value">{edaStats.count} días</span>
                    </div>
                    <div className="eda-kpi">
                      <span className="label">Demanda Promedio</span>
                      <span className="value">{edaStats.mean} uds</span>
                    </div>
                    <div className="eda-kpi">
                      <span className="label">Volatilidad (StdDev)</span>
                      <span className="value">{edaStats.std} uds</span>
                    </div>
                    <div className="eda-kpi">
                      <span className="label">Demanda Máxima</span>
                      <span className="value">{edaStats.max} uds</span>
                    </div>
                  </div>

                  {/* Product stats table */}
                  <div className="eda-table-title">
                    <h4>Desglose Descriptivo por Producto</h4>
                  </div>
                  <div className="demand-table-container">
                    <table className="demand-custom-table">
                      <thead>
                        <tr>
                          <th>PRODUCTO</th>
                          <th>DEMANDA PROMEDIO</th>
                          <th>DESVIACIÓN ESTÁNDAR</th>
                          <th>MÍNIMO DIARIO</th>
                          <th>MÁXIMO DIARIO</th>
                        </tr>
                      </thead>
                      <tbody>
                        {edaStats.prod_stats.map((row, idx) => (
                          <tr key={idx}>
                            <td className="product-name-cell">{row.nombre}</td>
                            <td className="font-bold">{row.mean.toFixed(2)} uds</td>
                            <td>{row.std.toFixed(2)} uds</td>
                            <td>{row.min} uds</td>
                            <td className="font-bold text-purple">{row.max} uds</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Table 2: Predicciones Actuales (Próximos 7 días) */}
      <div className="demand-glass-panel">
        <div className="panel-title-row">
          <TrendingUp size={18} className="text-primary" />
          <h3>Predicciones de Demanda Sugeridas (Próximos 7 Días)</h3>
        </div>

        {generating ? (
          <div className="table-loader-wrapper">
            <div className="spinner"></div>
            <span>Generando proyecciones con el modelo óptimo...</span>
          </div>
        ) : predictions.length === 0 ? (
          <div className="empty-table-placeholder">
            <span>Presione "Generar Predicciones" para proyectar la demanda.</span>
          </div>
        ) : (
          <div className="demand-table-container scrollable-table">
            <table className="demand-custom-table">
              <thead>
                <tr>
                  <th>PRODUCTO</th>
                  <th>FECHA</th>
                  <th>DEMANDA SUGERIDA</th>
                  <th>ALGORITMO PREDICTOR</th>
                  <th>NIVEL CONFIANZA</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((row, idx) => (
                  <tr key={idx}>
                    <td className="product-name-cell">{row.nombre}</td>
                    <td className="date-cell">{row.fecha}</td>
                    <td className="demand-cell">{row.demanda} unidades</td>
                    <td className="algo-cell">{row.algoritmo}</td>
                    <td className="confidence-cell">{row.confianza.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Scoped CSS Styles */}
      <style>{`
        .flex-header-between {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          flex-wrap: wrap;
          gap: 12px;
        }

        .panel-subtitle {
          font-size: 0.85rem;
          color: #9ca3af;
          margin-top: -8px;
          margin-bottom: 16px;
        }

        .text-purple { color: #818cf8; }
        .text-green { color: #10b981; }
        .font-bold { font-weight: 700; }
        .italic-text { font-style: italic; font-size: 0.85rem; color: #9ca3af; }

        .predicts-demand-view {
          padding: 24px;
          background-color: #090d16;
          min-height: 100vh;
          font-family: 'Inter', sans-serif;
          color: #f3f4f6;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .toast-notification {
          position: fixed;
          top: 24px;
          right: 24px;
          z-index: 1100;
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: #10b981;
          color: #ffffff;
          padding: 12px 18px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.9rem;
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3);
          animation: slideInRight 0.3s ease-out;
        }

        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        .demand-header-panel {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          border-radius: 16px;
          background: rgba(30, 41, 59, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(16px);
        }

        .demand-header-left {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .demand-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .brain-emoji { font-size: 1.8rem; }

        .demand-title-row h1 {
          font-size: 1.5rem;
          font-weight: 800;
          margin: 0;
          background: linear-gradient(135deg, #ffffff 40%, #818cf8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .algorithms-badges-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .algo-badge {
          font-size: 0.75rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 20px;
        }

        .download-reports-area {
          display: flex;
          gap: 10px;
        }

        .btn-report-download {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: white;
          text-decoration: none;
          padding: 10px 16px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.88rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-report-download.pdf { background-color: #ef4444; }
        .btn-report-download.docx { background-color: #3b82f6; }
        .btn-report-download.xlsx { background-color: #10b981; }

        .btn-report-download:hover {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }

        .operations-buttons-row {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .op-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: none;
          color: #ffffff;
          padding: 10px 18px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.88rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .op-btn:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .op-btn.purple { background-color: #4f46e5; }
        .op-btn.blue { background-color: #2563eb; }
        .op-btn.dark-blue { background-color: #312e81; }
        .op-btn.yellow-blue { background-color: #0e7490; }

        .op-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pipeline-tabs-nav {
          display: flex;
          gap: 8px;
          padding: 6px;
          border-radius: 12px;
          background: rgba(30, 41, 59, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.04);
          overflow-x: auto;
        }

        .tab-nav-btn {
          flex: 1;
          min-width: 140px;
          background: transparent;
          border: none;
          color: #9ca3af;
          padding: 10px 16px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.88rem;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .tab-nav-btn:hover {
          color: white;
          background: rgba(255, 255, 255, 0.02);
        }

        .tab-nav-btn.active {
          background: #4f46e5;
          color: white;
        }

        .demand-glass-panel {
          background: rgba(30, 41, 59, 0.3);
          border-radius: 16px;
          padding: 24px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(12px);
        }

        .panel-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          padding-bottom: 12px;
        }

        .panel-title-row h3 {
          font-size: 1.15rem;
          font-weight: 700;
          margin: 0;
          color: #ffffff;
        }

        .empty-table-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 50px 20px;
          color: #9ca3af;
          font-size: 0.95rem;
          font-weight: 500;
        }

        .table-loader-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: 50px;
          color: #9ca3af;
        }

        .spinner {
          width: 36px;
          height: 36px;
          border: 3px solid rgba(99, 102, 241, 0.1);
          border-top-color: #818cf8;
          border-radius: 50%;
          animation: spin 1s infinite linear;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .demand-table-container {
          width: 100%;
          overflow-x: auto;
        }

        .scrollable-table {
          max-height: 400px;
          overflow-y: auto;
        }

        .demand-custom-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .demand-custom-table th {
          font-size: 0.75rem;
          font-weight: 700;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 14px 16px;
          background-color: rgba(255, 255, 255, 0.02);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .demand-custom-table td {
          padding: 16px;
          font-size: 0.9rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          color: #d1d5db;
        }

        .demand-custom-table tr:hover td {
          background-color: rgba(255, 255, 255, 0.02);
        }

        .best-model-row td {
          background-color: rgba(99, 102, 241, 0.08);
          color: white;
          font-weight: 600;
        }

        .product-name-cell {
          font-weight: 600;
          color: #ffffff;
        }

        .metric-r2 { font-weight: 700; }
        .metric-rmse { font-weight: 600; }
        .date-cell { color: #9ca3af; }
        .demand-cell { font-weight: 700; color: #ffffff; }
        .algo-cell { color: #9ca3af; }
        .confidence-cell { font-weight: 700; color: #10b981; }

        .charts-visual-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 20px;
          margin-top: 24px;
        }

        .chart-box h4 {
          margin: 0 0 4px 0;
          font-size: 1.05rem;
          font-weight: 700;
        }

        .chart-explanation {
          font-size: 0.8rem;
          color: #9ca3af;
          margin: 0 0 16px 0;
        }

        .image-wrapper {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          padding: 12px;
          display: flex;
          justify-content: center;
          border: 1px solid rgba(255,255,255,0.03);
        }

        .real-chart-img {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
        }

        .cv-controls {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 0.9rem;
          color: #d1d5db;
        }

        .cv-controls input[type="range"] {
          width: 100px;
          cursor: pointer;
        }

        .mini-btn {
          padding: 6px 12px;
          font-size: 0.8rem;
        }

        .tuning-results-box {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .metrics-summary-alert {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: #34d399;
          padding: 16px;
          border-radius: 8px;
        }

        .metrics-summary-alert h4 {
          margin: 0 0 6px 0;
          font-size: 1rem;
        }

        .metrics-summary-alert p {
          margin: 0;
          font-size: 0.9rem;
        }

        .params-json-render h5 {
          margin: 0 0 10px 0;
          font-size: 0.95rem;
          color: #ffffff;
        }

        .params-json-render pre {
          background: rgba(0,0,0,0.3);
          padding: 16px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.04);
          font-family: 'Courier New', Courier, monospace;
          color: #a5b4fc;
          font-size: 0.9rem;
          margin: 0;
        }

        .sig-badge {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 4px;
        }

        .sig-badge.yes { background-color: rgba(16, 185, 129, 0.15); color: #34d399; }
        .sig-badge.no { background-color: rgba(239, 68, 68, 0.15); color: #f87171; }

        .eda-kpis-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .eda-kpi {
          background: rgba(0,0,0,0.15);
          border: 1px solid rgba(255,255,255,0.04);
          border-radius: 8px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .eda-kpi .label {
          font-size: 0.75rem;
          color: #9ca3af;
          font-weight: 600;
          text-transform: uppercase;
        }

        .eda-kpi .value {
          font-size: 1.25rem;
          font-weight: 800;
          color: #ffffff;
        }

        .eda-table-title {
          margin-bottom: 12px;
        }

        .eda-table-title h4 {
          margin: 0;
          font-size: 1rem;
          font-weight: 700;
        }

        /* Animations */
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
