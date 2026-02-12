import React, { useEffect, useState } from "react";
import API from "../services/api";
import Sidebar from "../components/Sidebar";
import {
  ResponsiveContainer,
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend
} from "recharts";
import moment from "moment";
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [bins, setBins] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [hourlyWaste, setHourlyWaste] = useState([]);
  const [binUtilization, setBinUtilization] = useState([]);
  const [trend30Days, setTrend30Days] = useState([]);
  const [overflowIncidents, setOverflowIncidents] = useState([]);
  const [frequentFullBins, setFrequentFullBins] = useState([]);
  const [averageFillTime, setAverageFillTime] = useState(null);
  const [hotspotCenters, setHotspotCenters] = useState([]);
  const [binPredictions, setBinPredictions] = useState([]);
  const [binDistribution, setBinDistribution] = useState({});
  const [detectedPatterns, setDetectedPatterns] = useState([]); 

  const [loading, setLoading] = useState(true);

  const COLORS = ["#1976d2", "#ff9800", "#e91e63", "#8bc34a", "#9c27b0", "#009688", "#ff5722", "#607d8b"]; // Added more colors

  useEffect(() => {
    console.time("Dashboard Load Time");

    const loadData = async () => {
      setLoading(true);
      try {
        const bResp = await API.get("/bins");
        const rawBins = bResp || [];
        const mappedBins = rawBins.map(bin => ({
          binId: bin.bin_id,
          fillLevel: bin.current_fill_pct || 0,
          latitude: bin.latitude,
          longitude: bin.longitude,
          capacity_litres: bin.capacity_litres,
        }));
        setBins([...mappedBins].sort((a, b) => b.fillLevel - a.fillLevel).slice(0, 10).map(b => ({
          ...b,
          binId: `Bin ${b.binId.slice(-4)}`
        })));

        const aResp = await API.get("/analytics/alerts-summary");
        const alertData = aResp || {};
        setAlerts([
          { type: "Active", count: alertData.active_alerts || 0, name: "Active Alerts" },
          { type: "Resolved", count: alertData.resolved_alerts || 0, name: "Resolved Alerts" }
        ]);

        const hResp = await API.get("/analytics/hourly-waste");
        setHourlyWaste((hResp && hResp.last_7_days) || []);

        const buResp = await API.get("/analytics/bin-utilization");
        const utilizationData = buResp || {};
        setBinUtilization(Object.entries(utilizationData).map(([key, value], index) => ({
          name: key,
          value: value,
          color: COLORS[index % COLORS.length]
        })));

        const t30Resp = await API.get("/analytics/trend-30days");
        setTrend30Days((t30Resp && t30Resp.trend_30days) || []);

        const oiResp = await API.get("/analytics/overflow-incidents");
        setOverflowIncidents((oiResp && oiResp.incidents) || []);

        const ffbResp = await API.get("/analytics/frequent-full-bins");
        setFrequentFullBins((ffbResp && ffbResp.top_bins) || []);

        const aftResp = await API.get("/analytics/average-fill-time");
        setAverageFillTime(aftResp?.overall_avg_hours);

        const hsResp = await API.get("/ml/hotspots");
        setHotspotCenters((hsResp && hsResp.hotspot_centers) || []);

        const bpResp = await API.get("/ml/predictions");
        setBinPredictions((bpResp && bpResp.predictions) || []);

        const bdResp = await API.get("/analytics/bin-distribution");
        setBinDistribution(bdResp || {});

        const dpResp = await API.get("/ml/patterns");
        setDetectedPatterns((dpResp && dpResp.patterns) || []);

      } catch (error) {
        console.error("Dashboard failed to load data:", error);
      } finally {
        setLoading(false);
        console.timeEnd("Dashboard Load Time");
      }
    };
    loadData();
  }, []);

  const totalActiveAlerts = alerts.find(a => a.type === "Active")?.count || 0;
  const totalAlertsSum = alerts.reduce((acc, curr) => acc + curr.count, 0);

  if (loading) return <div className="center-page">Loading...</div>;

  if (binDistribution.total_bins === 0) {
    return (
      <div className="layout">
        <Sidebar />
        <main className="content">
          <h1>🗑️ Admin Dashboard: Operational Overview</h1>
          <div className="card empty-state">
            <h3 className="empty-state-title">🚨 No Bins Found</h3>
            <p className="empty-state-message">
              The database returned no bin records. Please check your backend database to ensure bins are registered.
            </p>
            <p className="empty-state-suggestion">
              Ensure your `fastapi` server is running and connected to a database with bin data.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="layout">
      <Sidebar />
      <main className="content">
        <h1>🗑️ Admin Dashboard: Operational Overview</h1>

        <div className="kpi-row">
          <div className="kpi-card" style={{ borderLeftColor: COLORS[0] }}>
            <div className="kpi-title">Total Bins Tracked</div>
            <div className="kpi-value">{binDistribution.total_bins || 0}</div>
          </div>
          <div className="kpi-card" style={{ borderLeftColor: COLORS[2] }}>
            <div className="kpi-title">Bins Needing Pickup</div>
            <div className="kpi-value">{binDistribution.high || 0}</div>
          </div>
          <div className="kpi-card" style={{ borderLeftColor: COLORS[1] }}>
            <div className="kpi-title">Avg Fill Time (Hours)</div>
            <div className="kpi-value">{averageFillTime !== null ? `${averageFillTime.toFixed(1)}h` : 'N/A'}</div>
          </div>
          <div className="kpi-card" style={{ borderLeftColor: COLORS[3] }}>
            <div className="kpi-title">Total Active Alerts</div>
            <div className="kpi-value">{totalActiveAlerts}</div>
          </div>
        </div>

        <div className="chart-grid">

          <div className="chart-card">
            <div className="chart-title">Top 10 Bin Fill Levels (%)</div>
            <p className="chart-description">Shows the current fill percentage for the 10 most filled bins, indicating immediate collection needs.</p>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={bins}>
                <XAxis dataKey="binId" angle={-45} textAnchor="end" height={60} interval={0} style={{ fontSize: 10 }} />
                <YAxis label={{ value: 'Fill (%)', angle: -90, position: 'insideLeft' }} domain={[0, 100]} />
                <Tooltip formatter={(value) => [`${value}%`, 'Fill Level']} />
                <CartesianGrid strokeDasharray="3 3" />
                <Bar dataKey="fillLevel" fill={COLORS[0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <div className="chart-title">Active vs. Resolved Alerts (Total: {totalAlertsSum})</div>
            <p className="chart-description">Illustrates the proportion of alerts that are currently active versus those that have been resolved, indicating operational efficiency.</p>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={alerts} dataKey="count" nameKey="type" outerRadius={80} label>
                  {alerts.map((_, i) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                <Tooltip formatter={(value, name) => [value, name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <div className="chart-title">Waste Activity by Hour (Last 7 Days)</div>
            <p className="chart-description">Shows the number of times bin fill levels increased per hour over the last week. Helps identify peak waste generation times for optimized routing.</p>
            <ResponsiveContainer width="100%" height={250}>
<BarChart data={[...hourlyWaste].sort((a, b) => a.hour - b.hour)}>                <XAxis dataKey="hour" label={{ value: 'Hour of Day (0-23)', position: 'bottom', offset: 0 }} />
                <YAxis label={{ value: 'Fill Events', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => [value, 'New Fill Events']} />
                <CartesianGrid strokeDasharray="3 3" />
                <Bar dataKey="count" fill={COLORS[3]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <div className="chart-title">Bin Utilization (Avg Fill Time)</div>
            <p className="chart-description">Classifies bins by how quickly they fill from empty to full. Helps identify bin efficiency and placement needs, showing which bins are "high-usage" vs "low-usage".</p>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={binUtilization} dataKey="value" nameKey="name" outerRadius={80} label>
                  {binUtilization.map((entry, i) => <Cell key={`cell-util-${i}`} fill={entry.color} />)}
                </Pie>
                <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                <Tooltip formatter={(value) => [`${value} Bins`, 'Category']} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card" style={{ gridColumn: 'span 2' }}>
            <div className="chart-title">Average Bin Fill Level Trend (Last 30 Days)</div>
            <p className="chart-description">Tracks the overall average fill level of all bins daily. Useful for identifying long-term waste generation trends and seasonal changes.</p>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trend30Days}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(dateStr) => moment(dateStr).format('MMM D')} />
                <YAxis label={{ value: 'Avg Fill (%)', angle: -90, position: 'insideLeft' }} domain={[0, 100]} />
                <Tooltip formatter={(value) => [`${value}%`, 'Average Fill']} />
                <Line type="monotone" dataKey="avg_fill" stroke={COLORS[4]} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <div className="chart-title">Top 10 Bins with Most Full Alerts</div>
            <p className="chart-description">Identifies bins that frequently trigger "full" alerts, indicating consistently high usage or undersized capacity in their location.</p>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={frequentFullBins}>
                <XAxis dataKey="bin_id" angle={-45} textAnchor="end" height={60} interval={0} style={{ fontSize: 10 }} />
                <YAxis label={{ value: 'Alert Count', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => [value, 'Full Alerts']} />
                <CartesianGrid strokeDasharray="3 3" />
                <Bar dataKey="alerts" fill={COLORS[5]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <div className="chart-title">Predicted Next Pickup Times </div>
            <p className="chart-description">Machine learning predictions for when each bin is estimated to reach full capacity and require pickup, based on its fill history.</p>
            <div className="table-container scrollable-table"> 
              <table className="table">
                <thead>
                  <tr>
                    <th>Bin ID</th>
                    <th>Current Fill</th>
                    <th>ETA Full</th>
                    <th>Hours Left</th>
                  </tr>
                </thead>
                <tbody>
                  {binPredictions.length > 0 ? (
                    binPredictions.map((pred, index) => (
                      <tr key={index}>
                        <td>{`Bin ${pred.bin_id.slice(-4)}`}</td>
                        <td>{pred.current_fill}%</td>
                        <td>
                          {pred.eta_iso
                            ? moment(pred.eta_iso).format('MMM D, h:mm A')
                            : pred.status === "already_full"
                              ? "Now"
                              : "N/A" 
                          }
                        </td>
                        <td>
                          {pred.hours_left !== undefined && pred.hours_left !== null
                            ? `${pred.hours_left.toFixed(1)}h`
                            : "N/A"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="no-data-message">No predictions available. Ensure enough data for ML training.</td>
                    </tr>
                  )}
                </tbody>
              </table>
              {binPredictions.length > 5 && <p className="table-footer-note">Showing {binPredictions.slice(0, 5).length} of {binPredictions.length} predictions.</p>}
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-title">Waste Hotspots </div>
            <p className="chart-description">Uses K-Means clustering to identify central geographical points that represent high-density areas of bins, potentially indicating waste generation hotspots.</p>
            <div className="table-container scrollable-table">
              <table className="table">
                <thead>
                  <tr>
                    <th>Hotspot ID</th>
                    <th>Latitude</th>
                    <th>Longitude</th>
                  </tr>
                </thead>
                <tbody>
                  {hotspotCenters.length > 0 ? (
                    hotspotCenters.map((center, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{center.latitude.toFixed(4)}</td>
                        <td>{center.longitude.toFixed(4)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="no-data-message">No hotspots identified.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-title">Recent Overflow Incidents</div>
            <p className="chart-description">Lists recent instances where bins have exceeded or reached 100% fill level, highlighting critical issues that need immediate attention. (Showing last 5)</p>
            <div className="table-container scrollable-table">
              <table className="table">
                <thead>
                  <tr>
                    <th>Bin ID</th>
                    <th>Timestamp</th>
                    <th>Fill %</th>
                  </tr>
                </thead>
                <tbody>
                  {overflowIncidents.length > 0 ? (
                    overflowIncidents.slice(0, 5).map((incident, index) => ( 
                      <tr key={index}>
                        <td>{`Bin ${incident.bin_id.slice(-4)}`}</td>
                        <td>{moment(incident.timestamp).format('MMM D, h:mm A')}</td>
                        <td>{incident.fill_pct}%</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="no-data-message">No overflow incidents recorded.</td>
                    </tr>
                  )}
                </tbody>
              </table>
              {overflowIncidents.length > 5 && <p className="table-footer-note">Showing {overflowIncidents.slice(0, 5).length} of {overflowIncidents.length} incidents.</p>}
            </div>
          </div>

          <div className="chart-card" style={{ gridColumn: 'span 1' }}>
            <div className="chart-title">Detected Bin Patterns </div>
            <p className="chart-description">Identifies general patterns in bin usage based on historical fill data, helping categorize bins for strategic planning. (Showing 5 examples)</p>
            <div className="table-container scrollable-table">
              <table className="table">
                <thead>
                  <tr>
                    <th>Pattern Type</th>
                    <th>Bin IDs (Examples)</th>
                    <th>Insight</th>
                  </tr>
                </thead>
                <tbody>
                  {detectedPatterns.length > 0 ? (
                    detectedPatterns.slice(0, 5).map((pattern, index) => (
                      <tr key={index}>
                        <td>{pattern.type.replace(/_/g, ' ')}</td>
                        <td>
                          {pattern.bin_ids.slice(0, 3).map(id => `Bin ${id.slice(-4)}`).join(', ')}
                          {pattern.bin_ids.length > 3 && ` (+${pattern.bin_ids.length - 3} more)`}
                        </td>
                        <td>{pattern.insight}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="no-data-message">No specific patterns detected.</td>
                    </tr>
                  )}
                </tbody>
              </table>
              {detectedPatterns.length > 5 && <p className="table-footer-note">Showing {detectedPatterns.slice(0, 5).length} of {detectedPatterns.length} patterns.</p>}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}