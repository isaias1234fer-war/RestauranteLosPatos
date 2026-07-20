import React, { useState, useEffect } from "react";
import { api } from "../api";
import type { KpisResponse } from "../api";
import { BarChart3, Calendar, RefreshCcw, FileDown, TrendingUp, Pizza, DollarSign } from "lucide-react";

interface DonutChartProps {
  data: { label: string; value: number }[];
}

const DonutChart: React.FC<DonutChartProps> = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0 || data.length === 0) {
    return <div className="no-chart-data">Sin datos de ventas para este año.</div>;
  }

  const colors = [
    "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
    "#ec4899", "#14b8a6", "#6366f1", "#f97316", "#84cc16",
    "#06b6d4", "#a855f7"
  ];

  const CIRCUMFERENCE = 251.327;
  let accumulatedPercentage = 0;

  return (
    <div className="donut-chart-wrapper">
      <div className="donut-svg-container">
        <svg viewBox="0 0 100 100" className="donut-svg">
          <circle cx="50" cy="50" r="40" fill="transparent" stroke="rgba(226, 232, 240, 0.2)" strokeWidth="8" />
          {data.map((item, idx) => {
            const percentage = (item.value / total) * 100;
            const strokeLength = (percentage / 100) * CIRCUMFERENCE;
            const strokeOffset = (accumulatedPercentage / 100) * CIRCUMFERENCE;
            accumulatedPercentage += percentage;
            const strokeColor = colors[idx % colors.length];

            return (
              <circle
                key={idx}
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke={strokeColor}
                strokeWidth="10"
                strokeDasharray={`${strokeLength} ${CIRCUMFERENCE}`}
                strokeDashoffset={-strokeOffset}
                transform="rotate(-90 50 50)"
                className="donut-segment"
              >
                <title>{`${item.label}: $${item.value.toFixed(2)} (${percentage.toFixed(1)}%)`}</title>
              </circle>
            );
          })}
          <g className="donut-text">
            <text x="50" y="47" className="donut-total-title">Total Año</text>
            <text x="50" y="58" className="donut-total-val">${total.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</text>
          </g>
        </svg>
      </div>

      <div className="donut-legend">
        {data.map((item, idx) => {
          const percentage = (item.value / total) * 100;
          return (
            <div key={idx} className="legend-item">
              <span className="legend-dot" style={{ backgroundColor: colors[idx % colors.length] }}></span>
              <span className="legend-label">{item.label}</span>
              <span className="legend-val">${item.value.toFixed(2)} ({percentage.toFixed(1)}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const Analitica: React.FC = () => {
  const [filters, setFilters] = useState<{ years: number[]; months: string[] }>({ years: [], months: [] });
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  const [kpis, setKpis] = useState<KpisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [chartYear, setChartYear] = useState<string>("");
  const [chartData, setChartData] = useState<{ mes: string; total: number }[]>([]);
  const [chartLoading, setChartLoading] = useState(false);

  const [categoryYear, setCategoryYear] = useState<string>("");
  const [categoryChartData, setCategoryChartData] = useState<{ categoria: string; total: number }[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(false);

  const loadFilters = async () => {
    try {
      const data = await api.analitica.getFiltros();
      setFilters(data);
    } catch (err) {
      console.error("No se pudieron cargar los filtros de analítica");
    }
  };

  const loadKpis = async () => {
    setLoading(true);
    setError("");
    try {
      const y = selectedYear ? parseInt(selectedYear) : undefined;
      const m = selectedMonth || undefined;
      const data = await api.analitica.getKpis(y, m);
      setKpis(data);
    } catch (err: any) {
      setError("Error al cargar KPIs analíticos. Intente sincronizar el Data Warehouse.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFilters();
  }, []);

  useEffect(() => {
    loadKpis();
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    if (filters.years && filters.years.length > 0) {
      setChartYear(filters.years[0].toString());
    }
  }, [filters]);

  useEffect(() => {
    if (!chartYear) return;
    const loadChartData = async () => {
      setChartLoading(true);
      try {
        const data = await api.analitica.getKpis(parseInt(chartYear), undefined);
        setChartData(data.ventas_por_mes || []);
      } catch (err) {
        console.error("Error al cargar ventas mensuales para el gráfico circular", err);
      } finally {
        setChartLoading(false);
      }
    };
    loadChartData();
  }, [chartYear]);

  useEffect(() => {
    if (filters.years && filters.years.length > 0) {
      setCategoryYear(filters.years[0].toString());
    }
  }, [filters]);

  useEffect(() => {
    if (!categoryYear) return;
    const loadCategoryData = async () => {
      setCategoryLoading(true);
      try {
        const data = await api.analitica.getKpis(parseInt(categoryYear), undefined);
        setCategoryChartData(data.ventas_por_categoria || []);
      } catch (err) {
        console.error("Error al cargar ventas por categoría para el gráfico circular", err);
      } finally {
        setCategoryLoading(false);
      }
    };
    loadCategoryData();
  }, [categoryYear]);

  const handleSync = async () => {
    setSyncing(true);
    setMessage("");
    setError("");
    try {
      const res = await api.analitica.sync();
      setMessage(res.message || "¡Sincronización de Data Warehouse exitosa!");
      loadFilters();
      loadKpis();
    } catch (err: any) {
      setError(err.message || "Error al sincronizar el Data Warehouse");
    } finally {
      setSyncing(false);
    }
  };

  const handleDownloadPdf = () => {
    let params = [];
    if (selectedYear) params.push(`year=${selectedYear}`);
    if (selectedMonth) params.push(`month=${encodeURIComponent(selectedMonth)}`);
    const query = params.length ? `?${params.join("&")}` : "";
    window.open(`http://${window.location.hostname}:8000/api/analitica/reporte_pdf${query}`, "_blank");
  };

  const drawChart = (data: { label: string; value: number }[]) => {
    if (!data || data.length === 0) {
      return <div className="no-chart-data">Sin datos disponibles.</div>;
    }

    const maxVal = Math.max(...data.map((d) => d.value), 1);

    return (
      <div className="chart-container">
        {data.map((item, idx) => {
          const percent = (item.value / maxVal) * 100;
          return (
            <div key={idx} className="chart-row">
              <div className="chart-label" title={item.label}>
                {item.label || "N/A"}
              </div>
              <div className="chart-bar-wrapper">
                <div
                  className="chart-bar"
                  style={{
                    width: `${Math.max(percent, 2)}%`,
                    background: `linear-gradient(90deg, var(--accent-primary) 0%, rgba(59, 130, 246, 0.4) 100%)`
                  }}
                >
                  <span className="chart-bar-value">${item.value.toFixed(2)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const drawLineChart = (data: { label: string; value: number }[]) => {
    if (!data || data.length === 0) {
      return <div className="no-chart-data">Sin datos de ventas disponibles.</div>;
    }

    const chartWidth = 800;
    const chartHeight = 320;
    const paddingLeft = 65;
    const paddingRight = 30;
    const paddingTop = 25;
    const paddingBottom = 45;

    const innerWidth = chartWidth - paddingLeft - paddingRight;
    const innerHeight = chartHeight - paddingTop - paddingBottom;

    const values = data.map(d => d.value);
    const maxVal = Math.max(...values, 100) * 1.15;
    const minVal = 0;

    const getX = (index: number) => {
      if (data.length <= 1) return paddingLeft + innerWidth / 2;
      return paddingLeft + (index / (data.length - 1)) * innerWidth;
    };

    const getY = (value: number) => {
      return paddingTop + innerHeight - ((value - minVal) / (maxVal - minVal)) * innerHeight;
    };

    // Generate path points
    const points = data.map((d, i) => ({ x: getX(i), y: getY(d.value) }));
    const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    
    // Gradient area path
    const areaPath = points.length > 0 
      ? `${linePath} L ${points[points.length - 1].x} ${paddingTop + innerHeight} L ${points[0].x} ${paddingTop + innerHeight} Z`
      : "";

    return (
      <div className="svg-container sales-trend-container">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="line-chart-svg" style={{ width: "100%", height: "auto" }}>
          <defs>
            <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {/* Horizontal grid lines */}
          {Array.from({ length: 5 }, (_, i) => {
            const yVal = minVal + (maxVal - minVal) * (i / 4);
            const yPos = getY(yVal);
            return (
              <g key={i}>
                <line 
                  x1={paddingLeft} 
                  y1={yPos} 
                  x2={chartWidth - paddingRight} 
                  y2={yPos} 
                  stroke="rgba(0,0,0,0.06)" 
                  strokeDasharray="4 4"
                  strokeWidth="1" 
                />
                <text 
                  x={paddingLeft - 8} 
                  y={yPos + 4} 
                  textAnchor="end" 
                  fontSize="10" 
                  fill="#64748b" 
                  fontWeight="600"
                >
                  ${yVal.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* Gradient Area under line */}
          {areaPath && (
            <path d={areaPath} fill="url(#salesGrad)" />
          )}

          {/* The trend line */}
          {linePath && (
            <path 
              d={linePath} 
              fill="none" 
              stroke="var(--accent-primary)" 
              strokeWidth="3.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
          )}

          {/* Dots and values */}
          {points.map((p, i) => (
            <g key={i} className="chart-dot-group">
              <circle 
                cx={p.x} 
                cy={p.y} 
                r="5" 
                fill="var(--accent-primary)" 
                stroke="#ffffff" 
                strokeWidth="2" 
                style={{ cursor: "pointer", transition: "all 0.2s" }}
              />
              <text
                x={p.x}
                y={p.y - 12}
                textAnchor="middle"
                fontSize="10"
                fill="var(--text-highlight)"
                fontWeight="700"
                className="dot-value"
              >
                ${data[i].value.toFixed(1)}
              </text>
            </g>
          ))}

          {/* X axis labels (filtered to avoid overlapping if there are many items) */}
          {data.map((d, i) => {
            const isDaily = data.length > 20;
            // Only show labels for every 2nd day if daily, to avoid crowding
            const showLabel = !isDaily || i % 2 === 0 || i === data.length - 1;
            if (!showLabel) return null;
            return (
              <text 
                key={i}
                x={getX(i)} 
                y={chartHeight - paddingBottom + 20} 
                textAnchor="middle" 
                fontSize="10" 
                fill="#64748b" 
                fontWeight="600"
              >
                {d.label}
              </text>
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div className="animate-fade-in view-layout">
      <div className="view-header">
        <div>
          <h1 className="page-title">Executive Analytics</h1>
          <p className="page-subtitle">Inteligencia de Negocios y análisis OLAP del restaurante Los Patos</p>
        </div>
        <div className="view-actions">
          <button className="btn btn-secondary" onClick={handleSync} disabled={syncing}>
            <RefreshCcw size={16} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Sincronizando..." : "Sincronizar DW"}
          </button>
          <button className="btn btn-primary" onClick={handleDownloadPdf} disabled={loading || !kpis}>
            <FileDown size={16} />
            Descargar Reporte PDF
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {message && <div className="success-banner">{message}</div>}

      {/* Filter Panel */}
      <div className="filter-panel glass-panel">
        <div className="filter-title">
          <Calendar size={16} className="text-primary" />
          <span>Filtros Temporales</span>
        </div>
        <div className="filter-selectors">
          <div className="form-group flex-row">
            <label className="form-label inline-label">Año:</label>
            <select
              className="input-field select-field select-filter"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="">Todos los Años</option>
              {filters.years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="form-group flex-row">
            <label className="form-label inline-label">Mes:</label>
            <select
              className="input-field select-field select-filter"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="">Todos los Meses</option>
              {filters.months.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <span>Cargando reportes OLAP...</span>
        </div>
      ) : !kpis ? (
        <div className="empty-container glass-panel">
          <BarChart3 size={48} className="empty-icon" />
          <h3>No hay datos en el Data Warehouse</h3>
          <p>Por favor sincronice el Data Warehouse para construir las dimensiones y hechos analíticos.</p>
        </div>
      ) : (
        <>
          {/* KPI Cards Grid */}
          <div className="kpis-grid">
            <div className="glass-card kpi-card">
              <div className="kpi-icon-wrapper kpi-icon-primary">
                <DollarSign size={24} />
              </div>
              <div className="kpi-info">
                <span className="kpi-title">Ingresos Totales (DW)</span>
                <span className="kpi-value">${kpis.total_ingresos.toFixed(2)}</span>
                <span className="kpi-meta text-success">
                  <TrendingUp size={12} style={{ marginRight: 4 }} /> +12.4% vs mes anterior
                </span>
              </div>
            </div>

            <div className="glass-card kpi-card">
              <div className="kpi-icon-wrapper kpi-icon-success">
                <Pizza size={24} />
              </div>
              <div className="kpi-info">
                <span className="kpi-title">Platos Vendidos (DW)</span>
                <span className="kpi-value">{kpis.total_platos}</span>
                <span className="kpi-meta">Unidades registradas en el periodo</span>
              </div>
            </div>
          </div>

          {/* General Sales Trend Line Chart */}
          {(() => {
            const hasYear = !!selectedYear;
            const hasMonth = !!selectedMonth;
            
            let chartDataPoints: { label: string; value: number }[] = [];
            let chartSubtitle = "Evolución mensual consolidada";
            
            if (hasYear && hasMonth) {
              chartDataPoints = (kpis.ventas_por_dia || []).map((item) => ({
                label: `${item.dia}`,
                value: item.total,
              }));
              chartSubtitle = `Ventas diarias de ${selectedMonth} de ${selectedYear}`;
            } else if (hasYear) {
              chartDataPoints = kpis.ventas_por_mes.map((item) => ({
                label: item.mes,
                value: item.total,
              }));
              chartSubtitle = `Ventas mensuales del año ${selectedYear}`;
            } else {
              if (kpis.ventas_por_anio && kpis.ventas_por_anio.length > 0) {
                chartDataPoints = kpis.ventas_por_anio.map((item) => ({
                  label: `${item.anio}`,
                  value: item.total,
                }));
                chartSubtitle = "Ventas anuales consolidadas";
              } else {
                chartDataPoints = kpis.ventas_por_mes.map((item) => ({
                  label: item.mes,
                  value: item.total,
                }));
                chartSubtitle = "Evolución mensual consolidada";
              }
            }

            return (
              <div className="glass-panel chart-card full-width-chart sales-trend-card">
                <div className="chart-header flex-header">
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <TrendingUp size={20} className="text-primary" />
                    <h3 style={{ margin: 0 }}>Histórico de Ventas en General</h3>
                  </div>
                  <span className="text-muted text-sm font-medium" style={{ fontSize: "0.85rem" }}>
                    {chartSubtitle}
                  </span>
                </div>
                {drawLineChart(chartDataPoints)}
              </div>
            );
          })()}

          {/* Charts Layout */}
          <div className="charts-grid">
            <div className="glass-panel chart-card">
              <div className="chart-header flex-header">
                <h3>Ventas por Categoría</h3>
                <div className="chart-selector-wrapper">
                  <label className="chart-select-label">Año:</label>
                  <select
                    className="input-field select-field chart-select-input"
                    value={categoryYear}
                    onChange={(e) => setCategoryYear(e.target.value)}
                  >
                    {filters.years.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {categoryLoading ? (
                <div className="chart-sub-loader">
                  <div className="spinner-sm"></div>
                  <span>Cargando gráfico...</span>
                </div>
              ) : (
                <DonutChart data={categoryChartData.map(d => ({ label: d.categoria, value: d.total }))} />
              )}
            </div>

            {/* Circular Chart: Ventas por Mes */}
            <div className="glass-panel chart-card">
              <div className="chart-header flex-header">
                <h3>Distribución de Ventas por Mes</h3>
                <div className="chart-selector-wrapper">
                  <label className="chart-select-label">Año:</label>
                  <select
                    className="input-field select-field chart-select-input"
                    value={chartYear}
                    onChange={(e) => setChartYear(e.target.value)}
                  >
                    {filters.years.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {chartLoading ? (
                <div className="chart-sub-loader">
                  <div className="spinner-sm"></div>
                  <span>Cargando gráfico...</span>
                </div>
              ) : (
                <DonutChart data={chartData.map(d => ({ label: d.mes, value: d.total }))} />
              )}
            </div>
          </div>

          <div className="glass-panel chart-card full-width-chart">
            <div className="chart-header">
              <h3>Platos Más Vendidos (Top Productos)</h3>
            </div>
            <div className="table-responsive">
              <table className="top-products-table">
                <thead>
                  <tr>
                    <th style={{ width: "80px" }}>Puesto</th>
                    <th>Producto / Plato</th>
                    <th>Ventas Totales</th>
                    <th>Participación de Mercado</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const sortedProducts = [...kpis.ventas_por_producto].sort((a, b) => b.total - a.total);
                    const totalProductsSales = sortedProducts.reduce((sum, item) => sum + item.total, 0);
                    
                    return sortedProducts.map((item, idx) => {
                      const pct = totalProductsSales > 0 ? (item.total / totalProductsSales) * 100 : 0;
                      return (
                        <tr key={idx}>
                          <td>
                            <span className={`rank-badge rank-${idx + 1}`}>#{idx + 1}</span>
                          </td>
                          <td className="product-name">{item.producto}</td>
                          <td className="product-sales">${item.total.toFixed(2)}</td>
                          <td>
                            <div className="table-progress-container">
                              <div className="table-progress-bar-wrapper">
                                <div className="table-progress-bar" style={{ width: `${pct}%` }}></div>
                              </div>
                              <span className="table-progress-text">{pct.toFixed(1)}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass-panel chart-card full-width-chart">
            <div className="chart-header">
              <h3>Rendimiento de Meseros</h3>
            </div>
            {drawChart(
              kpis.ventas_por_empleado.map((item) => ({
                label: item.empleado,
                value: item.total,
              }))
            )}
          </div>

          <div className="glass-panel chart-card full-width-chart">
            <div className="chart-header">
              <h3>Mejores Clientes</h3>
            </div>
            {drawChart(
              [...(kpis.ventas_por_cliente || [])]
                .sort((a, b) => b.total - a.total)
                .slice(0, 5)
                .map((item) => ({
                  label: item.cliente,
                  value: item.total,
                }))
            )}
          </div>
        </>
      )}

      <style>{`
        .view-layout {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .view-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--card-border);
          padding-bottom: 20px;
        }

        .view-actions {
          display: flex;
          gap: 12px;
        }

        .page-subtitle {
          color: var(--text-muted);
          margin-top: 4px;
          font-size: 0.95rem;
        }

        .filter-panel {
          padding: 16px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        @media (max-width: 768px) {
          .filter-panel {
            flex-direction: column;
            align-items: flex-start;
          }
        }

        .filter-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          color: var(--text-highlight);
        }

        .filter-selectors {
          display: flex;
          gap: 20px;
        }

        .flex-row {
          flex-direction: row !important;
          align-items: center;
          gap: 10px;
          margin-bottom: 0 !important;
        }

        .inline-label {
          white-space: nowrap;
        }

        .select-filter {
          width: 160px;
          padding: 8px 12px;
        }

        .kpis-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        @media (max-width: 600px) {
          .kpis-grid {
            grid-template-columns: 1fr;
          }
        }

        .kpi-card {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 24px;
        }

        .kpi-icon-wrapper {
          width: 54px;
          height: 54px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .kpi-icon-primary {
          background: var(--accent-primary-glow);
          color: var(--accent-primary);
        }

        .kpi-icon-success {
          background: var(--accent-success-glow);
          color: var(--accent-success);
        }

        .kpi-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .kpi-title {
          font-size: 0.85rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        .kpi-value {
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--text-highlight);
        }

        .kpi-meta {
          font-size: 0.75rem;
          color: var(--text-muted);
          display: flex;
          align-items: center;
        }

        .charts-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        @media (max-width: 900px) {
          .charts-grid {
            grid-template-columns: 1fr;
          }
        }

        .chart-card {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .chart-header {
          border-bottom: 1px solid var(--card-border);
          padding-bottom: 12px;
        }

        .chart-header h3 {
          font-size: 1.1rem;
        }

        .chart-container {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .chart-row {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .chart-label {
          width: 140px;
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--text-muted);
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: nowrap;
        }

        .chart-bar-wrapper {
          flex-grow: 1;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 4px;
          height: 24px;
          overflow: hidden;
        }

        .chart-bar {
          height: 100%;
          border-radius: 4px;
          display: flex;
          align-items: center;
          padding-left: 10px;
          transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .chart-bar-value {
          font-size: 0.75rem;
          font-weight: 700;
          color: white;
        }

        .no-chart-data {
          font-style: italic;
          color: var(--text-muted);
          font-size: 0.9rem;
          text-align: center;
          padding: 40px 0;
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }



        .flex-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }

        .chart-selector-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .chart-select-label {
          font-size: 0.85rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        .chart-select-input {
          width: 100px;
          padding: 4px 8px;
          font-size: 0.85rem;
          background: transparent;
          border: 1px solid var(--card-border);
          border-radius: 6px;
          color: var(--text-highlight);
          cursor: pointer;
        }

        .donut-chart-wrapper {
          display: flex;
          align-items: center;
          justify-content: space-around;
          gap: 30px;
          padding: 10px 0;
        }

        @media (max-width: 768px) {
          .donut-chart-wrapper {
            flex-direction: column;
          }
        }

        .donut-svg-container {
          width: 220px;
          height: 220px;
          position: relative;
        }

        .donut-svg {
          width: 100%;
          height: 100%;
        }

        .donut-segment {
          transition: stroke-width 0.3s, filter 0.3s;
          cursor: pointer;
        }

        .donut-segment:hover {
          stroke-width: 12;
          filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.15));
        }

        .donut-text {
          pointer-events: none;
        }

        .donut-total-title {
          font-size: 7px;
          fill: var(--text-muted);
          text-anchor: middle;
          font-weight: 600;
        }

        .donut-total-val {
          font-size: 7.5px;
          fill: var(--text-highlight);
          text-anchor: middle;
          font-weight: 800;
        }

        .donut-legend {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 220px;
          overflow-y: auto;
          flex: 1;
          padding-right: 10px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.88rem;
        }

        .legend-dot {
          width: 12px;
          height: 12px;
          border-radius: 3px;
          flex-shrink: 0;
        }

        .legend-label {
          color: var(--text-muted);
          font-weight: 500;
          min-width: 90px;
        }

        .legend-val {
          color: var(--text-highlight);
          font-weight: 700;
          margin-left: auto;
        }

        .chart-sub-loader {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 0;
          gap: 12px;
          color: var(--text-muted);
        }

        .spinner-sm {
          width: 30px;
          height: 30px;
          border: 3px solid rgba(59, 130, 246, 0.1);
          border-top-color: var(--accent-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .sales-trend-card {
          margin-bottom: 8px;
        }

        .chart-dot-group circle:hover {
          r: 7px !important;
          fill: #fb923c !important;
        }

        .dot-value {
          opacity: 0;
          transition: opacity 0.2s ease;
          pointer-events: none;
        }

        .chart-dot-group:hover .dot-value {
          opacity: 1;
        }

        /* Top Products Table Styles */
        .top-products-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .top-products-table th {
          padding: 12px 16px;
          color: var(--text-muted);
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          border-bottom: 1px solid var(--card-border);
        }

        .top-products-table td {
          padding: 14px 16px;
          border-bottom: 1px solid var(--card-border);
          font-size: 0.9rem;
          color: var(--text-muted);
          vertical-align: middle;
        }

        .top-products-table tr:hover td {
          background: rgba(255, 255, 255, 0.015);
        }

        .rank-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-muted);
          background: rgba(255, 255, 255, 0.05);
        }

        .rank-1 {
          background: #fef3c7;
          color: #d97706;
          border: 1px solid rgba(217, 119, 6, 0.2);
        }

        .rank-2 {
          background: #f1f5f9;
          color: #475569;
          border: 1px solid rgba(71, 85, 105, 0.2);
        }

        .rank-3 {
          background: #ffedd5;
          color: #ea580c;
          border: 1px solid rgba(234, 88, 12, 0.2);
        }

        .product-name {
          font-weight: 600;
          color: var(--text-highlight);
        }

        .product-sales {
          font-weight: 700;
          color: var(--accent-primary);
        }

        .table-progress-container {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .table-progress-bar-wrapper {
          flex-grow: 1;
          height: 8px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
          max-width: 200px;
          overflow: hidden;
        }

        .table-progress-bar {
          height: 100%;
          background: linear-gradient(90deg, var(--accent-primary) 0%, rgba(59, 130, 246, 0.5) 100%);
          border-radius: 4px;
        }

        .table-progress-text {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-muted);
          min-width: 45px;
        }
      `}</style>
    </div>
  );
};
