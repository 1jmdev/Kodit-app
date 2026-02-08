use std::path::Path;
use std::process::{Command, Stdio};
use std::thread;
use std::time::{Duration, Instant};

use crate::agent::types::AgentRunCommandResult;

pub fn run_shell_command(
    command: &str,
    workdir: &Path,
    timeout_ms: u64,
) -> Result<AgentRunCommandResult, String> {
    let mut process = if cfg!(target_os = "windows") {
        let mut cmd = Command::new("cmd");
        cmd.arg("/C").arg(command);
        cmd
    } else {
        let mut cmd = Command::new("sh");
        cmd.arg("-lc").arg(command);
        cmd
    };

    let mut child = process
        .current_dir(workdir)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| e.to_string())?;

    let started = Instant::now();
    let timeout = Duration::from_millis(timeout_ms);
    let timed_out = loop {
        if child.try_wait().map_err(|e| e.to_string())?.is_some() {
            break false;
        }
        if started.elapsed() >= timeout {
            let _ = child.kill();
            break true;
        }
        thread::sleep(Duration::from_millis(20));
    };

    let output = child.wait_with_output().map_err(|e| e.to_string())?;
    let exit_code = output
        .status
        .code()
        .unwrap_or(if timed_out { 124 } else { -1 });

    Ok(AgentRunCommandResult {
        command: command.to_string(),
        workdir: workdir.to_string_lossy().to_string(),
        exit_code,
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        timed_out,
    })
}
