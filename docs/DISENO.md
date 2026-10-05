# Sistema de diseño

| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#0F0F10` | Fondo de la app |
| `--surface` | `#18181B` | Tarjetas, cabecera, modales |
| `--raised` | `#212126` | Elementos elevados, hover |
| `--gold` | `#D4AF37` | Acento, precios, estado activo |
| `--text` / `--muted` | `#F4F4F5` / `#A1A1AA` | Texto principal / secundario |
| Estados | verde `#4ADE80`, ámbar `#F5B84B`, rojo `#F87171`, azul `#7DB7F5` | Pagos y citas |

- **Tipografía:** Montserrat (títulos) + Inter (texto), con pila de respaldo del sistema.
- **Radios:** 8 / 12 / 16 px. Sombras suaves y solo en elementos flotantes.
- **Mobile first:** objetivos táctiles ≥ 44 px, barra inferior con total en la reserva, modales tipo *bottom sheet*.
- **Accesibilidad:** foco visible dorado, `aria-*` en pestañas, calendario y estrellas, `prefers-reduced-motion` respetado.
- **Movimiento:** solo en respuesta a acciones (abrir menú, modales, progreso) y un pulso en "Próximos turnos libres".
