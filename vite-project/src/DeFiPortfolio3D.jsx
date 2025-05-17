// DeFiPortfolio3D.jsx
import React, { useState, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import Modal from "react-modal";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Your sample DeFi data
const data = [
  ["DAI", "Aave", 2000, 4.5, 2.1],
  ["ETH", "Uniswap", 1500, 3.2, 1.0],
  ["USDC", "Compound", 1200, 2.8, -1.2],
  ["AAVE", "Staked", 800, 5.0, 0.5],
];

const tokens = [...new Set(data.map((item) => item[0]))].sort();
const protocols = [...new Set(data.map((item) => item[1]))].sort();

const tokenIndices = Object.fromEntries(tokens.map((t, i) => [t, i]));
const protocolIndices = Object.fromEntries(protocols.map((p, i) => [p, i]));

Modal.setAppElement("#root");

function Sphere({ position, color }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.25, 32, 32]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

function Label3D({ position, text, onClick }) {
  return (
    <Html
      position={position}
      transform
      occlude={false}
      style={{
        pointerEvents: "auto",
        cursor: "pointer",
        color: "white",
        fontWeight: "bold",
        fontSize: "14px",
        whiteSpace: "nowrap",
      }}
      center
    >
      <div onClick={onClick}>{text}</div>
    </Html>
  );
}

function DeFiScene({ onTokenClick }) {
  const xFactor = 2;
  const yFactor = 2;
  const zFactor = 0.002;

  const getColor = (gain) => (gain >= 0 ? "green" : "red");

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />

      {/* Tokens as clickable X-axis labels */}
      {tokens.map((token) => (
        <Label3D
          key={token}
          position={[tokenIndices[token] * xFactor, -1, 0.5]}
          text={token}
          onClick={() => onTokenClick(token)}
        />
      ))}

      {/* Protocols as Y-axis labels */}
      {protocols.map((protocol) => (
        <Label3D
          key={protocol}
          position={[-1, protocolIndices[protocol] * yFactor, 0]}
          text={protocol}
          onClick={null}
        />
      ))}

      {/* Spheres representing DeFi data */}
      {data.map(([token, protocol, value, apy, gain], i) => (
        <Sphere
          key={i}
          position={[
            tokenIndices[token] * xFactor,
            protocolIndices[protocol] * yFactor,
            value * zFactor,
          ]}
          color={getColor(gain)}
        />
      ))}

      <OrbitControls />
    </>
  );
}

function ValuationModal({ token, data, onClose }) {
  const filtered = data.filter((d) => d[0] === token);
  const chartData = {
    labels: filtered.map((d) => d[1]),
    datasets: [
      {
        label: "Valuation (USD)",
        data: filtered.map((d) => d[2]),
        backgroundColor: "rgba(54, 162, 235, 0.6)",
      },
    ],
  };

  const options = {
    responsive: true,
    scales: {
      y: { beginAtZero: true },
    },
  };

  return (
    <Modal
      isOpen={!!token}
      onRequestClose={onClose}
      style={{
        content: {
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          padding: "20px", width: "500px",
          background: "#fff",
        },
        overlay: {
          backgroundColor: "rgba(0, 0, 0, 0.7)",
        },
      }}
    >
      <h2>{token} - Valuation by Protocol</h2>
      <Bar data={chartData} options={options} />
      <button onClick={onClose} style={{
        marginTop: "10px", padding: "8px 12px",
        background: "#444", color: "#fff", border: "none"
      }}>Close</button>
    </Modal>
  );
}

export default function DeFiPortfolio3D() {
  const [selectedToken, setSelectedToken] = useState(null);

  return (
    <>
      <Canvas
        camera={{ position: [6, 6, 12], fov: 50 }}
        style={{ height: "600px", width: "100%", background: "#111" }}
      >
        <Suspense fallback={null}>
          <DeFiScene onTokenClick={setSelectedToken} />
        </Suspense>
      </Canvas>

      <ValuationModal
        token={selectedToken}
        data={data}
        onClose={() => setSelectedToken(null)}
      />
    </>
  );
}
