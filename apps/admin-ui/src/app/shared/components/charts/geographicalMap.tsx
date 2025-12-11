"use client";

import React, { useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { motion, AnimatePresence } from "framer-motion";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const countryData = [
  { name: "United States of America", users: 120, sellers: 30 },
  { name: "Philippines", users: 50, sellers: 10 },
  { name: "Indonesia", users: 30, sellers: 5 },
  { name: "Malaysia", users: 20, sellers: 3 },
  { name: "Thailand", users: 10, sellers: 1 },
];

const getColor = (countryName: string) => {
  const country = countryData.find((c) => c.name === countryName);
  if (!country) return "#1e293b"; 
  const total = country.users + country.sellers;
  if (total > 100) return "#22c55e";
  if (total > 0) return "#3b82f6";
  return "#1e293b";
};

const GeographicalMap = () => {
  const [hovered, setHovered] = useState<{ name: string; users: number; sellers: number } | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  return (
    <div className="relative w-full overflow-visible">
      <ComposableMap
        projection="geoEqualEarth"
        projectionConfig={{ scale: 230, center: [0, 10] }}
        style={{ width: "100%", height: "35vh" }}
      >
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const countryName = geo.properties.name;
              const match = countryData.find((c) => c.name === countryName);
              const baseColor = getColor(countryName);

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onMouseEnter={(e) => {
                    setTooltipPosition({ x: e.clientX + window.scrollX, y: e.clientY + window.scrollY });
                    setHovered({
                      name: countryName,
                      users: match?.users || 0,
                      sellers: match?.sellers || 0,
                    });
                  }}
                  onMouseMove={(e) => {
                    setTooltipPosition({ x: e.clientX + window.scrollX, y: e.clientY + window.scrollY });
                  }}
                  onMouseLeave={() => setHovered(null)}
                  fill={baseColor}
                  stroke="#334155"
                  style={{
                    default: { outline: "none", transition: "fill 0.3s ease-in-out" },
                    hover: { fill: match ? baseColor : "#facc15", outline: "none", transition: "fill 0.3s ease-in-out" },
                    pressed: { fill: "#ef4444", outline: "none" },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      <AnimatePresence>
        {hovered && (
          <motion.div
            key={hovered.name}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeInOut" }}
            className="fixed bg-gray-800 text-white text-xs p-2 rounded shadow-lg"
            style={{ top: tooltipPosition.y, left: tooltipPosition.x }}
          >
            <strong>{hovered.name}</strong>
            <br />
            User: <span className="text-green-400">{hovered.users}</span>
            <br />
            Sellers: <span className="text-yellow-400">{hovered.sellers}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GeographicalMap;
