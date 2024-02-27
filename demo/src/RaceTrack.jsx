import React, { useEffect, useRef, useState } from "react";

function RaceTrack() {
  const canvasRef = useRef(null);
  const ws = useRef(null);
  const [extents, setExtents] = useState({
    x: { min: 0, max: 0 },
    y: { min: 0, max: 0 },
  });

  useEffect(() => {
    ws.current = new WebSocket("ws://localhost:3000/echo");
    ws.current.onopen = () => {
      // Request session extents
      ws.current.send(
        JSON.stringify({ type: "session.extents", session: 9206 })
      );
      console.log("ws opened");
    };
    ws.current.onclose = () => console.log("ws closed");

    const context = canvasRef.current.getContext("2d");

    ws.current.onmessage = (e) => {
      const message = JSON.parse(e.data);
      console.log("Message Recieved", message.type);
      if (message.type === "session.extents") {
        // Update extents state
        setExtents(message.extents);

        ws.current.send(
          JSON.stringify({
            type: "stream.start",
            session: 9206,
          })
        );
      } else if (message.type === "stream.data") {
        drawCars(context, message.data);
      }
    };

    return () => {
      ws.current.close();
    };
  }, []);

  const [scale, setScale] = useState(1);
  useEffect(() => {
    const canvasWidth = canvasRef.current.width;
    const canvasHeight = canvasRef.current.height;
    console.log(extents.x.max - extents.x.min, extents.y.max - extents.y.min);
    const scaleX = canvasWidth / (extents.x.max - extents.x.min);
    const scaleY = canvasHeight / (extents.y.max - extents.y.min);
    console.log(scaleX, scaleY);
    const smallerScale = Math.min(scaleX, scaleY);
    console.log(smallerScale);
    setScale(smallerScale);
  }, [extents]);

  const drawCars = (context, cars) => {
    context.fillStyle = "rgba(0, 0, 0, 0.1)";
    context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    const canvasWidth = canvasRef.current.width;
    const canvasHeight = canvasRef.current.height;

    cars.forEach((car) => {
      const x = car.x * (scale / 20) + 200;
      const y = car.y * (scale / 20) + 250;

      context.beginPath();
      context.arc(x, canvasHeight - y, 3, 0, 2 * Math.PI); // Flip y-axis to match canvas coordinates
      context.fillStyle = "red"; // Use a default color or add logic to assign colors based on car data
      context.fill();
    });
  };

  return (
    <>
      {scale}
      <canvas ref={canvasRef} width={1000} height={1000} />
    </>
  );
}

export default RaceTrack;
