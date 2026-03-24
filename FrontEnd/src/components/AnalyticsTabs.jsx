import React, { useState } from "react";
import {
  VictoryLine,
  VictoryChart,
  VictoryBar,
  VictoryAxis,
  VictoryTooltip,
  VictoryContainer,
  VictoryLabel,
  VictoryTheme,
} from "victory";
import { ResponsivePie } from "@nivo/pie";
import "../styles/dashboard.css";

const COLORS = [
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#a855f7", // Purple
  "#ec4899", // Pink
  "#f43f5e", // Rose
  "#f97316", // Orange
  "#eab308", // Yellow
  "#22c55e", // Green
  "#14b8a6", // Teal
  "#06b6d4", // Cyan
  "#3b82f6", // Blue
  "#ef4444", // Red
];

const MARKET_REF = {
  milk: 60,
  paneer: 120,
  butter: 90,
  cheese: 150,
  yogurt: 45,
  lassi: 35,
  curd: 25,
  cream: 80,
  ghee: 200,
  milkshake: 70,
  other: 50,
};

// ── Crash-proof SVG line chart ────────────────────────────────────────────────
const PriceLineChart = ({ products }) => {
  const [tooltip, setTooltip] = useState(null);
  if (!products || products.length === 0)
    return <div className="no-data">No products</div>;

  const sorted = [...products].sort((a, b) => b.price - a.price);
  const W = 800,
    H = 340,
    PL = 60,
    PR = 20,
    PT = 20,
    PB = 100;
  const chartW = W - PL - PR;
  const chartH = H - PT - PB;
  const n = sorted.length;
  const allPrices = sorted.flatMap((p) => [
    p.price,
    MARKET_REF[p.category] || 50,
  ]);
  const maxY = Math.ceil(Math.max(...allPrices) * 1.15);
  const minY = 0;
  const range = maxY - minY;

  const xPos = (i) => PL + (i / (n - 1 || 1)) * chartW;
  const yPos = (v) => PT + chartH - ((v - minY) / range) * chartH;

  const storePts = sorted.map((p, i) => [xPos(i), yPos(p.price)]);
  const marketPts = sorted.map((p, i) => [
    xPos(i),
    yPos(MARKET_REF[p.category] || 50),
  ]);

  const polyline = (pts) => pts.map((p) => p.join(",")).join(" ");
  const areaPath = (pts) =>
    `M ${pts[0][0]} ${pts[0][1]} ` +
    pts
      .slice(1)
      .map((p) => `L ${p[0]} ${p[1]}`)
      .join(" ") +
    ` L ${pts[pts.length - 1][0]} ${PT + chartH} L ${pts[0][0]} ${PT + chartH} Z`;

  const yTickVals = Array.from({ length: 6 }, (_, i) =>
    Math.round(minY + (range / 5) * i),
  );

  return (
    <div className="svg-chart-wrap" style={{ position: "relative" }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: "auto", overflow: "visible" }}
      >
        {yTickVals.map((v) => (
          <g key={v}>
            <line
              x1={PL}
              y1={yPos(v)}
              x2={W - PR}
              y2={yPos(v)}
              stroke="#f0f0f0"
              strokeWidth="1"
            />
            <text
              x={PL - 8}
              y={yPos(v) + 4}
              textAnchor="end"
              fontSize="10"
              fill="#999"
            >
              Rs.{v}
            </text>
          </g>
        ))}
        <path d={areaPath(storePts)} fill="rgba(249,115,22,0.08)" />
        <polyline
          points={polyline(marketPts)}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeDasharray="6,3"
        />
        <polyline
          points={polyline(storePts)}
          fill="none"
          stroke="#f97316"
          strokeWidth="2.5"
        />
        {marketPts.map((pt, i) => (
          <circle
            key={`m${i}`}
            cx={pt[0]}
            cy={pt[1]}
            r="4"
            fill="#3b82f6"
            stroke="white"
            strokeWidth="1.5"
            style={{ cursor: "pointer" }}
            onMouseEnter={() =>
              setTooltip({
                x: pt[0],
                y: pt[1],
                text: `${sorted[i].name}\nMarket ref: Rs.${MARKET_REF[sorted[i].category] || 50}`,
              })
            }
            onMouseLeave={() => setTooltip(null)}
          />
        ))}
        {storePts.map((pt, i) => (
          <circle
            key={`s${i}`}
            cx={pt[0]}
            cy={pt[1]}
            r="5"
            fill="#f97316"
            stroke="white"
            strokeWidth="2"
            style={{ cursor: "pointer" }}
            onMouseEnter={() =>
              setTooltip({
                x: pt[0],
                y: pt[1],
                text: `${sorted[i].name}\nStore: Rs.${sorted[i].price}\nMarket: Rs.${MARKET_REF[sorted[i].category] || 50}`,
              })
            }
            onMouseLeave={() => setTooltip(null)}
          />
        ))}

        {/* // X axis labels */}
        {/* {sorted.map((p, i) => {
          const x = xPos(i);
          const y = H - PT + 25;
          const displayName =
            p.name.length > 12 ? p.name.slice(0, 10) + "..." : p.name;
          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor="end"
              fontSize="10"
              fill="#666"
              fontWeight="500"
              transform={`rotate(-45, ${x}, ${y})`}
            >
              {displayName}
            </text>
          );
        })} */}
        {tooltip &&
          (() => {
            const lines = tooltip.text.split("\n");
            const bw = 200,
              bh = lines.length * 18 + 16;
            const bx = Math.min(tooltip.x + 10, W - bw - 10);
            const by = Math.max(tooltip.y - bh - 10, 5);
            return (
              <g>
                <rect
                  x={bx}
                  y={by}
                  width={bw}
                  height={bh}
                  rx="6"
                  fill="white"
                  stroke="#ddd"
                  strokeWidth="1"
                  style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.12))" }}
                />
                {lines.map((line, i) => (
                  <text
                    key={i}
                    x={bx + 10}
                    y={by + 16 + i * 18}
                    fontSize="11"
                    fill="#2c3e50"
                    fontWeight={i === 0 ? "600" : "400"}
                  >
                    {line}
                  </text>
                ))}
              </g>
            );
          })()}
      </svg>
    </div>
  );
};

