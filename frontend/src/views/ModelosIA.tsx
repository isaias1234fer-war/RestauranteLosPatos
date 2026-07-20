import React, { useState, useEffect } from "react";
import { 
  TrendingUp, 
  Zap, 
  BarChart3, 
  Target, 
  CheckCircle, 
  Info, 
  ChevronDown, 
  ChevronRight, 
  Download
} from "lucide-react";

export const ModelosIA: React.FC = () => {
  const [expandedClassic, setExpandedClassic] = useState(true);
  const [expandedHybrid, setExpandedHybrid] = useState(true);
  const [expandedPurpose, setExpandedPurpose] = useState(true);

  return (
    <div className="modelos-ia-container">
      <div className="page-header">
        <div className="header-title">
          <TrendingUp size={32} style={{ color: "var(--accent-primary)" }} />
          <div>
            <h1>🤖 Modelos de Inteligencia Artificial</h1>
            <p>Descripción detallada de los modelos implementados para la predicción de demanda</p>
          </div>
        </div>
      </div>

      <div className="content-grid">
        {/* Propósito de los modelos */}
        <div className="card purpose-card">
          <div className="card-header" onClick={() => setExpandedPurpose(!expandedPurpose)} style={{ cursor: "pointer" }}>
            <div className="card-title">
              <Target size={20} />
              <h2>🎯 Propósito de los modelos</h2>
            </div>
            {expandedPurpose ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>
          {expandedPurpose && (
            <div className="card-content">
              <div className="purpose-box">
                <p style={{ fontSize: "1.1rem", fontWeight: 500, marginBottom: "16px" }}>
                  Pronosticar la demanda diaria de cada producto para optimizar las compras de insumos y reducir las mermas alimentarias.
                </p>
                <div className="benefits-grid">
                  <div className="benefit-item">
                    <CheckCircle size={24} style={{ color: "var(--success)" }} />
                    <div>
                      <h3>Optimización de compras</h3>
                      <p>Reduce los insumos comprados innecesariamente</p>
                    </div>
                  </div>
                  <div className="benefit-item">
                    <CheckCircle size={24} style={{ color: "var(--success)" }} />
                    <div>
                      <h3>Reducción de mermas</h3>
                      <p>Minimiza el desperdicio de alimentos</p>
                    </div>
                  </div>
                  <div className="benefit-item">
                    <CheckCircle size={24} style={{ color: "var(--success)" }} />
                    <div>
                      <h3>Mejora de rentabilidad</h3>
                      <p>Aumenta la rentabilidad del restaurante</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modelos Clásicos */}
        <div className="card models-card">
          <div className="card-header" onClick={() => setExpandedClassic(!expandedClassic)} style={{ cursor: "pointer" }}>
            <div className="card-title">
              <Zap size={20} />
              <h2>📌 Modelos Clásicos (3)</h2>
            </div>
            {expandedClassic ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>
          {expandedClassic && (
            <div className="card-content">
              <div className="model-item">
                <div className="model-icon" style={{ background: "#e0f2fe", color: "#0369a1" }}>1</div>
                <div className="model-details">
                  <h3>Regresión Lineal</h3>
                  <p>Modelo base para entender la relación lineal entre variables (precio, día de la semana, mes, fin de semana) y la demanda.</p>
                </div>
              </div>
              <div className="model-item">
                <div className="model-icon" style={{ background: "#f0fdf4", color: "#15803d" }}>2</div>
                <div className="model-details">
                  <h3>Random Forest</h3>
                  <p>Ensamble de árboles de decisión que captura relaciones no lineales complejas entre las variables.</p>
                </div>
              </div>
              <div className="model-item">
                <div className="model-icon" style={{ background: "#faf5ff", color: "#7c3aed" }}>3</div>
                <div className="model-details">
                  <h3>Red Neuronal MLP</h3>
                  <p>Perceptrón Multicapa con 2 capas ocultas, que aprende patrones complejos en los datos históricos de ventas.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modelos Híbridos */}
        <div className="card models-card">
          <div className="card-header" onClick={() => setExpandedHybrid(!expandedHybrid)} style={{ cursor: "pointer" }}>
            <div className="card-title">
              <BarChart3 size={20} />
              <h2>📌 Modelos Híbridos (2)</h2>
            </div>
            {expandedHybrid ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>
          {expandedHybrid && (
            <div className="card-content">
              <div className="model-item">
                <div className="model-icon" style={{ background: "#fffbeb", color: "#b45309" }}>1</div>
                <div className="model-details">
                  <h3>Híbrido Lineal-MLP</h3>
                  <ul style={{ marginTop: "8px", paddingLeft: "20px", color: "var(--text-muted)" }}>
                    <li>Paso 1: La regresión lineal captura la tendencia principal de la demanda.</li>
                    <li>Paso 2: El MLP se entrena sobre los residuos (errores) de la regresión lineal para corregir las predicciones.</li>
                    <li>Paso 3: La predicción final es la suma de la predicción de la regresión lineal y la predicción del MLP sobre los residuos.</li>
                  </ul>
                </div>
              </div>
              <div className="model-item">
                <div className="model-icon" style={{ background: "#fdf2f8", color: "#be185d" }}>2</div>
                <div className="model-details">
                  <h3>Híbrido Stacking</h3>
                  <ul style={{ marginTop: "8px", paddingLeft: "20px", color: "var(--text-muted)" }}>
                    <li><strong>Modelos base:</strong> Random Forest y MLP (generan predicciones individuales).</li>
                    <li><strong>Meta-modelo:</strong> Ridge Regression (combina las predicciones de los modelos base para generar la predicción final).</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cómo interactuar con los modelos */}
        <div className="card info-card">
          <div className="card-header">
            <div className="card-title">
              <Info size={20} />
              <h2>📱 Cómo interactuar con los modelos</h2>
            </div>
          </div>
          <div className="card-content">
            <ol className="steps-list">
              <li>
                <strong>Ve a la sección "Predicciones Ventas"</strong>
                <p>En el menú lateral, haz clic en "Predicciones Ventas" para acceder a la interfaz de pronósticos.</p>
              </li>
              <li>
                <strong>Compara los modelos</strong>
                <p>Haz clic en el botón "Comparar 5 Modelos (Servidor)" para ver los resultados de todos los modelos.</p>
              </li>
              <li>
                <strong>Genera predicciones</strong>
                <p>Selecciona un producto y el número de días para generar pronósticos de demanda.</p>
              </li>
              <li>
                <strong>Descarga reportes</strong>
                <p>Descarga reportes en PDF, Word o Excel con los resultados de los modelos.</p>
              </li>
            </ol>
          </div>
        </div>
      </div>

      <style>{`
        .modelos-ia-container {
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .page-header {
          margin-bottom: 32px;
        }

        .header-title {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .header-title h1 {
          margin: 0 0 4px 0;
          font-size: 1.75rem;
          font-weight: 700;
          background: linear-gradient(135deg, var(--text-highlight) 0%, var(--accent-primary) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .header-title p {
          margin: 0;
          color: var(--text-muted);
        }

        .content-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 24px;
        }

        .card {
          background: white;
          border-radius: 12px;
          border: 1px solid var(--card-border);
          box-shadow: var(--shadow-soft);
          overflow: hidden;
        }

        .card-header {
          padding: 16px 20px;
          border-bottom: 1px solid var(--card-border);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(135deg, rgba(249, 250, 251, 1) 0%, rgba(243, 244, 246, 1) 100%);
        }

        .card-title {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .card-title h2 {
          margin: 0;
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--text-highlight);
        }

        .card-content {
          padding: 20px;
        }

        .purpose-box {
          background: var(--accent-primary-glow);
          padding: 20px;
          border-radius: 12px;
          border: 1px solid var(--accent-primary);
        }

        .benefits-grid {
          display: grid;
          gap: 16px;
          margin-top: 20px;
        }

        .benefit-item {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }

        .benefit-item h3 {
          margin: 0 0 4px 0;
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-highlight);
        }

        .benefit-item p {
          margin: 0;
          font-size: 0.875rem;
          color: var(--text-muted);
        }

        .model-item {
          display: flex;
          gap: 16px;
          align-items: flex-start;
          padding: 16px 0;
          border-bottom: 1px solid rgba(0,0,0,0.05);
        }

        .model-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .model-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1rem;
          flex-shrink: 0;
        }

        .model-details h3 {
          margin: 0 0 4px 0;
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-highlight);
        }

        .model-details p, .model-details li {
          margin: 0;
          font-size: 0.875rem;
          color: var(--text-muted);
        }

        .steps-list {
          padding-left: 24px;
          margin: 0;
          display: grid;
          gap: 20px;
        }

        .steps-list li {
          font-size: 0.875rem;
        }

        .steps-list li strong {
          color: var(--text-highlight);
          font-size: 1rem;
        }

        .steps-list p {
          margin: 4px 0 0 0;
          color: var(--text-muted);
        }

        .purpose-card, .info-card {
          grid-column: 1 / -1;
        }
      `}</style>
    </div>
  );
};

export default ModelosIA;
