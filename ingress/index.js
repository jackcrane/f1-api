import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import axios from "axios";

const config = {
  driver: false,
  country: false,
  circuit: false,
  meeting: false,
  session: false,
  driverSession: false,
  location: true,
};

const translateDriverToModel = (driver) => {
  return {
    driverKey: driver.driver_number,
    firstName: driver.first_name,
    lastName: driver.last_name,
    fullName: driver.full_name,
    headshotUrl: driver.headshot_url,
    acronym: driver.name_acronym,
    teamName: driver.team_name,
    teamColor: driver.team_colour,
  };
};

const translateCountryToModel = (country) => {
  return {
    countryKey: country.country_key,
    countryCode: country.country_code,
    countryName: country.country_name,
  };
};

const ingress = async () => {
  // Drivers //
  if (config.driver) {
    const response = await axios.get("https://api.openf1.org/v1/drivers");
    // The response is a JSON array of drivers and driver participation in sessions. Add the drivers to the database. There should be no duplicate drivers.
    const drivers = response.data;
    for (const driver of drivers) {
      const translated = translateDriverToModel(driver);
      // Make sure driverKey, firstName, teamName, and lastName are not null
      if (
        !translated.driverKey ||
        !translated.firstName ||
        !translated.teamName ||
        !translated.lastName
      ) {
        continue;
      }
      const newdriver = await prisma.driver.upsert({
        where: { driverKey: driver.driver_number },
        update: translated,
        create: translated,
      });
      console.log(`Created or updated driver ${driver.full_name}`);
    }
  }

  // Countries //
  if (config.country) {
    const response = await axios.get("https://api.openf1.org/v1/meetings");
    const meetings = response.data;
    for (const meeting of meetings) {
      // Upsert the country
      const country = translateCountryToModel(meeting);
      const newCountry = await prisma.country.upsert({
        where: { countryKey: country.countryKey },
        update: country,
        create: country,
      });
      console.log(`Created or updated country ${meeting.country_name}`);
    }
  }

  // Circuits //
  if (config.circuit) {
    const response = await axios.get("https://api.openf1.org/v1/meetings");
    const meetings = response.data;
    for (const meeting of meetings) {
      // Upsert the circuit
      const circuitToUpsert = {
        circuitKey: meeting.circuit_key,
        shortName: meeting.circuit_short_name,
        country: {
          connect: {
            countryKey: meeting.country_key,
          },
        },
      };
      try {
        const newCircuit = await prisma.circuit.upsert({
          where: { circuitKey: meeting.circuit_key },
          update: circuitToUpsert,
          create: circuitToUpsert,
        });
        console.log(`Created or updated circuit ${meeting.circuit_short_name}`);
      } catch (error) {
        console.log(
          `Error creating or updating circuit ${meeting.circuit_short_name}`
        );
      }
    }
  }

  // Meetings //
  if (config.meeting) {
    const response = await axios.get("https://api.openf1.org/v1/meetings");
    const meetings = response.data;
    for (const meeting of meetings) {
      // Upsert the meeting
      const meetingToUpsert = {
        meetingKey: meeting.meeting_key,
        startDate: new Date(meeting.date_start),
        name: meeting.meeting_name,
        longName: meeting.meeting_official_name,
        year: meeting.year,
        circuit: {
          connect: {
            circuitKey: meeting.circuit_key,
          },
        },
      };
      try {
        const newMeeting = await prisma.meeting.upsert({
          where: { meetingKey: meeting.meeting_key },
          update: meetingToUpsert,
          create: meetingToUpsert,
        });
        console.log(`Created or updated meeting ${meeting.meeting_name}`);
      } catch (error) {
        console.log(
          `Error creating or updating meeting ${meeting.meeting_name}`
        );
      }
    }
  }

  // Sessions //
  if (config.session) {
    const response = await axios.get("https://api.openf1.org/v1/sessions");
    const sessions = response.data;
    for (const session of sessions) {
      await prisma.circuit.upsert({
        where: { circuitKey: session.circuit_key },
        update: {
          circuitKey: session.circuit_key,
          location: session.location,
          gmtOffset: session.gmt_offset,
          shortName: session.circuit_short_name,
        },
        create: {
          circuitKey: session.circuit_key,
          location: session.location,
          gmtOffset: session.gmt_offset,
          shortName: session.circuit_short_name,
        },
      });
      // Upsert the session
      const sessionToUpsert = {
        sessionKey: session.session_key,
        startDate: new Date(session.date_start),
        endDate: new Date(session.date_end),
        meeting: {
          connect: {
            meetingKey: session.meeting_key,
          },
        },
        sessionName: session.session_name,
        sessionType: session.session_type,
      };
      try {
        const newSession = await prisma.session.upsert({
          where: { sessionKey: session.session_key },
          update: sessionToUpsert,
          create: sessionToUpsert,
        });
        console.log(`Created or updated session ${session.session_name}`);
      } catch (error) {
        console.log(
          `Error creating or updating session ${session.session_name}`
        );
      }
    }
  }

  // Connect drivers to sessions //
  if (config.driverSession) {
    const response = await axios.get("https://api.openf1.org/v1/drivers");
    const drivers = response.data;
    for (const driver of drivers) {
      // driver.session_key is a session key. Connect the driver (driver_number) to the session.
      const driverKey = driver.driver_number;
      const sessionKey = driver.session_key;
      if (driverKey && sessionKey) {
        const driver = await prisma.driver.findUnique({
          where: { driverKey },
        });
        const session = await prisma.session.findUnique({
          where: { sessionKey },
        });
        if (driver && session) {
          await prisma.driver.update({
            where: { driverKey },
            data: {
              session: {
                connect: {
                  sessionKey,
                },
              },
            },
          });
          console.log(`Connected driver ${driverKey} to session ${sessionKey}`);
        }
      }
    }
  }

  // Create location record //
  if (config.location) {
    const drivers = await prisma.driver.findMany();
    let driverIterator = 0;
    for (const driver of drivers) {
      driverIterator++;
      const sessions = await prisma.session.findMany({
        where: {
          drivers: {
            some: {
              driverKey: driver.driverKey,
            },
          },
        },
      });
      let sessionIterator = 0;
      for (const session of sessions) {
        sessionIterator++;
        console.log(
          `Getting locations for driver ${driver.driverKey} in session ${session.sessionKey}`
        );
        const response = await axios.get(
          `https://api.openf1.org/v1/location?driver_number=${driver.driverKey}&session_key=${session.sessionKey}`
        );
        const locations = response.data;
        let locationIterator = 0;
        for (const location of locations) {
          const startTime = new Date();
          locationIterator++;
          const locationToUpsert = {
            driver: {
              connect: {
                driverKey: driver.driverKey,
              },
            },
            session: {
              connect: {
                sessionKey: session.sessionKey,
              },
            },
            x: location.x,
            y: location.y,
            z: location.z,
            datetime: new Date(location.date),
          };
          try {
            const existingLocation = await prisma.location.findFirst({
              where: {
                driverKey: driver.driverKey,
                sessionKey: session.sessionKey,
                datetime: new Date(location.date),
              },
            });
            if (existingLocation) {
              await prisma.location.update({
                where: { id: existingLocation.id },
                data: locationToUpsert,
              });
              const endTime = new Date();
              console.log(
                `[Driver: ${driverIterator}/${
                  drivers.length
                } | Session: ${sessionIterator}/${
                  sessions.length
                } | Location: ${locationIterator}/${locations.length}/${(
                  (locationIterator / locations.length) *
                  100
                ).toFixed(4)}% | Total ${
                  (driverIterator / drivers.length) *
                  (sessionIterator / sessions.length) *
                  (locationIterator / locations.length) *
                  100
                }%] [Row time ${
                  endTime - startTime
                }ms] Updated location for driver ${
                  driver.driverKey
                } in session ${session.sessionKey}`
              );
            } else {
              await prisma.location.create({
                data: locationToUpsert,
              });
              const endTime = new Date();
              console.log(
                `[Driver: ${driverIterator}/${
                  drivers.length
                } | Session: ${sessionIterator}/${
                  sessions.length
                } | Location: ${locationIterator}/${locations.length}/${(
                  (locationIterator / locations.length) *
                  100
                ).toFixed(4)}% | Total ${
                  (driverIterator / drivers.length) *
                  (sessionIterator / sessions.length) *
                  (locationIterator / locations.length) *
                  100
                }%] [Row time ${
                  endTime - startTime
                }ms] Created location for driver ${
                  driver.driverKey
                } in session ${session.sessionKey}`
              );
            }
          } catch (error) {
            console.log(
              `Error creating or updating location for driver ${driver.driverKey} in session ${session.sessionKey}`
            );
            console.error(error);
          }
        }
      }
    }
  }
};

ingress();
