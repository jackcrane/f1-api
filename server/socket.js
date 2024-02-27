import express from "express";
import ws from "express-ws";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid"; // For generating unique IDs

const prisma = new PrismaClient();
const app = express();
ws(app);

// Store active streams by a unique identifier for each stream
const activeStreams = {};

app.ws("/echo", (ws, req) => {
  ws.on("message", (msg) => {
    const message = JSON.parse(msg);
    switch (message.type) {
      case "ping":
        ws.send(JSON.stringify({ type: "pong" }));
        break;
      case "stream.start":
        // Generate a unique ID for the new stream
        var streamId = uuidv4();
        // Start the stream and store its interval ID using the streamId
        activeStreams[streamId] = startStream(
          (data) => ws.send(data),
          message.session
        );
        // Send back the streamId to the client
        ws.send(JSON.stringify({ type: "stream.started", streamId: streamId }));
        break;
      case "stream.stop":
        // Use the streamId provided by the client to stop the correct stream
        var { streamId } = message;
        if (activeStreams[streamId]) {
          clearInterval(activeStreams[streamId]);
          delete activeStreams[streamId];
          ws.send(
            JSON.stringify({ type: "stream.stopped", streamId: streamId })
          );
        } else {
          ws.send(
            JSON.stringify({ type: "error", message: "Stream not found" })
          );
        }
        break;
      case "session.extents":
        findExtentsOfSession(message.session).then((extents) => {
          ws.send(
            JSON.stringify({
              type: "session.extents",
              extents,
            })
          );
        });
        break;
      default:
        ws.send(
          JSON.stringify({ type: "error", message: "Unknown message type" })
        );
    }
  });
});

app.listen(3000);

const speed = 200;
const scrubRate = 1;
const startStream = async (send, session) => {
  // Initial setup remains the same
  const sessionData = await prisma.session.findFirst({
    where: { sessionKey: session },
    include: { meeting: { include: { circuit: true } } },
  });
  const uncorrectedStartTime = new Date(
    parseInt(sessionData.startDate.toString().replace("n", ""))
  );
  const gmtOffset = sessionData.meeting.circuit.gmtOffset;
  const hoursOffset = parseInt(gmtOffset.slice(0, 3), 10);
  const minutesOffset = parseInt(gmtOffset.slice(4, 6), 10);
  const totalOffsetMilliseconds =
    (hoursOffset * 60 + (hoursOffset < 0 ? -minutesOffset : minutesOffset)) *
    60 *
    1000;
  const startTime = new Date(
    uncorrectedStartTime.getTime() + totalOffsetMilliseconds
  );

  let secondsPastStartTime = 0;
  let lastFetchedTime = startTime;
  let batchData = [];
  let dataFetchInterval = 10 * 60 * 1000; // Interval to fetch new data

  const fetchBatchData = async (fromTime, toTime) => {
    return await prisma.$queryRaw`SELECT
      l.*
    FROM
      Location l
    WHERE
      l.datetime >= ${fromTime}
      AND l.datetime <= ${toTime}
      AND l.sessionKey = ${session}
    ORDER BY l.datetime ASC`;
  };

  const updateBatchData = async () => {
    const fromTime = lastFetchedTime.toISOString();
    const toTime = new Date(
      lastFetchedTime.getTime() + dataFetchInterval
    ).toISOString();
    batchData = await fetchBatchData(fromTime, toTime);
    lastFetchedTime = new Date(lastFetchedTime.getTime() + dataFetchInterval);
  };

  // Fetch initial batch data
  await updateBatchData();

  const int = setInterval(async () => {
    const currentTime = new Date(
      startTime.getTime() + secondsPastStartTime * 1000
    );
    if (currentTime >= lastFetchedTime) {
      console.log("Fetching new batch");
      await updateBatchData(); // Fetch new batch if current time surpasses the last fetched range
    } else {
      console.log("Using existing batch");
    }

    // Always return the most recent data up to the playhead time
    const mostRecentDataForEachDriver = {};
    batchData.forEach((item) => {
      const driverKey = item.driverKey;
      if (
        !mostRecentDataForEachDriver[driverKey] ||
        new Date(item.datetime) <= currentTime
      ) {
        mostRecentDataForEachDriver[driverKey] = item;
      }
    });

    const currentData = Object.values(mostRecentDataForEachDriver);

    // Always send data, ensuring there's always a response even if it's the last known location for each driver
    const queryStartTime = new Date();
    send(
      JSON.stringify({
        type: "stream.data",
        meta: {
          queryTime: new Date() - queryStartTime,
          playheadTime: currentTime.toISOString(),
        },
        data: currentData,
      })
    );

    secondsPastStartTime += (speed / 1000) * scrubRate;
  }, speed);

  setTimeout(() => {
    clearInterval(int);
    send(JSON.stringify({ type: "stream.activityCheck" }));
  }, 600000); // End stream after 10 minutes

  return int;
};

const findExtentsOfSession = async (session) => {
  // Find the maximum and minimum x and y values for locations in a session
  const data = await prisma.$queryRaw`SELECT
    MAX(x) AS maxX,
    MIN(x) AS minX,
    MAX(y) AS maxY,
    MIN(y) AS minY
  FROM
    Location
  WHERE
    sessionKey = ${session}`;

  const extents = {
    x: {
      min: parseInt(data[0].minX),
      max: parseInt(data[0].maxX),
    },
    y: {
      min: parseInt(data[0].minY),
      max: parseInt(data[0].maxY),
    },
  };

  return extents;
};
