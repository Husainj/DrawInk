import { useState, useEffect, useRef } from "react";
import { Stage, Layer, Rect, Circle, Line, RegularPolygon, Transformer } from "react-konva";
import { FaSquare, FaCircle, FaPlay, FaPen, FaEraser, FaShareAlt, FaMousePointer, FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";
import { useParams } from "react-router-dom";
import api from "../services/api.js";
import io from "socket.io-client";
import { useSelector } from "react-redux";
import Peer from "peerjs";

const BoardPage = () => {
  const { boardId } = useParams();
  const [tool, setTool] = useState("select");
  const [shapes, setShapes] = useState([]);
  const [currentDrawing, setCurrentDrawing] = useState(null);
  const [board, setBoard] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [code, setCode] = useState();
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [videoStates, setVideoStates] = useState(new Map());
  const isDrawing = useRef(false);
  const isErasing = useRef(false);
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [color, setColor] = useState("#FFFFFF"); // Fill color
  const [stroke, setStroke] = useState("#000000"); // Stroke color
  const stageRef = useRef(null);
  const transformerRef = useRef(null);
  const currentDrawingId = useRef(null);
  const batchedPoints = useRef([]);
  const socketRef = useRef(null);
  const user = useSelector((state) => state.auth.user);

  const [peer, setPeer] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const localStreamRef = useRef(null);
  const videoContainerRef = useRef(null);
  const peerConnections = useRef(new Map());

  const batchInterval = 500;

  const generatePeerId = () => `${user._id}-${Math.random().toString(36).substr(2, 5)}`;

  useEffect(() => {
    socketRef.current = io("http://localhost:8000", {
      auth: { userId: user._id },
    });

    const socket = socketRef.current;
    socket.emit("joinBoard", boardId);

    const initializePeer = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localStreamRef.current = stream;
        addVideoStream(user._id, stream, true);
        setVideoStates((prev) => new Map(prev).set(user._id, true));

        const peerInstance = new Peer(generatePeerId(), {
          debug: 3,
        });

        peerInstance.on("open", (id) => {
          console.log("Connected to PeerJS cloud with ID:", id);
          setPeer(peerInstance);
          socket.emit("peerConnected", { boardId, userId: user._id });
        });

        peerInstance.on("call", (call) => {
          if (call.peer.includes(user._id)) {
            console.log("Ignoring self-call from:", call.peer);
            call.close();
            return;
          }

          console.log("Receiving call from:", call.peer);
          peerConnections.current.set(call.peer, call);
          call.answer(localStreamRef.current);

          call.on("stream", (remoteStream) => {
            console.log("Received remote stream:", remoteStream);
            setRemoteStreams((prev) => {
              const newMap = new Map(prev);
              newMap.set(call.peer, remoteStream);
              return newMap;
            });
            setVideoStates((prev) => new Map(prev).set(call.peer, true));
          });

          call.on("close", () => {
            console.log("Call closed with:", call.peer);
            setRemoteStreams((prev) => {
              const newMap = new Map(prev);
              newMap.delete(call.peer);
              return newMap;
            });
            setVideoStates((prev) => {
              const newMap = new Map(prev);
              newMap.delete(call.peer);
              return newMap;
            });
            peerConnections.current.delete(call.peer);
          });
        });

        peerInstance.on("error", (err) => {
          console.error("PeerJS error:", err);
        });
      } catch (error) {
        console.error("Media device error:", error);
      }
    };

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
    initializePeer();

    socket.on("userJoined", (data) => {
      console.log("User joined board:", data.userId);
      setParticipants(data.participants);
      if (data.userId !== user._id && peer && localStreamRef.current) {
        connectToPeer(data.userId);
      }
    });

    socket.on("peerConnected", (data) => {
      console.log("Peer connected:", data.userId);
      if (data.userId !== user._id && peer && localStreamRef.current) {
        connectToPeer(data.userId);
      }
    });

    socket.on("userLeft", (data) => {
      console.log("User left board:", data.userId);
      if (peerConnections.current.has(data.userId)) {
        peerConnections.current.get(data.userId).close();
        peerConnections.current.delete(data.userId);
        setRemoteStreams((prev) => {
          const newMap = new Map(prev);
          newMap.delete(data.userId);
          return newMap;
        });
        setVideoStates((prev) => {
          const newMap = new Map(prev);
          newMap.delete(data.userId);
          return newMap;
        });
      }
    });

    socket.on("videoToggled", (data) => {
      console.log("Video toggled for:", data.userId, "to:", data.isVideoOn);
      setVideoStates((prev) => new Map(prev).set(data.userId, data.isVideoOn));
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
      peerConnections.current.forEach((connection) => connection.close());
      if (peer) peer.destroy();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [boardId, user._id]);

  const connectToPeer = (peerId) => {
    if (peerId === user._id || peerConnections.current.has(peerId)) return;

    try {
      console.log("Calling peer:", peerId);
      const call = peer.call(peerId, localStreamRef.current);
      peerConnections.current.set(peerId, call);

      call.on("stream", (remoteStream) => {
        console.log("Received stream from peer:", peerId);
        setRemoteStreams((prev) => {
          const newMap = new Map(prev);
          newMap.set(peerId, remoteStream);
          return newMap;
        });
      });

      call.on("close", () => {
        console.log("Call closed with:", peerId);
        setRemoteStreams((prev) => {
          const newMap = new Map(prev);
          newMap.delete(peerId);
          return newMap;
        });
        setVideoStates((prev) => {
          const newMap = new Map(prev);
          newMap.delete(peerId);
          return newMap;
        });
        peerConnections.current.delete(peerId);
      });

      call.on("error", (err) => {
        console.error("Call error with peer:", peerId, err);
        peerConnections.current.delete(peerId);
      });
    } catch (err) {
      console.error("Error connecting to peer:", peerId, err);
    }
  };

  useEffect(() => {
    if (!videoContainerRef.current) return;
    const container = videoContainerRef.current;
    container.innerHTML = "";

    if (localStreamRef.current) {
      addVideoStream(user._id, localStreamRef.current, true);
    }

    remoteStreams.forEach((stream, peerId) => {
      if (peerId !== user._id) {
        addVideoStream(peerId, stream, false);
      }
    });
  }, [remoteStreams, videoStates]);

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

  const addVideoStream = (id, stream, isLocal = false) => {
    if (videoContainerRef.current.querySelector(`#video-${id}`)) {
      console.log(`Video for ${id} already exists, skipping`);
      return;
    }

    const videoContainer = document.createElement("div");
    videoContainer.className = "relative";
    videoContainer.id = `container-${id}`;

    const isVideoEnabled = videoStates.get(id) ?? true;
    let element;

    if (isVideoEnabled && stream) {
      element = document.createElement("video");
      element.srcObject = stream;
      element.autoplay = true;
      element.playsInline = true;
      element.muted = isLocal;
    } else {
      element = document.createElement("div");
      element.className = "flex items-center justify-center bg-gray-700 text-white";
      element.textContent = isLocal ? "You" : id;
    }

    element.id = `video-${id}`;
    element.className = "w-32 h-24 object-cover rounded-lg shadow-md";

    const label = document.createElement("div");
    label.className = "absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 text-center";
    label.textContent = isLocal ? "You" : id;

    videoContainer.appendChild(element);
    videoContainer.appendChild(label);
    videoContainerRef.current.appendChild(videoContainer);
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
        setVideoStates((prev) => new Map(prev).set(user._id, videoTrack.enabled));
        socketRef.current.emit("videoToggled", { boardId, userId: user._id, isVideoOn: videoTrack.enabled });
        console.log("Video toggled to:", videoTrack.enabled);
      } else {
        console.error("No video track available to toggle");
      }
    } else {
      console.error("No local stream available");
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioOn(audioTrack.enabled);
        console.log("Audio toggled to:", audioTrack.enabled);
      } else {
        console.error("No audio track available to toggle");
      }
    } else {
      console.error("No local stream available");
    }
  };

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
        stroke: stroke, // Use selected stroke color
        strokeWidth: strokeWidth,
        id: newId,
      };
      batchedPoints.current = [pos.x, pos.y];
      socketRef.current.emit("addElement", { boardId, newShape });
      setCurrentDrawing(newShape);
    } else {
      const shapeProps = {
        x: pos.x,
        y: pos.y,
        fill: color, // Use selected fill color
        stroke: stroke, // Use selected stroke color
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
          <button onClick={toggleVideo} className={`p-2 rounded-full ${isVideoOn ? "bg-green-500" : "bg-red-500"} text-white`}>
            {isVideoOn ? <FaVideo /> : <FaVideoSlash />}
          </button>
          <button onClick={toggleAudio} className={`p-2 rounded-full ${isAudioOn ? "bg-green-500" : "bg-red-500"} text-white`}>
            {isAudioOn ? <FaMicrophone /> : <FaMicrophoneSlash />}
          </button>
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

      <div ref={videoContainerRef} className="flex flex-wrap gap-2 p-2 bg-gray-200 border-b border-gray-300 overflow-auto max-h-32" />

      <div className="flex-1 flex justify-center items-center p-4">
        <Stage
          ref={stageRef}
          width={window.innerWidth - 50}
          height={window.innerHeight - 150} // Adjusted height since we removed the extra toolbar
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
      </div>

      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex gap-3 bg-white shadow-lg p-3 rounded-full border border-gray-300 items-center">
        {/* Tool Buttons */}
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