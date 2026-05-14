const ANSI_RESET = "\x1b[0m";
const ANSI_BOLD = "\x1b[1m";
const ANSI_GREEN = "\x1b[32m";
const ANSI_CYAN = "\x1b[36m";
const ANSI_YELLOW = "\x1b[33m";
const ANSI_RED = "\x1b[31m";
const ANSI_DIM = "\x1b[2m";

const useColor = (): boolean => process.stdout.isTTY === true;

export function bold(text: string): string {
  return useColor() ? `${ANSI_BOLD}${text}${ANSI_RESET}` : text;
}

export function green(text: string): string {
  return useColor() ? `${ANSI_GREEN}${text}${ANSI_RESET}` : text;
}

export function cyan(text: string): string {
  return useColor() ? `${ANSI_CYAN}${text}${ANSI_RESET}` : text;
}

export function yellow(text: string): string {
  return useColor() ? `${ANSI_YELLOW}${text}${ANSI_RESET}` : text;
}

export function red(text: string): string {
  return useColor() ? `${ANSI_RED}${text}${ANSI_RESET}` : text;
}

export function dim(text: string): string {
  return useColor() ? `${ANSI_DIM}${text}${ANSI_RESET}` : text;
}
