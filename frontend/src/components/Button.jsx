export function Button({ variante = "primario", carregando, children, ...props }) {
  return (
    <button
      className={`botao botao--${variante}`}
      disabled={carregando || props.disabled}
      {...props}
    >
      {carregando ? "Aguarde…" : children}
    </button>
  );
}
