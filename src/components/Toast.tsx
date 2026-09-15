interface ToastProps {
  message: string | null;
}

export function Toast({ message }: ToastProps) {
  return (
    <div className={message ? "toast is-on" : "toast"} role="status" aria-live="polite">
      {message}
    </div>
  );
}
