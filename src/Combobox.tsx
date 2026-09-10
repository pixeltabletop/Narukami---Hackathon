import { useEffect, useId, useState } from "react";

// Con veinte categorías el desplegable dejó de servir: hay que poder escribir.
// Se usa datalist en vez de un menú propio porque el teclado, el lector de
// pantalla y el móvil ya lo saben manejar sin que nadie reimplemente nada.
export const Combobox = ({
  label,
  value,
  options,
  onChange,
  placeholder,
  className,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) => {
  const listId = useId();
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  const match = (typed: string) =>
    options.find(
      (option) => option.toLowerCase() === typed.trim().toLowerCase(),
    );
  return (
    <>
      <input
        className={className}
        aria-label={label}
        list={listId}
        value={text}
        placeholder={placeholder}
        onChange={(event) => {
          const typed = event.target.value;
          setText(typed);
          // Se deja escribir libremente, pero solo se aplica un valor que
          // exista en el catálogo. Un filtro inventado no filtra nada.
          const exact = match(typed);
          if (exact) onChange(exact);
        }}
        onBlur={() => {
          // Texto a medio escribir: se vuelve al último valor válido en vez de
          // dejar el campo mintiendo sobre lo que la tabla está mostrando.
          if (!match(text)) setText(value);
        }}
      />
      <datalist id={listId}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </>
  );
};
