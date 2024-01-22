:: Created by npm, please don't edit manually.
@ECHO OFF

SETLOCAL

SET "NODE_EXE=%~dp0\node.exe"
IF NOT EXIST "%NODE_EXE%" (
  SET "NODE_EXE=node"
)

set PATH=%PATH%;C:\Users\geeta\CFA-l2\spring-react-web\demo\node
rem SET "NPM_CLI_JS=%~dp0\node_modules\npm\bin\npm-cli.js"
SET "NPM_CLI_JS=C:\Users\geeta\CFA-l2\spring-react-web\demo\node\node_modules\npm\bin\npm-cli.js"
echo %NPM_CLI_JS%
FOR /F "delims=" %%F IN ('CALL "%NODE_EXE%" "%NPM_CLI_JS%" prefix -g') DO (
  SET "NPM_PREFIX_NPM_CLI_JS=%%F\node_modules\npm\bin\npm-cli.js"
)
IF EXIST "%NPM_PREFIX_NPM_CLI_JS%" (
  SET "NPM_CLI_JS=%NPM_PREFIX_NPM_CLI_JS%"
)

"%NODE_EXE%" "%NPM_CLI_JS%" %*
