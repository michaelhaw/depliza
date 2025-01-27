const { spawn } = require("child_process");

/**
 * Resolves the Python executable path, defaulting to a virtual environment path if specified.
 * @returns {string} - The path to the Python executable.
 */
function resolvePythonExecutable() {
  // Check for an environment variable for the Python executable
  return process.env.PYTHON_EXECUTABLE || "/app/venv/bin/python";
}

/**
 * Executes a Python script with the given arguments and logs its output in real time.
 * @param {string} scriptPath - Path to the Python script.
 * @param {string[]} args - Arguments to pass to the script.
 * @returns {Promise<string>} - Resolves with the script's output or rejects with the error message.
 */
function callPythonScript(scriptPath, args) {
  return new Promise((resolve, reject) => {
    const pythonExecutable = resolvePythonExecutable(); // Get the Python executable
    console.log(`Using Python executable: ${pythonExecutable}`);

    const pythonProcess = spawn(pythonExecutable, [scriptPath, ...args]);

    let output = "";
    let errorOutput = "";

    // Log Python script's stdout to the backend console
    pythonProcess.stdout.on("data", (data) => {
      const message = data.toString().trim();
      console.log(`[Python stdout]: ${message}`);
      output += message + "\n";
    });

    // Log Python script's stderr to the backend console
    pythonProcess.stderr.on("data", (data) => {
      const message = data.toString().trim();
      console.error(`[Python stderr]: ${message}`);
      errorOutput += message + "\n";
    });

    // Handle the close event
    pythonProcess.on("close", (code) => {
      if (code === 0) {
        resolve(output.trim());
      } else {
        reject(
          new Error(
            errorOutput.trim() || `Python script exited with code ${code}`
          )
        );
      }
    });
  });
}

module.exports = {
  callPythonScript,
  resolvePythonExecutable,
};
