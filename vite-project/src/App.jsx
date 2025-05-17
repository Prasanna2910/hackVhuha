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

const xFactor = 2;
const yFactor = 2;
const zFactor = 0.002;

function AxisLine({ start, end, color = 'white' }) {
  return (
    <line>
      <bufferGeometry attach="geometry">
        <bufferAttribute
          attach="attributes-position"
          count={2}
          array={new Float32Array([...start, ...end])}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial attach="material" color={color} />
    </line>
  );
}

function AxesGrid({ xCount, yCount, xFactor, yFactor, zMax }) {
  const lines = [];
  for (let i = 0; i < xCount; i++) {
    for (let j = 0; j < yCount; j++) {
      lines.push(
        <AxisLine
          key={`grid-${i}-${j}`}
          start={[i * xFactor, j * yFactor, 0]}
          end={[i * xFactor, j * yFactor, zMax]}
          color="#333"
        />
      );
    }
  }

  // Axis base lines
  for (let i = 0; i < xCount; i++) {
    lines.push(
      <AxisLine
        key={`x-axis-line-${i}`}
        start={[i * xFactor, 0, 0]}
        end={[i * xFactor, yCount * yFactor, 0]}
        color="#333"
      />
    );
  }
  for (let j = 0; j < yCount; j++) {
    lines.push(
      <AxisLine
        key={`y-axis-line-${j}`}
        start={[0, j * yFactor, 0]}
        end={[xCount * xFactor, j * yFactor, 0]}
        color="#333"
      />
    );
  }

  return (
    <>
      {lines}
      <AxisLine start={[0, 0, 0]} end={[xCount * xFactor, 0, 0]} color="white" />
      <AxisLine start={[0, 0, 0]} end={[0, yCount * yFactor, 0]} color="white" />
      <AxisLine start={[0, 0, 0]} end={[0, 0, zMax]} color="white" />
    </>
  );
}

function Sphere({ position, color, hoverText }) {
  const [hovered, setHovered] = useState(false);
  return (
    <group>
      <mesh
        position={position}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {hovered && (
        <Html position={position} center>
          <div
            style={{
              background: "white",
              padding: "6px 10px",
              borderRadius: "6px",
              fontSize: "12px",
              color: "black",
              boxShadow: "0 0 5px rgba(0,0,0,0.3)",
              whiteSpace: "nowrap",
            }}
          >
            {hoverText.split("\n").map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        </Html>
      )}
    </group>
  );
}

function CrossAxes({ position, length = 0.5, color = "white" }) {
  const half = length / 2;
  const [x, y, z] = position;
  return (
    <>
      {/* X axis line */}
      <AxisLine start={[x - half, y, z]} end={[x + half, y, z]} color={color} />
      {/* Y axis line */}
      <AxisLine start={[x, y - half, z]} end={[x, y + half, z]} color={color} />
      {/* Z axis line */}
      <AxisLine start={[x, y, z - half]} end={[x, y, z + half]} color={color} />
    </>
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

function DeFiScene({ onTokenClick, onProtocolClick }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />

      <AxesGrid
        xCount={tokens.length}
        yCount={protocols.length}
        xFactor={xFactor}
        yFactor={yFactor}
        zMax={Math.max(...data.map(d => d[2])) * zFactor + 1}
      />

      {tokens.map((token) => (
        <Label3D
          key={token}
          position={[tokenIndices[token] * xFactor, -1, 0.5]}
          text={token}
          onClick={() => onTokenClick(token)}
        />
      ))}

      {protocols.map((protocol) => (
        <Label3D
          key={protocol}
          position={[-1, protocolIndices[protocol] * yFactor, 0]}
          text={protocol}
          onClick={() => onProtocolClick(protocol)}
        />
      ))}

      {data.map(([token, protocol, value, apy, gain], i) => {
        const position = [
          tokenIndices[token] * xFactor,
          protocolIndices[protocol] * yFactor,
          value * zFactor,
        ];
        const hoverText = `${token} on ${protocol}\nValue: $${value}\nAPY: ${apy}%\nGain: ${gain}%`;
        const color = gain >= 0 ? "green" : "red";
        return (
          <group key={i}>
            <Sphere position={position} color={color} hoverText={hoverText} />
            <CrossAxes position={position} color="white" />
          </group>
        );
      })}

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
  const options = { responsive: true, scales: { y: { beginAtZero: true } } };
  return (
    <Modal
      isOpen={!!token}
      onRequestClose={onClose}
      style={{
        content: {
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          padding: "20px",
          width: "500px",
          background: "#fff",
        },
        overlay: { backgroundColor: "rgba(0, 0, 0, 0.7)" },
      }}
    >
      <h2>{token} - Valuation by Protocol</h2>
      <Bar data={chartData} options={options} />
      <button
        onClick={onClose}
        style={{
          marginTop: "10px",
          padding: "8px 12px",
          background: "#444",
          color: "#fff",
          border: "none",
        }}
      >
        Close
      </button>
    </Modal>
  );
}

function ProtocolModal({ protocol, data, onClose }) {
  const filtered = data.filter((d) => d[1] === protocol);
  return (
    <Modal
      isOpen={!!protocol}
      onRequestClose={onClose}
      style={{
        content: {
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          padding: "20px",
          width: "400px",
          background: "#fff",
        },
        overlay: { backgroundColor: "rgba(0, 0, 0, 0.7)" },
      }}
    >
      <h2>{protocol} - Tokens in Protocol</h2>
      <ul>
        {filtered.map(([token, , value, apy, gain], i) => (
          <li key={i} style={{ marginBottom: "8px" }}>
            <strong>{token}</strong> — Value: ${value}, APY: {apy}%, Gain: {gain}%
          </li>
        ))}
      </ul>
      <button
        onClick={onClose}
        style={{
          marginTop: "10px",
          padding: "8px 12px",
          background: "#444",
          color: "#fff",
          border: "none",
        }}
      >
        Close
      </button>
    </Modal>
  );
}

export default function DeFiPortfolio3D() {
  const [selectedToken, setSelectedToken] = useState(null);
  const [selectedProtocol, setSelectedProtocol] = useState(null);
  return (
    <>
      <Canvas
        camera={{ position: [6, 6, 12], fov: 50 }}
        style={{ height: "600px", width: "100%", background: "#111" }}
      >
        <Suspense fallback={null}>
          <DeFiScene
            onTokenClick={setSelectedToken}
            onProtocolClick={setSelectedProtocol}
          />
        </Suspense>
      </Canvas>
      <ValuationModal
        token={selectedToken}
        data={data}
        onClose={() => setSelectedToken(null)}
      />
      <ProtocolModal
        protocol={selectedProtocol}
        data={data}
        onClose={() => setSelectedProtocol(null)}
      />
    </>
  );
}
