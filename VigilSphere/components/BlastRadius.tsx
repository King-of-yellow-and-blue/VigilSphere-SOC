"use client";

import React from 'react';

interface BlastRadiusProps {
  activeNode?: string | null;
}

export default function BlastRadius({ activeNode }: BlastRadiusProps) {
  const nodes = [
    { id: 'NETWORK', label: 'Network', cx: 150, cy: 50 },
    { id: 'PROCESS_TREE', label: 'Process Tree', cx: 250, cy: 150 },
    { id: 'FILE_SYSTEM', label: 'File System', cx: 200, cy: 280 },
    { id: 'USER_ACCOUNTS', label: 'User Accounts', cx: 100, cy: 280 },
    { id: 'SERVICES', label: 'Services', cx: 50, cy: 150 },
  ];

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4">
      <h2 className="text-xl font-bold mb-4 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">Blast Radius</h2>
      <svg width="300" height="350" viewBox="0 0 300 350" className="drop-shadow-lg">
        {/* Draw connections between nodes */}
        {nodes.map((node, i) => {
          const nextNode = nodes[(i + 1) % nodes.length];
          return (
            <line
              key={`line-${i}`}
              x1={node.cx}
              y1={node.cy}
              x2={nextNode.cx}
              y2={nextNode.cy}
              stroke="rgba(34, 211, 238, 0.3)"
              strokeWidth="2"
            />
          );
        })}
        {/* Draw central hub connections */}
        {nodes.map((node, i) => (
          <line
            key={`hub-${i}`}
            x1={150}
            y1={170}
            x2={node.cx}
            y2={node.cy}
            stroke="rgba(34, 211, 238, 0.3)"
            strokeWidth="2"
          />
        ))}

        <circle cx="150" cy="170" r="10" fill="#164e63" stroke="#22d3ee" strokeWidth="2" />
        
        {/* Draw nodes */}
        {nodes.map((node) => {
          const isActive = activeNode === node.id;
          return (
            <g key={node.id}>
              <circle
                cx={node.cx}
                cy={node.cy}
                r="30"
                className={`transition-all duration-300 ${
                  isActive 
                    ? "fill-red-900/50 stroke-red-500 stroke-[3px] animate-pulse drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]" 
                    : "fill-cyan-950/50 stroke-cyan-500 stroke-2"
                }`}
              />
              <text
                x={node.cx}
                y={node.cy}
                textAnchor="middle"
                alignmentBaseline="middle"
                className={`text-[10px] font-semibold transition-colors duration-300 ${
                  isActive ? "fill-red-400" : "fill-cyan-300"
                }`}
              >
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
