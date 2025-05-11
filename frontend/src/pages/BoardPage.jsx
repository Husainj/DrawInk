import { useState, useEffect, useRef } from "react";
import { Stage, Layer, Rect, Circle, Line, RegularPolygon, Text, Transformer } from "react-konva";
import { FaSquare, FaCircle, FaPlay, FaPen, FaEraser, FaShareAlt, FaMousePointer, FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash, FaFont } from "react-icons/fa";
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
  const [color, setColor] = useState("#4299E1"); // Fill color
  const [stroke, setStroke] = useState("#000000"); // Stroke color
  const stageRef = useRef(null);
  const transformerRef = useRef(null);
  const currentDrawingId = useRef(null);
  const batchedPoints = useRef([]);
  const socketRef = useRef(null);
  const user = useSelector((state) => state.auth.user);

  // State for text input box
  const [textInput, setTextInput] = useState({
    visible: false,
    x: 0,
    y: 0,
    value: "",
    id: null,
  });
  const textInputRef = useRef(null);
  const stageContainerRef = useRef(null); // New ref for stage container

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
      console.log("User joined board:", data.userId);
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
      socket.emit("leaveBoard", { boardId, userId: user._id });
      socket.disconnect();
    };
  }, [boardId, user._id]);

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
      console.log("Text input should be visible at:", textInput.x, textInput.y);
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

    console.log("Mouse down at:", pos.x, pos.y, "with tool:", tool);

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
      console.log("Showing text input at:", pos.x, pos.y);
      
      // Get the stage container position
      const stageContainer = stageContainerRef.current;
      const containerRect = stageContainer.getBoundingClientRect();
      
      setTextInput({
        visible: true,
        x: pos.x + containerRect.left,
        y: pos.y + containerRect.top,
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
      const newShape = {
        type: "text",
        x: textInput.x - stageContainerRef.current.getBoundingClientRect().left,
        y: textInput.y - stageContainerRef.current.getBoundingClientRect().top,
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
      const newShape = {
        type: "text",
        x: textInput.x - stageContainerRef.current.getBoundingClientRect().left,
        y: textInput.y - stageContainerRef.current.getBoundingClientRect().top,
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
    <div className="w-full h-screen flex flex-col bg-gray-100">
      <div className="flex justify-between items-center px-6 py-3 bg-white shadow-md">
        <span className="text-gray-700 font-semibold">Board Code: {code}</span>
        <button className="flex items-center gap-2 px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600">
          <FaShareAlt /> Share
        </button>
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-sm font-semibold">Participants ({participants.length})</h1>
            <ul className="text-xs">
              {participants.map((p) => (
                <li key={p}>{p === user._id ? "You" : p}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="flex-1 flex justify-center items-center p-4 relative" ref={stageContainerRef}>
        <Stage
          ref={stageRef}
          width={window.innerWidth - 50}
          height={window.innerHeight - 150}
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

        {/* Text Input Box */}
        {textInput.visible && (
          <input
            ref={textInputRef}
            type="text"
            value={textInput.value}
            onChange={(e) => setTextInput((prev) => ({ ...prev, value: e.target.value }))}
            onKeyDown={handleTextSubmit}
            onBlur={handleTextBlur}
            className="absolute p-1 border rounded shadow-md bg-white"
            style={{
              left: `${textInput.x}px`,
              top: `${textInput.y}px`,
              zIndex: 10,
            }}
            placeholder="Type here..."
            autoFocus
          />
        )}
      </div>

      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex gap-3 bg-white shadow-lg p-3 rounded-full border border-gray-300 items-center">
        {/* Tool Buttons */}
        {["select", "square", "circle", "triangle", "pen", "text", "eraser"].map((shape) => (
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
            {shape === "text" && <FaFont size={18} />}
            {shape === "eraser" && <FaEraser size={18} />}
          </button>
        ))}

        {/* Stroke Width Selection */}
        <div className="flex items-center gap-2 ml-4">
          <label className="text-sm font-semibold">Width:</label>
          <select
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
            className="p-1 border rounded text-sm"
          >
            <option value={1}>1px</option>
            <option value={2}>2px</option>
            <option value={4}>4px</option>
            <option value={6}>6px</option>
            <option value={8}>8px</option>
          </select>
        </div>

        {/* Fill Color Selection */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold">Fill:</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-8 h-8 p-0 border-none cursor-pointer rounded"
          />
        </div>

        {/* Stroke Color Selection */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold">Stroke:</label>
          <input
            type="color"
            value={stroke}
            onChange={(e) => setStroke(e.target.value)}
            className="w-8 h-8 p-0 border-none cursor-pointer rounded"
          />
        </div>
      </div>
    </div>
  );
};

export default BoardPage;