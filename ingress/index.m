conn = sqlite("../prisma/dev.db");

% Create a figure for the UI
uiFig = figure('Name', 'Session Progress', 'Position', [100, 100, 600, 200], 'NumberTitle', 'off');

% Add UI components for displaying information
sessionInfo = uicontrol('Style', 'text', 'Position', [10, 150, 580, 40], 'FontSize', 12, 'HorizontalAlignment', 'left');
driverInfo = uicontrol('Style', 'text', 'Position', [10, 100, 580, 40], 'FontSize', 12, 'HorizontalAlignment', 'left');
locationInfo = uicontrol('Style', 'text', 'Position', [10, 50, 580, 40], 'FontSize', 12, 'HorizontalAlignment', 'left');

drawnow; % Force MATLAB to draw the UI components

startSessionIndex = 1; % Start from session 3
startDriverIndex = 1;  % Start from driver 7

% Adjust the SQL query to focus on sessions and then join drivers
sessions = fetch(conn, "SELECT s.sessionKey, s.sessionName, s.sessionType, s.startDate, s.endDate, m.name AS meetingName, json_group_array( json_object( 'driverKey', d.driverKey, 'firstName', d.firstName, 'lastName', d.lastName, 'fullName', d.fullName, 'headshotUrl', IFNULL(d.headshotUrl, ''), 'acronym', d.acronym, 'teamName', d.teamName, 'teamColor', d.teamColor, 'countryKey', IFNULL(d.countryKey, '') ) ) AS drivers FROM Session s JOIN Meeting m ON s.meetingKey = m.meetingKey JOIN _DriverToSession dts ON s.sessionKey = dts.B JOIN Driver d ON dts.A = d.driverKey GROUP BY s.sessionKey;");

% Delete everything from the Location table
% exec(conn, "DELETE FROM Location;");

overallIterator = 1;
% Iterate through each session
for i = 1:height(sessions)
    if i < startSessionIndex
        continue; % Skip sessions until the starting session is reached
    end

    sessionTable = sessions(i, :);
    % Convert the table to a struct
    session = table2struct(sessionTable);

    sessionInfoStr = sprintf('Processing Session %d of %d: %s (%s)', i, height(sessions), session.sessionName, session.meetingName);
    set(sessionInfo, 'String', sessionInfoStr);
    drawnow;

    % session.drivers is a string which is a JSON array of objects. Convert it to an array of structs
    drivers = jsondecode(session.drivers);
    for j = 1:length(drivers)
        if i == startSessionIndex && j < startDriverIndex
            continue; % Skip drivers in the starting session until the starting driver is reached
        end
        overallIterator = overallIterator + 1;
        driver = drivers(j);

        driverInfoStr = sprintf('Processing Driver %d of %d: %s (%s)', j, length(drivers), driver.fullName, driver.acronym);
        set(driverInfo, 'String', driverInfoStr);
        drawnow;

        fprintf('Getting Locations [Session (%d/%d) | Driver %s (%d/%d)]\n', i, height(sessions), driver.acronym, j, length(drivers));

        % Make an API call to GET `https://api.openf1.org/v1/location?driver_number=${driver.driverKey}&session_key=${session.sessionKey}`
        url = sprintf('https://api.openf1.org/v1/location?driver_number=%d&session_key=%d', driver.driverKey, session.sessionKey);
        options = weboptions('RequestMethod', 'GET', 'Timeout', 30, 'ContentType', 'json');
        response = webread(url, options);
        % Response will be in JSON and will be a long array of objects. Each object will have a date, driver_number, x, y, z, and session_key. We need to insert these into the database's table `Location`. Location has columns id (which we need to set to a uuid), datetime, x, y, z, driverKey (which connects to the Driver table), and sessionKey (which connects to the Session table).

        javaTimeStart = java.lang.System.nanoTime();

        for k = 1:length(response)
            % Record the start time in nanoseconds
            startTime = java.lang.System.nanoTime();

            percentage = (k / length(response)) * 100; % Calculate the percentage
            locationInfoStr = sprintf('Inserting Location %d of %d (%.2f%%)', k, length(response), percentage);
            set(locationInfo, 'String', locationInfoStr);
            if mod(k, 10) == 0 % Update UI every 10 locations to minimize performance impact
                drawnow;
            end

            location = response(k);
            % Insert the location into the database
            insert(conn, 'Location', {'id', 'datetime', 'x', 'y', 'z', 'driverKey', 'sessionKey'}, {char(matlab.lang.internal.uuid()), location.date, location.x, location.y, location.z, driver.driverKey, session.sessionKey});

            % Record the end time in nanoseconds
            endTime = java.lang.System.nanoTime();

            % Calculate the duration in milliseconds
            durationMs = (endTime - startTime) / 1e6; % 1e6 nanoseconds in a millisecond

            fprintf('Inserted Location (%d/%d) in %.3f ms\n', k, length(response), durationMs);
        end
        startDriverIndex = 1; % Reset the starting driver index
    end
end

set(sessionInfo, 'String', 'All sessions processed.');
set(driverInfo, 'String', '');
set(locationInfo, 'String', '');
drawnow;