// ── Main AnalyticsTabs component ──────────────────────────────────────────────
const AnalyticsTabs = ({
  activeAnalyticsTab,
  stats,
  userAnalytics,
  productAnalytics,
  salesAnalytics,
  paymentConfig,
}) => {
  const formatSalesData = () =>
    (salesAnalytics?.salesData || [])
      .map((item) => ({
        x: `${item._id.month}/${String(item._id.year).slice(-2)}`,
        y: item.revenue || 0,
        label: `Revenue: Rs.${(item.revenue || 0).toFixed(0)}`,
      }))
      .reverse();

  const formatUserRoleData = () => {
    const fallbackData = [
      { _id: "admin", count: 5 },
      { _id: "customer", count: 25 },
      { _id: "manager", count: 10 },
      { _id: "delivery", count: 15 },
    ];

    const sourceData =
      Array.isArray(userAnalytics?.userByRole) &&
      userAnalytics.userByRole.length > 0
        ? userAnalytics.userByRole
        : fallbackData;

    const normalizedData = sourceData
      .map((item, i) => {
        const roleId =
          item?._id ?? item?.role ?? item?.id ?? item?.name ?? `role-${i + 1}`;
        const rawValue = item?.count ?? item?.value ?? item?.total ?? 0;
        const value = Number(rawValue);

        if (!roleId || !Number.isFinite(value) || value <= 0) {
          return null;
        }

        return {
          id: String(roleId),
          label: String(roleId),
          value,
          color: COLORS[i % COLORS.length],
        };
      })
      .filter(Boolean);

    return normalizedData.length > 0
      ? normalizedData
      : [{ id: "users", label: "users", value: 1, color: COLORS[0] }];
  };

  const formatCategoryData = () =>
    (productAnalytics?.productsByCategory || [])
      .sort((a, b) => (a.avgPrice || 0) - (b.avgPrice || 0))
      .map((item, i) => ({
        x: item._id.charAt(0).toUpperCase() + item._id.slice(1),
        y: item.avgPrice?.toFixed(0) || 0,
        fill: COLORS[i % COLORS.length],
        label: `${item._id}: Rs.${item.avgPrice?.toFixed(0) || 0} (Avg Price)`,
        count: item.count,
      }));

  const formatTopProductsData = () =>
    (productAnalytics?.mostSold || []).map((item) => ({
      x: (item.productDetails?.[0]?.name || "Unknown").substring(0, 10),
      y: item.totalSold || 0,
      label: `${item.productDetails?.[0]?.name || "Unknown"}: ${item.totalSold} sold`,
    }));

  const formatPaymentData = () =>
    (salesAnalytics?.paymentMethods || [])
      .filter((m) => m._id)
      .map((m) => ({
        x: m._id,
        y: m.count || 0,
        label: `${m._id}: ${m.count} orders`,
      }));

  const totalRevenue = salesAnalytics?.summary?.totalRevenue || 0;
  const avgOrderValue = salesAnalytics?.summary?.averageOrderValue || 0;
  const totalOrders = salesAnalytics?.summary?.totalOrders || 0;
  const categoryData = formatCategoryData();
  const topData = formatTopProductsData();
  const paymentData = formatPaymentData();
  const salesData = formatSalesData();
  const allProducts = productAnalytics?.allProducts || [];

  // ── USER ANALYTICS ──────────────────────────────────────────────────────────
  if (activeAnalyticsTab === "users") {
    return (
      <>
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Users</h3>
            <div className="stat-number">{stats?.users?.total || 0}</div>
          </div>
          <div className="stat-card">
            <h3>New Today</h3>
            <div className="stat-number">{stats?.users?.newToday || 0}</div>
          </div>
        </div>
        <div className="charts-grid">
          <div className="chart-container">
            <h3>Users by Role</h3>
            <div className="pie-chart-shell">
              <ResponsivePie
                data={formatUserRoleData()}
                margin={{ top: 40, right: 80, bottom: 40, left: 80 }}
                innerRadius={0.4}
                padAngle={2}
                cornerRadius={2}
                activeOuterRadiusOffset={4}
                borderWidth={1}
                borderColor="#fff"
                arcLinkLabelsSkipAngle={15}
                arcLinkLabelsTextColor="#334155"
                arcLinkLabelsThickness={1}
                arcLinkLabelsColor={{ from: "color" }}
                arcLabelsSkipAngle={15}
                arcLabelsTextColor="#fff"
                colors={{ datum: "data.color" }}
                isInteractive={true}
                animate={true}
                motionConfig="gentle"
                theme={{
                  labels: {
                    text: { fontSize: 11, fontWeight: 700, fill: "#fff" },
                  },
                  legends: { text: { fontSize: 11, fill: "#334155" } },
                  tooltip: {
                    container: {
                      background: "#1e293b",
                      color: "#fff",
                      fontSize: 12,
                      borderRadius: 8,
                    },
                  },
                }}
              />
            </div>
          </div>
          <div className="chart-container">
            <h3>Top Spenders</h3>
            <div className="top-list">
              {userAnalytics?.topSpenders?.length > 0 ? (
                userAnalytics.topSpenders.map((user, i) => (
                  <div key={user._id} className="list-item">
                    <span className="rank">#{i + 1}</span>
                    <span className="name">{user.name}</span>
                    <span className="orders">
                      {user.purchaseHistory?.length || 0} orders
                    </span>
                    <span className="amount">
                      Rs.{user.totalSpent?.toFixed(0) || "0"}
                    </span>
                  </div>
                ))
              ) : (
                <div className="no-data">No purchase data yet</div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── PRODUCT ANALYTICS ───────────────────────────────────────────────────────
  if (activeAnalyticsTab === "products") {
    return (
      <>
        <div className="stats-grid">
          <div className="stat-card">
            <h3>In Stock</h3>
            <div className="stat-number">
              {productAnalytics?.stockStatus?.inStock || 0}
            </div>
          </div>
          <div className="stat-card">
            <h3>Low Stock</h3>
            <div className="stat-number">
              {productAnalytics?.stockStatus?.lowStock || 0}
            </div>
          </div>
          <div className="stat-card">
            <h3>Out of Stock</h3>
            <div className="stat-number">
              {productAnalytics?.stockStatus?.outOfStock || 0}
            </div>
          </div>
        </div>

        <div className="charts-grid">
          <div className="chart-container compact category-price-card">
            <div className="category-chart-header">
              <div>
                <h3>Products by Category - Avg Price</h3>
                <p>
                  Quick comparison of average pricing across product groups.
                </p>
              </div>
              <span className="category-chart-badge">
                {categoryData.length} categories
              </span>
            </div>
            {categoryData.length > 0 ? (
              <div className="category-chart-shell">
                <VictoryChart
                  horizontal
                  height={220}
                  padding={{ top: 14, bottom: 34, left: 92, right: 74 }}
                  domainPadding={{ x: 18, y: 12 }}
                  containerComponent={<VictoryContainer responsive={true} />}
                  theme={VictoryTheme.material}
                >
                  <VictoryAxis
                    style={{
                      axis: { stroke: "#cbd5e1", strokeWidth: 1 },
                      tickLabels: {
                        fontSize: 7,
                        fill: "#64748b",
                        fontFamily:
                          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                        fontWeight: 500,
                      },
                      ticks: { stroke: "#cbd5e1", size: 2 },
                      grid: { stroke: "#94a3b8", strokeDasharray: "4, 4" },
                    }}
                  />
                  <VictoryAxis
                    dependentAxis
                    tickFormat={(t) => `₹${t}`}
                    style={{
                      axis: { stroke: "#cbd5e1", strokeWidth: 1 },
                      tickLabels: {
                        fontSize: 7,
                        fill: "#64748b",
                        fontFamily:
                          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                        fontWeight: 500,
                      },
                      ticks: { stroke: "none" },
                      grid: { stroke: "#94a3b8", strokeDasharray: "4, 4" },
                    }}
                    label="Avg Price (₹)"
                    axisLabelComponent={
                      <VictoryLabel
                        dy={-20}
                        style={{
                          fontSize: 7,
                          fontWeight: 600,
                          fill: "#64748b",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      />
                    }
                  />
                  <VictoryBar
                    data={categoryData}
                    style={{
                      data: {
                        fill: ({ datum }) => datum.fill,
                        stroke: "#e2e8f0",
                        strokeWidth: 1,
                        borderRadius: 2,
                      },
                      labels: {
                        fontSize: 8,
                        fill: "#1e293b",
                        fontWeight: 700,
                        fontFamily:
                          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                      },
                    }}
                    barWidth={10}
                    labels={({ datum }) => `₹${datum.y}`}
                    labelComponent={
                      <VictoryTooltip
                        style={{
                          fontSize: 8,
                          fontWeight: 600,
                          fill: "#fff",
                          fontFamily:
                            "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                        }}
                        flyoutStyle={{
                          fill: "#1e293b",
                          stroke: "none",
                          strokeWidth: 0,
                          borderRadius: 4,
                          padding: 6,
                          filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.15))",
                        }}
                        cornerRadius={4}
                        pointerLength={4}
                        pointerWidth={8}
                      />
                    }
                    animate={{
                      duration: 400,
                      onLoad: { duration: 400 },
                    }}
                  />
                </VictoryChart>
              </div>
            ) : (
              <div className="no-data">No product data</div>
            )}
          </div>

          {topData.length > 0 && (
            <div className="chart-container">
              <h3>Most Sold Products</h3>
              <VictoryChart
                horizontal
                height={Math.max(200, topData.length * 34)}
                padding={{ top: 20, bottom: 40, left: 110, right: 50 }}
                containerComponent={<VictoryContainer responsive={true} />}
              >
                <VictoryAxis style={{ tickLabels: { fontSize: 10 } }} />
                <VictoryAxis
                  dependentAxis
                  tickFormat={(t) => (Number.isInteger(t) ? t : "")}
                  style={{ tickLabels: { fontSize: 10 } }}
                />
                <VictoryBar
                  data={topData}
                  style={{ data: { fill: "#27ae60" } }}
                  barWidth={18}
                  labels={({ datum }) => datum.label}
                  labelComponent={<VictoryTooltip />}
                />
              </VictoryChart>
            </div>
          )}
        </div>

        <div className="chart-container" style={{ marginTop: "1.5rem" }}>
          <div className="price-chart-header">
            <h3>Store Price vs Market Reference</h3>
            <div className="price-chart-legend">
              <span className="pcl-dot" style={{ background: "#f97316" }} />
              <span>Store Price</span>
              <span className="pcl-dot" style={{ background: "#3b82f6" }} />
              <span>Market Ref (India 2024-25)</span>
            </div>
          </div>
          <PriceLineChart products={allProducts} />
        </div>

        <div className="chart-container" style={{ marginTop: "1.5rem" }}>
          <div className="price-chart-header">
            <h3>Product Price List &amp; Market Comparison</h3>
            <span className="market-ref-note">
              * Market reference = average Indian retail prices (2024-25)
            </span>
          </div>
          <div className="mgr-price-table-wrap">
            <table className="mgr-price-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Variety</th>
                  <th>Store (Rs.)</th>
                  <th>Market Ref (Rs.)</th>
                  <th>vs Market</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {allProducts.map((p, i) => {
                  const ref = MARKET_REF[p.category] || 50;
                  const diff = p.price - ref;
                  const pct = ((diff / ref) * 100).toFixed(0);
                  return (
                    <tr key={p._id || i}>
                      <td>{i + 1}</td>
                      <td>{p.name}</td>
                      <td>
                        <span className="cat-badge">{p.category}</span>
                      </td>
                      <td>{p.variety}</td>
                      <td className="price-cell">Rs.{p.price}</td>
                      <td style={{ color: "#3b82f6", fontWeight: 600 }}>
                        Rs.{ref}
                      </td>
                      <td>
                        <span
                          className={`price-diff ${diff > 0 ? "price-above" : diff < 0 ? "price-below" : "price-same"}`}
                        >
                          {diff > 0
                            ? `+${pct}%`
                            : diff < 0
                              ? `${pct}%`
                              : "At par"}
                        </span>
                      </td>
                      <td
                        className={
                          p.stock > 10
                            ? "stock-ok"
                            : p.stock > 0
                              ? "stock-low"
                              : "stock-out"
                        }
                      >
                        {p.stock > 0 ? p.stock : "Out"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  }

  // ── SALES ANALYTICS ─────────────────────────────────────────────────────────
  if (activeAnalyticsTab === "sales") {
    return (
      <>
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Revenue</h3>
            <div className="stat-number">Rs.{totalRevenue.toFixed(0)}</div>
          </div>
          <div className="stat-card">
            <h3>Total Orders</h3>
            <div className="stat-number">{totalOrders}</div>
          </div>
          <div className="stat-card">
            <h3>Avg Order Value</h3>
            <div className="stat-number">Rs.{avgOrderValue.toFixed(0)}</div>
          </div>
        </div>
        <div className="charts-grid">
          <div className="chart-container">
            <h3>Revenue by Month</h3>
            {salesData.length > 0 ? (
              <VictoryChart
                height={280}
                padding={{ top: 20, bottom: 50, left: 70, right: 20 }}
                containerComponent={<VictoryContainer responsive={true} />}
              >
                <VictoryAxis
                  style={{ tickLabels: { fontSize: 9, angle: -30 } }}
                />
                <VictoryAxis
                  dependentAxis
                  tickFormat={(t) => `Rs.${t}`}
                  style={{ tickLabels: { fontSize: 9 } }}
                />
                <VictoryLine
                  data={salesData}
                  style={{ data: { stroke: "#8b5cf6", strokeWidth: 2 } }}
                  labels={({ datum }) => datum.label}
                  labelComponent={<VictoryTooltip />}
                />
              </VictoryChart>
            ) : (
              <div className="no-data">No sales data yet</div>
            )}
          </div>
          <div className="chart-container">
            <h3>Payment Methods</h3>
            {paymentData.length > 0 ? (
              <>
                <VictoryPie
                  data={paymentData}
                  colorScale={COLORS}
                  height={250}
                  labelComponent={<VictoryTooltip />}
                  style={{ labels: { fontSize: 10 } }}
                />
                <div className="payment-legend">
                  {paymentData.map((m, i) => (
                    <div key={m.x} className="payment-legend-item">
                      <span
                        className="legend-dot"
                        style={{ background: COLORS[i % COLORS.length] }}
                      />
                      <span className="legend-name">{m.x}</span>
                      <span className="legend-count">{m.y} orders</span>
                      <span className="legend-amount">
                        Rs.
                        {salesAnalytics?.paymentMethods?.[i]?.total?.toFixed(
                          0,
                        ) || 0}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="no-data-payment">
                <div className="no-data-icon">💳</div>
                <p>No payment data yet</p>
              </div>
            )}
          </div>
        </div>

        {paymentConfig && (
          <div className="mgr-payment-config">
            <div className="mgr-config-card">
              <div className="mgr-config-title">⚙️ Payment Methods</div>
              <div className="mgr-config-list">
                {paymentConfig.paymentMethods?.map((m, i) => (
                  <div key={i} className="mgr-config-row">
                    <span className="mgr-config-name">{m.name}</span>
                    <span
                      className={`mgr-config-badge ${m.isActive ? "badge-active" : "badge-inactive"}`}
                    >
                      {m.isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mgr-config-row-cards">
              <div className="mgr-config-card mgr-config-card--small">
                <div className="mgr-config-title">⚙️ Currency</div>
                <div className="mgr-config-value">
                  {paymentConfig.currency || "INR"}
                </div>
              </div>
              <div className="mgr-config-card mgr-config-card--small">
                <div className="mgr-config-title">⚙️ Tax Rate</div>
                <div className="mgr-config-value">
                  {paymentConfig.taxRate || 0}%
                </div>
              </div>
            </div>
            <div className="mgr-config-card">
              <div className="mgr-config-title">⚙️ Shipping Rates</div>
              <div className="mgr-config-list">
                {paymentConfig.shippingRates?.map((r, i) => (
                  <div key={i} className="mgr-config-row">
                    <span className="mgr-config-name">{r.name}</span>
                    <span className="mgr-config-price">Rs.{r.price}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export default AnalyticsTabs;
