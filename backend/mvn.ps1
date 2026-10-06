param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$MavenArgs
)

# Load local .env if present
$envFile = Join-Path $PSScriptRoot ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith('#') -and $line.Contains('=')) {
            $parts = $line.Split('=', 2)
            [System.Environment]::SetEnvironmentVariable($parts[0].Trim(), $parts[1].Trim(), "Process")
        }
    }
}

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
