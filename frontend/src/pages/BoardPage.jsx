import { useState, useEffect, useRef } from "react";
import { Stage, Layer, Rect, Circle, Line, RegularPolygon, Transformer } from "react-konva";
import { FaSquare, FaCircle, FaPlay, FaPen, FaEraser, FaShareAlt, FaMousePointer } from "react-icons/fa";
import { useParams } from "react-router-dom";
import api from "../services/api.js";

const BoardPage = () => {
  const { boardId } = useParams();
  const [tool, setTool] = useState("select");
  const [shapes, setShapes] = useState([]);
  const [board, setBoard] = useState();
  const [selectedId, setSelectedId] = useState(null);
  const isDrawing = useRef(false);
  const stageRef = useRef(null);
  const transformerRef = useRef(null);

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

  // Update transformer when selected shape changes
  useEffect(() => {
    if (selectedId && transformerRef.current) {
      const node = stageRef.current.findOne('#' + selectedId);
      if (node) {
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer().batchDraw();
      }
    }
  }, [selectedId]);

  const handleMouseDown = (e) => {
    if (tool === "select") {
      // Clicked on stage - clear selection
      if (e.target === e.target.getStage()) {
        setSelectedId(null);
        return;
      }
      return;
    }

    const pos = e.target.getStage().getPointerPosition();
    let newShape;

    if (tool === "pen" || tool === "eraser") {
      isDrawing.current = true;
      newShape = {
        type: tool,
        points: [pos.x, pos.y],
        stroke: tool === "pen" ? "#2D3748" : "#ffffff",
        id: Date.now().toString(),
      };
    } else {
      const shapeProps = {
        x: pos.x,
        y: pos.y,
        fill: "#4299E1",
        id: Date.now().toString(),
        draggable: true,
      };
      if (tool === "square") newShape = { ...shapeProps, type: "square", width: 60, height: 60 };
      else if (tool === "circle") newShape = { ...shapeProps, type: "circle", radius: 30 };
      else if (tool === "triangle") newShape = { ...shapeProps, type: "triangle", radius: 50 };
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

  const handleTransformEnd = (e) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scale to 1 and adjust width/height/radius instead
    node.scaleX(1);
    node.scaleY(1);

    setShapes(shapes.map(shape => {
      if (shape.id === node.id()) {
        if (shape.type === "circle") {
          return {
            ...shape,
            radius: shape.radius * scaleX,
            x: node.x(),
            y: node.y(),
          };
        } else if (shape.type === "square") {
          return {
            ...shape,
            width: node.width() * scaleX,
            height: node.height() * scaleY,
            x: node.x(),
            y: node.y(),
          };
        } else if (shape.type === "triangle") {
          return {
            ...shape,
            radius: shape.radius * scaleX,
            x: node.x(),
            y: node.y(),
          };
        }
      }
      return shape;
    }));
  };

  const handleDragEnd = (e) => {
    setShapes(shapes.map(shape => {
      if (shape.id === e.target.id()) {
        return {
          ...shape,
          x: e.target.x(),
          y: e.target.y(),
        };
      }
      return shape;
    }));
  };

  return (
    <div className="w-full h-screen flex flex-col bg-gray-100">
      <div className="flex justify-between items-center px-6 py-3 bg-white shadow-md">
        <span className="text-gray-700 font-semibold">Board ID: {boardId}</span>
        <button className="flex items-center gap-2 px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600">
          <FaShareAlt /> Share
        </button>
      </div>

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
            {shapes.map((shape) => {
              const shapeProps = {
                key: shape.id,
                id: shape.id,
                draggable: tool === "select",
                onClick: () => tool === "select" && setSelectedId(shape.id),
                onDragEnd: handleDragEnd,
                onTransformEnd: handleTransformEnd,
              };

              if (shape.type === "square") {
                return (
                  <Rect
                    {...shapeProps}
                    x={shape.x}
                    y={shape.y}
                    width={shape.width}
                    height={shape.height}
                    fill={shape.fill}
                  />
                );
              } else if (shape.type === "circle") {
                return (
                  <Circle
                    {...shapeProps}
                    x={shape.x}
                    y={shape.y}
                    radius={shape.radius}
                    fill={shape.fill}
                  />
                );
              } else if (shape.type === "triangle") {
                return (
                  <RegularPolygon
                    {...shapeProps}
                    x={shape.x}
                    y={shape.y}
                    sides={3}
                    radius={shape.radius}
                    fill={shape.fill}
                  />
                );
              } else if (shape.type === "pen" || shape.type === "eraser") {
                return (
                  <Line
                    key={shape.id}
                    points={shape.points}
                    stroke={shape.stroke}
                    strokeWidth={shape.type === "eraser" ? 10 : 2}
                    tension={0.5}
                    lineCap="round"
                  />
                );
              }
              return null;
            })}
            {selectedId && (
              <Transformer
                ref={transformerRef}
                boundBoxFunc={(oldBox, newBox) => {
                  // Limit resize
                  const minSize = 5;
                  const maxSize = 800;
                  if (
                    newBox.width < minSize ||
                    newBox.height < minSize ||
                    newBox.width > maxSize ||
                    newBox.height > maxSize
                  ) {
                    return oldBox;
                  }
                  return newBox;
                }}
              />
            )}
          </Layer>
        </Stage>
      </div>

      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex gap-3 bg-white shadow-lg p-3 rounded-full border border-gray-300">
        {["select", "square", "circle", "triangle", "pen", "eraser"].map((shape) => (
          <button
            key={shape}
            className={`flex items-center justify-center w-10 h-10 rounded-full border transition ${
              tool === shape ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => {
              setTool(shape);
              if (shape !== "select") {
                setSelectedId(null);
              }
            }}
          >
            {shape === "select" && <FaMousePointer size={18} />}
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