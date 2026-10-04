param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$MavenArgs
)

$MavenHome = "D:\Softwares\apache-maven-3.9.4\apache-maven-3.9.4"
$ClassworldsJar = (Get-Item "$MavenHome\boot\plexus-classworlds-*.jar").FullName
$JavaCmd = "java"
if ($env:JAVA_HOME -and (Test-Path "$env:JAVA_HOME\bin\java.exe")) {
    $JavaCmd = "$env:JAVA_HOME\bin\java.exe"
}

$JavaArgs = @(
    "-classpath", $ClassworldsJar,
    "-Dclassworlds.conf=$MavenHome\bin\m2.conf",
    "-Dmaven.home=$MavenHome",
    "-Dmaven.multiModuleProjectDirectory=$PWD",
    "org.codehaus.plexus.classworlds.launcher.Launcher"
) + $MavenArgs

& $JavaCmd @JavaArgs
