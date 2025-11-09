// sale-chart-client.tsx
"use client";

import React from "react";
import Box from "../box";
import Chart, { Props } from "react-apexcharts";

export const SalesChartClient = ({ ordersData }: { ordersData?: { month: string; count: number }[] }) => {
  const chartSeries: Props["series"] = [
    {
      name: "Sales",
      data: ordersData?.map((d) => d.count) || [31, 40, 28, 51, 42, 109, 100],
    },
  ];

  const chartOptions: Props["options"] = {
    chart: { type: "area", height: 350, toolbar: { show: false } },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth" },
    xaxis: {
      categories: ordersData?.map((d) => d.month) || ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
    },
    colors: ["#6366F1"],
    fill: {
      type: "gradient",
      gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.1, stops: [0, 90, 100] },
    },
    tooltip: { y: { formatter: (val: number) => `${val} orders` } },
  };

  return (
    <Box
      css={{
        width: "100%",
        background: "#fff",
        borderRadius: "12px",
        padding: "16px",
        boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
      }}
    >
      <h2 style={{ marginBottom: "12px", fontSize: "1.125rem", color: "#111827" }}>
        Monthly Sales
      </h2>
      <Chart options={chartOptions} series={chartSeries} type="area" height={350} />
    </Box>
  );
};

export default SalesChartClient;
