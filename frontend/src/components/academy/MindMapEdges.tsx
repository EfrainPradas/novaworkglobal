import React from 'react'
import type { NodeState } from '../../types/academy'

interface Edge {
  id: string
  from: NodeState
  to: NodeState
}

interface MindMapEdgesProps {
  edges: Edge[]
}

const MindMapEdges: React.FC<MindMapEdgesProps> = ({ edges }) => {
  const createCurvePath = (x1: number, y1: number, x2: number, y2: number): string => {
    const dx = x2 - x1
    const dy = y2 - y1
    
    const cx1 = x1 + dx * 0.3
    const cy1 = y1 + dy * 0.1
    const cx2 = x2 - dx * 0.3
    const cy2 = y2 - dy * 0.1
    
    return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`
  }

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    >
      <defs>
        <linearGradient id="edgeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#94A3B8" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#94A3B8" stopOpacity="0.2" />
        </linearGradient>
        <filter id="edgeShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.1" />
        </filter>
      </defs>
      
      {edges.map((edge) => (
        <g key={edge.id}>
          <path
            d={createCurvePath(
              edge.from.x + 60,
              edge.from.y + 30,
              edge.to.x + 60,
              edge.to.y + 30
            )}
            fill="none"
            stroke="#CBD5E1"
            strokeWidth={2}
            strokeDasharray="4 4"
            className="transition-all duration-300"
            opacity={0.6}
          />
          <circle
            cx={edge.to.x + 60}
            cy={edge.to.y + 30}
            r={3}
            fill="#94A3B8"
            opacity={0.5}
          />
        </g>
      ))}
    </svg>
  )
}

export default MindMapEdges
