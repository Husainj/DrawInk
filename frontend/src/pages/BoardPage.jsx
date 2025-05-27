import { useState, useEffect, useRef } from "react";
import { Stage, Layer, Rect, Circle, Line, RegularPolygon, Text, Transformer } from "react-konva";
import { FaSquare, FaCircle, FaPlay, FaPen, FaEraser, FaShareAlt, FaMousePointer, FaFont } from "react-icons/fa";
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
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [color, setColor] = useState("#4299E1");
  const [stroke, setStroke] = useState("#000000");
  const stageRef = useRef(null);
  const transformerRef = useRef(null);
  const currentDrawingId = useRef(null);
  const batchedPoints = useRef([]);
  const socketRef = useRef(null);
  const user = useSelector((state) => state.auth.user);
  const [showToast, setShowToast] = useState(false);
  const [textInput, setTextInput] = useState({
    visible: false,
    x: 0,
    y: 0,
    value: "",
    id: null,
  });
  const textInputRef = useRef(null);
  const stageContainerRef = useRef(null);
  const batchInterval = 500;

  useEffect(() => {
    socketRef.current = io("http://localhost:8000", {
      auth: { userId: user._id },
    });

    const socket = socketRef.current;
    socket.emit("joinBoard", boardId);

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

    socket.on("userJoined", (data) => {
      setParticipants(data.participants);
      console.log("Joined participant : " , data.participants)
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
      socket.emit("leaveBoard", { boardId, userId: user._id });
      socket.disconnect();
    };
  }, [boardId, user._id]);

  const handleCopyCode = () => {
    if (code) {
      navigator.clipboard.writeText(code).then(() => {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
      }).catch((err) => {
        console.error("Failed to copy code:", err);
      });
    }
  };

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

  useEffect(() => {
    if (textInput.visible && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [textInput.visible]);

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
        stroke: stroke,
        strokeWidth: strokeWidth,
        id: newId,
      };
      batchedPoints.current = [pos.x, pos.y];
      socketRef.current.emit("addElement", { boardId, newShape });
      setCurrentDrawing(newShape);
    } else if (tool === "text") {
      const stage = stageRef.current;
      const stageRect = stage.container().getBoundingClientRect();
      const containerRect = stageContainerRef.current.getBoundingClientRect();
      const stageLeft = stageRect.left - containerRect.left;
      const stageTop = stageRect.top - containerRect.top;
      const inputX = stageLeft + pos.x;
      const inputY = stageTop + pos.y;
      setTextInput({
        visible: true,
        x: inputX,
        y: inputY,
        value: "",
        id: newId,
      });
    } else {
      const shapeProps = {
        x: pos.x,
        y: pos.y,
        fill: color,
        stroke: stroke,
        strokeWidth: strokeWidth,
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
    } else if (updatedShape.type === "text") {
      newShape = { ...updatedShape, fontSize: updatedShape.fontSize * scaleX, x: node.x(), y: node.y() };
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

  const handleTextSubmit = (e) => {
    if (e.key === "Enter" && textInput.value.trim()) {
      const stage = stageRef.current;
      const stageRect = stage.container().getBoundingClientRect();
      const shapeX = textInput.x - stageRect.left;
      const shapeY = textInput.y - stageRect.top;
      const newShape = {
        type: "text",
        x: shapeX,
        y: shapeY,
        text: textInput.value.trim(),
        fontSize: 20,
        fill: color,
        stroke: stroke,
        strokeWidth: strokeWidth,
        id: textInput.id,
        draggable: true,
      };
      socketRef.current.emit("addElement", { boardId, newShape });
      setShapes((prev) => [...prev, newShape]);
      setTextInput({ visible: false, x: 0, y: 0, value: "", id: null });
    } else if (e.key === "Escape") {
      setTextInput({ visible: false, x: 0, y: 0, value: "", id: null });
    }
  };

  const handleTextBlur = () => {
    if (textInput.value.trim()) {
      const stage = stageRef.current;
      const stageRect = stage.container().getBoundingClientRect();
      const shapeX = textInput.x - stageRect.left;
      const shapeY = textInput.y - stageRect.top;
      const newShape = {
        type: "text",
        x: shapeX,
        y: shapeY,
        text: textInput.value.trim(),
        fontSize: 20,
        fill: color,
        stroke: stroke,
        strokeWidth: strokeWidth,
        id: textInput.id,
        draggable: true,
      };
      socketRef.current.emit("addElement", { boardId, newShape });
      setShapes((prev) => [...prev, newShape]);
    }
    setTextInput({ visible: false, x: 0, y: 0, value: "", id: null });
  };

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
    <div className="w-full h-screen flex flex-col bg-gray-50">
      <div className="flex justify-between items-center px-6 py-4 bg-white shadow-lg">
        <span className="text-lg font-semibold text-gray-800">Board Code: {code}</span>
        <button  onClick={handleCopyCode} className="flex items-center gap-2 px-5 py-2.5 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all duration-200">
          <FaShareAlt /> Share Board
        </button>
        <div className="flex items-center gap-6">
          <div className="relative group">
            <h1 className="text-sm font-semibold text-gray-800">Participants ({participants.length})</h1>
            <div className="absolute hidden group-hover:block bg-white shadow-md rounded-lg p-3 mt-2 z-10">
              <ul className="text-sm text-gray-600">
                {participants.map((p) => (
                  <li key={p} className="py-1">{p === user._id ? "You" : p}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
      {showToast && (
            <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg transition-all duration-200">
              Code copied to clipboard!
            </div>
          )}
      <div className="flex-1 flex justify-center items-center p-6 relative" ref={stageContainerRef}>
        <Stage
          ref={stageRef}
          width={window.innerWidth - 80}
          height={window.innerHeight - 180}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="bg-white shadow-xl rounded-xl border border-gray-200"
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
                return (
                  <Rect
                    key={`${shape.id}-${index}`}
                    {...shapeProps}
                    x={shape.x}
                    y={shape.y}
                    width={shape.width}
                    height={shape.height}
                    fill={shape.fill}
                    stroke={shape.stroke}
                    strokeWidth={shape.strokeWidth}
                  />
                );
              } else if (shape.type === "circle") {
                return (
                  <Circle
                    key={`${shape.id}-${index}`}
                    {...shapeProps}
                    x={shape.x}
                    y={shape.y}
                    radius={shape.radius}
                    fill={shape.fill}
                    stroke={shape.stroke}
                    strokeWidth={shape.strokeWidth}
                  />
                );
              } else if (shape.type === "triangle") {
                return (
                  <RegularPolygon
                    key={`${shape.id}-${index}`}
                    {...shapeProps}
                    x={shape.x}
                    y={shape.y}
                    sides={3}
                    radius={shape.radius}
                    fill={shape.fill}
                    stroke={shape.stroke}
                    strokeWidth={shape.strokeWidth}
                  />
                );
              } else if (shape.type === "pen" && shape.id !== currentDrawingId.current) {
                return (
                  <Line
                    key={`${shape.id}-${index}`}
                    {...shapeProps}
                    points={shape.points}
                    stroke={shape.stroke}
                    strokeWidth={shape.strokeWidth}
                    tension={0.5}
                    lineCap="round"
                  />
                );
              } else if (shape.type === "text") {
                return (
                  <Text
                    key={`${shape.id}-${index}`}
                    {...shapeProps}
                    x={shape.x}
                    y={shape.y}
                    text={shape.text}
                    fontSize={shape.fontSize}
                    fill={shape.fill}
                    stroke={shape.stroke}
                    strokeWidth={shape.strokeWidth}
                  />
                );
              }
              return null;
            })}
            {currentDrawing && (
              <Line
                id={currentDrawing.id}
                points={currentDrawing.points || []}
                stroke={currentDrawing.stroke}
                strokeWidth={currentDrawing.strokeWidth}
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

        {textInput.visible && (
          <input
            ref={textInputRef}
            type="text"
            value={textInput.value}
            onChange={(e) => setTextInput((prev) => ({ ...prev, value: e.target.value }))}
            onKeyDown={handleTextSubmit}
            onBlur={handleTextBlur}
            className="absolute p-2 border border-gray-300 rounded-lg shadow-md bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            style={{
              left: `${textInput.x}px`,
              top: `${textInput.y}px`,
              zIndex: 1000,
              width: '250px',
              fontSize: '16px',
            }}
            placeholder="Type your text..."
            autoFocus
          />
        )}
      </div>

      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 flex gap-4 bg-white shadow-2xl p-4 rounded-full border border-gray-200 items-center">
        {[
          { name: "select", icon: <FaMousePointer size={20} />, tooltip: "Select Tool" },
          { name: "square", icon: <FaSquare size={20} />, tooltip: "Square Tool" },
          { name: "circle", icon: <FaCircle size={20} />, tooltip: "Circle Tool" },
          { name: "triangle", icon: <FaPlay size={20} />, tooltip: "Triangle Tool" },
          { name: "pen", icon: <FaPen size={20} />, tooltip: "Pen Tool" },
          { name: "text", icon: <FaFont size={20} />, tooltip: "Text Tool" },
          { name: "eraser", icon: <FaEraser size={20} />, tooltip: "Eraser Tool" },
        ].map((item) => (
          <div key={item.name} className="relative group">
            <button
              className={`flex items-center justify-center w-12 h-12 rounded-full border transition-all duration-200 ${
                tool === item.name ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 hover:bg-gray-100 border-gray-300"
              }`}
              onClick={() => {
                setTool(item.name);
                if (item.name !== "select") setSelectedId(null);
              }}
            >
              {item.icon}
            </button>
            <span className="absolute bottom-14 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {item.tooltip}
            </span>
          </div>
        )) }

        <div className="flex items-center gap-4 ml-6">
          <label className="text-sm font-semibold text-gray-800">Width:</label>
          <select
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
            className="p-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={1}>1px</option>
            <option value={2}>2px</option>
            <option value={4}>4px</option>
            <option value={6}>6px</option>
            <option value={8}>8px</option>
          </select>
        </div>

        <div className="flex items-center gap-4">
          <label className="text-sm font-semibold text-gray-800">Fill Color:</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-10 h-10 p-1 border-2 border-gray-200 rounded-full cursor-pointer hover:border-blue-500 transition-all duration-200"
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="text-sm font-semibold text-gray-800">Stroke Color:</label>
          <input
            type="color"
            value={stroke}
            onChange={(e) => setStroke(e.target.value)}
            className="w-10 h-10 p-1 border-2 border-gray-200 rounded-full cursor-pointer hover:border-blue-500 transition-all duration-200"
          />
        </div>
      </div>
    </div>
  );
};

export default BoardPage;