#!/usr/bin/env sh
# Minimal Gradle Wrapper (Unix)

# --- Temel değişkenler ---
PRG="$0"
while [ -h "$PRG" ]; do                  # Symlink çöz
  ls=$(ls -ld "$PRG")
  PRG=$(expr "$ls" : '.*-> .*$')
done
APP_HOME=$(cd "$(dirname "$PRG")" && pwd -P)
APP_BASE_NAME=$(basename "$0")
CLASSPATH="$APP_HOME/gradle/wrapper/gradle-wrapper.jar"

# --- Java'yı bul ---
if [ -n "$JAVA_HOME" ] && [ -x "$JAVA_HOME/bin/java" ]; then
  JAVACMD="$JAVA_HOME/bin/java"
else
  JAVACMD=$(command -v java) || {
    echo "JAVA_HOME ayarlanmadı ve 'java' komutu PATH'te yok." >&2
    exit 1
  }
fi

# --- JVM ve Gradle Wrapper'ı çalıştır ---
exec "$JAVACMD" \
  -Dorg.gradle.appname="$APP_BASE_NAME" \
  -classpath "$CLASSPATH" \
  org.gradle.wrapper.GradleWrapperMain "$@"
