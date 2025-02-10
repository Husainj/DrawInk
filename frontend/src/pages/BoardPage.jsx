import { useState, useEffect, useRef } from "react";
import { Stage, Layer, Rect, Circle, Line, RegularPolygon } from "react-konva";
import { FaSquare, FaCircle, FaPlay, FaPen, FaEraser, FaShareAlt } from "react-icons/fa";
import { useParams } from "react-router-dom";
import api from "../services/api.js";

const BoardPage = () => {
  const { boardId } = useParams();
  const [tool, setTool] = useState("pen");
  const [shapes, setShapes] = useState([]);
  const [board, setBoard] = useState();
  const isDrawing = useRef(false);
  const stageRef = useRef(null);

  // Fetch board details on mount
  useEffect(() => {
    const fetchBoardData = async () => {
      try {
        const response = await api.get(`/boards/${boardId}`);
        setBoard(response.data);
      } catch (error) {
        console.error("Error fetching board data:", error);
      }
    };
    fetchBoardData();
  }, [boardId]);

  const handleMouseDown = (e) => {
    const pos = e.target.getStage().getPointerPosition();
    let newShape;

    if (tool === "pen" || tool === "eraser") {
      isDrawing.current = true;
      newShape = {
        type: tool,
        points: [pos.x, pos.y],
        stroke: tool === "pen" ? "#2D3748" : "#ffffff",
        id: Date.now(),
      };
    } else {
      const shapeProps = {
        x: pos.x,
        y: pos.y,
        fill: "#4299E1",
        id: Date.now(),
      };
      if (tool === "square") newShape = { ...shapeProps, type: "square", size: 60 };
      else if (tool === "circle") newShape = { ...shapeProps, type: "circle", radius: 30 };
      else if (tool === "triangle") newShape = { ...shapeProps, type: "triangle", size: 50 };
    }
    setShapes((prev) => [...prev, newShape]);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing.current) return;
    const point = e.target.getStage().getPointerPosition();
    setShapes((prev) =>
      prev.map((shape, index) =>
        index === prev.length - 1 ? { ...shape, points: [...shape.points, point.x, point.y] } : shape
      )
    );
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  return (
    <div className="w-full h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-3 bg-white shadow-md">
        <span className="text-gray-700 font-semibold">Board ID: {boardId}</span>
        <button className="flex items-center gap-2 px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600">
          <FaShareAlt /> Share
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 flex justify-center items-center p-4">
        <Stage
          ref={stageRef}
          width={window.innerWidth - 50}
          height={window.innerHeight - 160}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="bg-white shadow-lg rounded-lg border border-gray-300"
        >
          <Layer>
            {shapes.map((shape) =>
              shape.type === "square" ? (
                <Rect key={shape.id} x={shape.x} y={shape.y} width={shape.size} height={shape.size} fill={shape.fill} />
              ) : shape.type === "circle" ? (
                <Circle key={shape.id} x={shape.x} y={shape.y} radius={shape.radius} fill={shape.fill} />
              ) : shape.type === "triangle" ? (
                <RegularPolygon key={shape.id} x={shape.x} y={shape.y} sides={3} radius={shape.size} fill={shape.fill} />
              ) : shape.type === "pen" || shape.type === "eraser" ? (
                <Line key={shape.id} points={shape.points} stroke={shape.stroke} strokeWidth={tool === "eraser" ? 10 : 2} tension={0.5} lineCap="round" />
              ) : null
            )}
          </Layer>
        </Stage>
      </div>

      {/* Toolbar */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex gap-3 bg-white shadow-lg p-3 rounded-full border border-gray-300">
        {["square", "circle", "triangle", "pen", "eraser"].map((shape) => (
          <button
            key={shape}
            className={`flex items-center justify-center w-10 h-10 rounded-full border transition ${
              tool === shape ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => setTool(shape)}
          >
            {shape === "square" && <FaSquare size={18} />}
            {shape === "circle" && <FaCircle size={18} />}
            {shape === "triangle" && <FaPlay size={18} />}
            {shape === "pen" && <FaPen size={18} />}
            {shape === "eraser" && <FaEraser size={18} />}
          </button>
        ))}
      </div>
    </div>
  );
};

export default BoardPage;
