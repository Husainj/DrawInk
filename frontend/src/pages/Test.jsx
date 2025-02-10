import React, { useState, useRef } from 'react';
import { Stage, Layer, Line } from 'react-konva';

const Test = () => {
  const [tool, setTool] = useState('pen');
  const [lines, setLines] = useState([]);
  const isDrawing = useRef(false);

  const handleMouseDown = (e) => {
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    setLines([...lines, { tool, points: [pos.x, pos.y] }]);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing.current) return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    const lastLine = lines[lines.length - 1];
    lastLine.points = lastLine.points.concat([point.x, point.y]);
    setLines([...lines.slice(0, -1), lastLine]);
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-4">
          <div className="relative">
            <Stage
              width={window.innerWidth * 0.8}
              height={500}
              onMouseDown={handleMouseDown}
              onMousemove={handleMouseMove}
              onMouseup={handleMouseUp}
              className="border border-gray-200 rounded-lg"
            >
              <Layer>
                {lines.map((line, i) => (
                  <Line
                    key={i}
                    points={line.points}
                    stroke="#000"
                    strokeWidth={2}
                    tension={0.5}
                    lineCap="round"
                    lineJoin="round"
                  />
                ))}
              </Layer>
            </Stage>
            
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-white rounded-lg shadow-md px-4 py-2">
              <button
                onClick={() => setTool('square')}
                className={`w-8 h-8 flex items-center justify-center rounded ${
                  tool === 'square' ? 'bg-black text-white' : 'bg-gray-100'
                }`}
              >
                <div className="w-4 h-4 border-2 border-current" />
              </button>
              <button
                onClick={() => setTool('circle')}
                className={`w-8 h-8 flex items-center justify-center rounded ${
                  tool === 'circle' ? 'bg-black text-white' : 'bg-gray-100'
                }`}
              >
                <div className="w-4 h-4 rounded-full border-2 border-current" />
              </button>
              <button
                onClick={() => setTool('triangle')}
                className={`w-8 h-8 flex items-center justify-center rounded ${
                  tool === 'triangle' ? 'bg-black text-white' : 'bg-gray-100'
                }`}
              >
                <div className="w-0 h-0 border-l-4 border-r-4 border-b-[8px] border-current" />
              </button>
              <button
                onClick={() => setTool('pen')}
                className={`w-8 h-8 flex items-center justify-center rounded ${
                  tool === 'pen' ? 'bg-black text-white' : 'bg-gray-100'
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 19l7-7 3 3-7 7-3-3z" />
                  <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                  <path d="M2 2l7.586 7.586" />
                  <path d="M11 11l-4 4" />
                </svg>
              </button>
              <button
                onClick={() => setTool('eraser')}
                className={`w-8 h-8 flex items-center justify-center rounded ${
                  tool === 'eraser' ? 'bg-black text-white' : 'bg-gray-100'
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 20H7L3 16c-1.5-1.5-1.5-3.5 0-5L14 0l7 7-11 11 3 3h7v-1z" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-500">Room: ABC123</div>
            <button className="flex items-center space-x-1 text-gray-600 hover:text-gray-900">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Test;