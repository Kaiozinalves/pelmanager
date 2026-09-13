export function Input({ label, id, error, ...props }) {
  return (
    <div className="campo">
      <label className="campo-label" htmlFor={id}>
        {label}
      </label>
      <input id={id} className="campo-input" {...props} />
      {error && <span className="campo-erro">{error}</span>}
    </div>
  );
}

export function Select({ label, id, children, ...props }) {
  return (
    <div className="campo">
      <label className="campo-label" htmlFor={id}>
        {label}
      </label>
      <select id={id} className="campo-input" {...props}>
        {children}
      </select>
    </div>
  );
}
