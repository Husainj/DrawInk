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
  const [board, setBoard] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [participants,  setParticipants] = useState([]);
  const [code , setCode] = useState()
  const isDrawing = useRef(false);
  const isErasing = useRef(false);
  const stageRef = useRef(null);
  const transformerRef = useRef(null);
  const user = useSelector((state) => state.auth.user);


  const socket = io("http://localhost:8000" , {
    auth : {
      userId : user._id, 
    }
  });

  useEffect(() => {
    const fetchBoardData = async () => {
      try {
        const response = await api.get(`/boards/${boardId}`);
        setBoard(response.data.data);
        setCode(response.data.data.code)
      } catch (error) {
        console.error("Error fetching board data:", error);
      }
    };
    fetchBoardData();

    socket.emit("joinBoard", boardId);

    // Listen for userJoined events
    socket.on("userJoined", (data) => {
      console.log("User joined:", data.userId);
      setParticipants(data.participants); // Update the participants list
    });

    // const handleBeforeUnload = () => {
    //   socket.emit("leaveBoard", { boardId, userId: user._id });
    // };

    // window.addEventListener("beforeunload", handleBeforeUnload);

    socket.on("initialShapes", (shapes) => {
      setShapes(shapes); // Set the initial shapes
      console.log("INITIAL SHAPES : " , shapes)
    });



    return () => {
      // Clean up event listeners
      // window.removeEventListener("beforeunload", handleBeforeUnload);
      socket.off("userJoined");
      socket.off("initialShapes");
      // socket.disconnect();
    };
  }, [boardId, user._id]);

  useEffect(() => {
    if (selectedId && transformerRef.current) {
      const node = stageRef.current.findOne('#' + selectedId);
      if (node) {
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer().batchDraw();
      }
    }
  }, [selectedId]);

  useEffect(() => {
    socket.on("elementAdded", (shape) => {
      setShapes((prev) => [...prev, shape]);
    });

    socket.on("elementUpdated", (element) => {
      setShapes((prev) =>
        prev.map((s) => (s.id === element.id ? element : s))
      );
    });


    socket.on("elementDeleted", (elementId) => {
      setShapes((prev) => prev.filter((s) => s.id !== elementId));
    });

    // Clean up socket listeners
    return () => {
      socket.off("elementAdded");
      socket.off("elementUpdated");
      socket.off("elementDeleted");
    };
  }, []);

  const handleMouseDown = (e) => {
    if (tool === "select") {
      if (e.target === e.target.getStage()) {
        setSelectedId(null);
        return;
      }
      return;
    }

    if (tool === "eraser") {
      isErasing.current = true;
      // Get the clicked shape
      const clickedShape = e.target;
      if (clickedShape && clickedShape !== e.target.getStage()) {
        // Delete the shape by filtering it out from the shapes array
        socket.emit("deleteElement", { boardId, elementId: clickedShape.attrs.id });
        setShapes(shapes.filter(shape => shape.id !== clickedShape.attrs.id));
        console.log("DELETE SHAPE ID : " , clickedShape.attrs.id)
       
      }
      return;
    }

    const pos = e.target.getStage().getPointerPosition();
    let newShape;
    const timestamp = Date.now();
    const newId = timestamp.toString();

    if (tool === "pen") {
      isDrawing.current = true;
      newShape = {
        type: "pen",
        points: [pos.x, pos.y],
        stroke: "#2D3748",
        id: newId,
      };
    } else {
      const shapeProps = {
        x: pos.x,
        y: pos.y,
        fill: "#4299E1",
        id: newId,
        draggable: true,
      };
      if (tool === "square") newShape = { ...shapeProps, type: "square", width: 60, height: 60 };
      else if (tool === "circle") newShape = { ...shapeProps, type: "circle", radius: 30 };
      else if (tool === "triangle") newShape = { ...shapeProps, type: "triangle", radius: 50 };
    }
    socket.emit("addElement", { boardId, newShape });
    setShapes((prev) => [...prev, newShape]);
    console.log("SHAPES ON BOARD PAGE : ", shapes);
  };

  const handleMouseMove = (e) => {
    if (tool === "eraser" && isErasing.current) {
      // Get all shapes under the current pointer position
      const pos = e.target.getStage().getPointerPosition();
      const shape = e.target.getStage().getIntersection(pos);
      
      if (shape && shape !== e.target.getStage()) {
        // Delete the shape that the eraser is hovering over
        socket.emit("deleteElement", { boardId, elementId: shape.attrs.id });
        setShapes(prevShapes => prevShapes.filter(s => s.id !== shape.attrs.id));
      }
      return;
    }

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
    isErasing.current = false;
  };

  const handleTransformEnd = (e) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    node.scaleX(1);
    node.scaleY(1);

    let updatedShape = null;

    const updatedShapes = shapes.map(shape => {
      if (shape.id === node.id()) {
        if (shape.type === "circle") {
          updatedShape = {
            ...shape,
            radius: shape.radius * scaleX,
            x: node.x(),
            y: node.y(),
          };
        } else if (shape.type === "square") {
          updatedShape = {
            ...shape,
            width: node.width() * scaleX,
            height: node.height() * scaleY,
            x: node.x(),
            y: node.y(),
          };
        } else if (shape.type === "triangle") {
          updatedShape = {
            ...shape,
            radius: shape.radius * scaleX,
            x: node.x(),
            y: node.y(),
          };
        }
        return updatedShape;
      }
      return shape;
    });
  
    setShapes(updatedShapes);
  
    if (updatedShape) {
      socket.emit("updateElement", { boardId, updatedShape });
    }
  };

  const handleDragEnd = (e) => {
    console.log("Dragged Element ID:", e.target);
    console.log("Current Shapes:", shapes); // Check if the shape IDs match
  
    setShapes((prevShapes) => {
      const updatedShapes = prevShapes.map((shape) =>
        shape.id === e.target.id()
          ? { ...shape, x: e.target.x(), y: e.target.y() }
          : shape
      );
  
      console.log("Updated Shapes Array:", updatedShapes);
  
      const updatedShape = updatedShapes.find(
        (shape) => shape.id === e.target.id()
      );
  
      console.log("UPDATED ELEMENT IN THE BOARD PAGE:", updatedShape);
  
      if (updatedShape) {
        socket.emit("updateElement", { boardId, updatedShape });
      }
  
      return updatedShapes;
    });
  };
  

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
                return (
                  <Rect
                    key={`${shape.id}-${index}`}
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
                    key={`${shape.id}-${index}`}
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
                    key={`${shape.id}-${index}`}
                    {...shapeProps}
                    x={shape.x}
                    y={shape.y}
                    sides={3}
                    radius={shape.radius}
                    fill={shape.fill}
                  />
                );
              } else if (shape.type === "pen") {
                return (
                  <Line
                    key={`${shape.id}-${index}`}
                    {...shapeProps}
                    points={shape.points}
                    stroke={shape.stroke}
                    strokeWidth={2}
                    tension={0.5}
                    lineCap="round"
                  />
                );
              }
              return null;
            })}
            {selectedId && tool === "select" && (
              <Transformer
                ref={transformerRef}
                boundBoxFunc={(oldBox, newBox) => {
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