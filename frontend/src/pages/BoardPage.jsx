import { useState, useEffect, useRef } from "react";
import { Stage, Layer, Rect, Circle, Line, RegularPolygon, Transformer } from "react-konva";
import { FaSquare, FaCircle, FaPlay, FaPen, FaEraser, FaShareAlt, FaMousePointer } from "react-icons/fa";
import { useParams } from "react-router-dom";
import api from "../services/api.js";
import io from "socket.io-client";
import { useSelector } from "react-redux";

const BoardPage = () => {
  const { boardId } = useParams();
  const [tool, setTool] = useState("select");
  const [shapes, setShapes] = useState([]);
  const [currentDrawing, setCurrentDrawing] = useState(null);
  const [board, setBoard] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [code, setCode] = useState();
  const isDrawing = useRef(false);
  const isErasing = useRef(false);
  const stageRef = useRef(null);
  const transformerRef = useRef(null);
  const currentDrawingId = useRef(null);
  const batchedPoints = useRef([]);
  const socketRef = useRef(null); // Use ref to persist socket
  const user = useSelector((state) => state.auth.user);

  const batchInterval = 500;

  // Initialize socket and set up listeners
  useEffect(() => {
    socketRef.current = io("http://localhost:8000", {
      auth: { userId: user._id },
    });

    const socket = socketRef.current; // Alias for cleaner code

    const fetchBoardData = async () => {
      try {
        const response = await api.get(`/boards/${boardId}`);
        setBoard(response.data.data);
        setCode(response.data.data.code);
      } catch (error) {
        console.error("Error fetching board data:", error);
      }
    };
    fetchBoardData();

    socket.emit("joinBoard", boardId);

    socket.on("userJoined", (data) => {
      setParticipants(data.participants);
    });

    socket.on("initialShapes", (initialShapes) => {
      setShapes(initialShapes);
    });

    socket.on("elementAdded", (shape) => {
      setShapes((prev) => {
        if (!prev.some((s) => s.id === shape.id)) {
          return [...prev, shape];
        }
        return prev;
      });
    });

    socket.on("elementUpdated", (element) => {
      setShapes((prev) => prev.map((s) => (s.id === element.id ? element : s)));
    });

    socket.on("elementDeleted", (elementId) => {
      setShapes((prev) => prev.filter((s) => s.id !== elementId));
    });

    socket.on("drawingUpdated", (data) => {
      const { drawingId, points } = data;
      setShapes((prev) =>
        prev.map((shape) =>
          shape.id === drawingId && shape.type === "pen"
            ? { ...shape, points: [...shape.points, ...points] }
            : shape
        )
      );
      if (drawingId === currentDrawingId.current) {
        setCurrentDrawing((prev) => ({
          ...prev,
          points: [...prev.points, ...points],
        }));
      }
    });

    return () => {
      socket.disconnect();
      socket.off("userJoined");
      socket.off("initialShapes");
      socket.off("elementAdded");
      socket.off("elementUpdated");
      socket.off("elementDeleted");
      socket.off("drawingUpdated");
    };
  }, [boardId, user._id]);

  // Batch drawing updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (batchedPoints.current.length > 0 && currentDrawingId.current) {
        const points = batchedPoints.current;
        socketRef.current.emit("updateDrawing", {
          boardId,
          drawingId: currentDrawingId.current,
          points,
          isComplete: false,
        });
        batchedPoints.current = [];
      }
    }, batchInterval);

    return () => clearInterval(interval);
  }, [boardId]);

  const handleMouseDown = (e) => {
    if (tool === "select") {
      if (e.target === e.target.getStage()) setSelectedId(null);
      return;
    }

    if (tool === "eraser") {
      isErasing.current = true;
      const clickedShape = e.target;
      if (clickedShape && clickedShape !== e.target.getStage()) {
        socketRef.current.emit("deleteElement", { boardId, elementId: clickedShape.attrs.id });
      }
      return;
    }

    const pos = e.target.getStage().getPointerPosition();
    const timestamp = Date.now();
    const newId = timestamp.toString();

    if (tool === "pen") {
      isDrawing.current = true;
      currentDrawingId.current = newId;
      const newShape = {
        type: "pen",
        points: [pos.x, pos.y],
        stroke: "#2D3748",
        id: newId,
      };
      batchedPoints.current = [pos.x, pos.y];
      socketRef.current.emit("addElement", { boardId, newShape });
      setCurrentDrawing(newShape);
    } else {
      const shapeProps = {
        x: pos.x,
        y: pos.y,
        fill: "#4299E1",
        id: newId,
        draggable: true,
      };
      let newShape;
      if (tool === "square") newShape = { ...shapeProps, type: "square", width: 60, height: 60 };
      else if (tool === "circle") newShape = { ...shapeProps, type: "circle", radius: 30 };
      else if (tool === "triangle") newShape = { ...shapeProps, type: "triangle", radius: 50 };
      socketRef.current.emit("addElement", { boardId, newShape });
      setShapes((prev) => [...prev, newShape]);
    }
  };

  const handleMouseMove = (e) => {
    if (tool === "eraser" && isErasing.current) {
      const pos = e.target.getStage().getPointerPosition();
      const shape = e.target.getStage().getIntersection(pos);
      if (shape && shape !== e.target.getStage()) {
        socketRef.current.emit("deleteElement", { boardId, elementId: shape.attrs.id });
      }
      return;
    }

    if (!isDrawing.current || tool !== "pen" || !currentDrawingId.current) return;

    const point = e.target.getStage().getPointerPosition();
    batchedPoints.current = [...batchedPoints.current, point.x, point.y];

    setCurrentDrawing((prev) => ({
      ...prev,
      points: [...prev.points, point.x, point.y],
    }));
  };

  const handleMouseUp = () => {
    if (isDrawing.current && tool === "pen" && batchedPoints.current.length > 0) {
      socketRef.current.emit("updateDrawing", {
        boardId,
        drawingId: currentDrawingId.current,
        points: batchedPoints.current,
        isComplete: true,
      });
      batchedPoints.current = [];
      currentDrawingId.current = null;
      setCurrentDrawing(null);
    }
    isDrawing.current = false;
    isErasing.current = false;
  };

  const handleTransformEnd = (e) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);

    const updatedShape = shapes.find((shape) => shape.id === node.id());
    if (!updatedShape) return;

    let newShape;
    if (updatedShape.type === "circle") {
      newShape = { ...updatedShape, radius: updatedShape.radius * scaleX, x: node.x(), y: node.y() };
    } else if (updatedShape.type === "square") {
      newShape = { ...updatedShape, width: node.width() * scaleX, height: node.height() * scaleY, x: node.x(), y: node.y() };
    } else if (updatedShape.type === "triangle") {
      newShape = { ...updatedShape, radius: updatedShape.radius * scaleX, x: node.x(), y: node.y() };
    }

    if (newShape) {
      setShapes((prev) => prev.map((s) => (s.id === newShape.id ? newShape : s)));
      socketRef.current.emit("updateElement", { boardId, updatedShape: newShape });
    }
  };

  const handleDragEnd = (e) => {
    const updatedShape = shapes.find((shape) => shape.id === e.target.id());
    if (updatedShape) {
      const newShape = { ...updatedShape, x: e.target.x(), y: e.target.y() };
      setShapes((prev) => prev.map((s) => (s.id === newShape.id ? newShape : s)));
      socketRef.current.emit("updateElement", { boardId, updatedShape: newShape });
    }
  };

  // Transformer setup
  useEffect(() => {
    if (selectedId && transformerRef.current) {
      const node = stageRef.current.findOne("#" + selectedId);
      if (node) {
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer().batchDraw();
      }
    }
  }, [selectedId]);

  return (
    <div className="w-full h-screen flex flex-col bg-gray-100">
      <div className="flex justify-between items-center px-6 py-3 bg-white shadow-md">
        <span className="text-gray-700 font-semibold">Board Code: {code}</span>
        <button className="flex items-center gap-2 px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600">
          <FaShareAlt /> Share
        </button>
        <div>
          <h1>Board Participants</h1>
          <ul>
            {participants.map((participant) => (
              <li key={participant}>{participant}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex-1 flex justify-center items-center p-4">
        <Stage
          ref={stageRef}
          width={window.innerWidth - 50}
          height={window.innerHeight - 160}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="bg-white shadow-lg rounded-lg border border-gray-300"
        >
          <Layer>
            {shapes.map((shape, index) => {
              const shapeProps = {
                id: shape.id,
                draggable: tool === "select",
                onClick: () => tool === "select" && setSelectedId(shape.id),
                onDragEnd: handleDragEnd,
                onTransformEnd: handleTransformEnd,
              };

              if (shape.type === "square") {
                return <Rect key={`${shape.id}-${index}`} {...shapeProps} x={shape.x} y={shape.y} width={shape.width} height={shape.height} fill={shape.fill} />;
              } else if (shape.type === "circle") {
                return <Circle key={`${shape.id}-${index}`} {...shapeProps} x={shape.x} y={shape.y} radius={shape.radius} fill={shape.fill} />;
              } else if (shape.type === "triangle") {
                return <RegularPolygon key={`${shape.id}-${index}`} {...shapeProps} x={shape.x} y={shape.y} sides={3} radius={shape.radius} fill={shape.fill} />;
              } else if (shape.type === "pen" && shape.id !== currentDrawingId.current) {
                return <Line key={`${shape.id}-${index}`} {...shapeProps} points={shape.points} stroke={shape.stroke} strokeWidth={2} tension={0.5} lineCap="round" />;
              }
              return null;
            })}
            {currentDrawing && (
              <Line
                id={currentDrawing.id}
                points={currentDrawing.points || []} // Fallback to empty array if points is undefined
                stroke={currentDrawing.stroke}
                strokeWidth={2}
                tension={0.5}
                lineCap="round"
              />
            )}
            {selectedId && tool === "select" && (
              <Transformer
                ref={transformerRef}
                boundBoxFunc={(oldBox, newBox) => {
                  const minSize = 5;
                  const maxSize = 800;
                  if (newBox.width < minSize || newBox.height < minSize || newBox.width > maxSize || newBox.height > maxSize) {
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
              if (shape !== "select") setSelectedId(null);
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