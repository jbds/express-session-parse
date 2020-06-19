c:\
cd c:\users\administrator\js\express-session-parse
wmic process where "commandline like '%%server.js%%' AND name='node.exe' " CALL Terminate
node.exe server.js