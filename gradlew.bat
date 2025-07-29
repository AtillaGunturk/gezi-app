@echo off
REM ── Minimal Gradle Wrapper (Windows) ──

REM ---- Değişkenler ----
set DIRNAME=%~dp0
if "%DIRNAME%"=="" set DIRNAME=.
set APP_HOME=%DIRNAME%
set APP_BASE_NAME=%~n0
set CLASSPATH=%APP_HOME%\gradle\wrapper\gradle-wrapper.jar

REM ---- Java'yı bul ----
if defined JAVA_HOME (
  set JAVA_EXE=%JAVA_HOME%\bin\java.exe
) else (
  set JAVA_EXE=java.exe
)

"%JAVA_EXE%" -version >NUL 2>&1 || (
  echo ERROR: JAVA_HOME tanımlı değil ve 'java' PATH'te bulunamadı.
  exit /b 1
)

REM ---- Gradle Wrapper'ı çalıştır ----
"%JAVA_EXE%" ^
  -Dorg.gradle.appname=%APP_BASE_NAME% ^
  -classpath "%CLASSPATH%" ^
  org.gradle.wrapper.GradleWrapperMain %*
