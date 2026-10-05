# BarbApp — demo

Sistema de gestión para barberías con estética **Dark Premium** (fondo `#0F0F10`, acento dorado `#D4AF37`).
Esta rama (`react-demo`) es una **versión demo 100 % frontend**: no necesita servidor ni base de datos. Los datos viven en el `localStorage` del navegador y se generan con fechas relativas a "hoy", así que la demo siempre se ve viva.

> El prototipo HTML/CSS/JS original está intacto en [`legacy/`](legacy/).

## Ejecutar en local

Requiere Node 20 o superior.

```bash
git clone https://github.com/eddy16pacheco-lab/BARBEAPP.git
cd BARBEAPP
git checkout react-demo
npm install
npm run dev        # http://localhost:5173
```

Otros comandos: `npm test` (reglas de negocio), `npm run build` (genera `dist/`), `npm run preview`.

## Publicarla desde GitHub (opcional)

1. En GitHub: **Settings → Pages → Source: GitHub Actions**.
2. Haz push de la rama `react-demo`. El workflow `.github/workflows/deploy.yml` corre las pruebas, compila y publica en `https://<usuario>.github.io/BARBEAPP/`.

La app usa `HashRouter` y `base: './'`, por lo que funciona en cualquier subruta sin configurar redirecciones.

## Cuentas de demostración

| Rol | Correo | Contraseña |
|---|---|---|
| Cliente (historial, puntos Plata, barbero favorito) | `cliente@barbapp.com` | `demo123` |
| Administrador | `admin@barbapp.com` | `admin123` |

El pie de página tiene **Restablecer demo** para volver a los datos iniciales.

## Qué incluye

| Módulo | Implementado |
|---|---|
| Usuarios | Registro, login, recuperación de contraseña (el "email" se simula con un enlace en pantalla), edición de datos, cambio de contraseña, historial de citas |
| Reservas | Asistente servicio → barbero → fecha/hora; calendario con disponibilidad calculada en vivo (horarios, descansos, solapes, días libres); reprogramar/cancelar solo hasta **2 h antes** (validado también en la capa de API); recordatorios y notificaciones |
| Catálogo y promos | Tarjetas de servicio, promociones, **20 % automático en la primera cita**, códigos con restricciones (día, vigencia). Los descuentos no se acumulan: gana el mejor |
| Pagos | Pago Móvil (banco, teléfono, cédula/RIF, referencia), transferencia, Zelle/otros y efectivo; subida de comprobante PNG/JPG/PDF (máx. 5 MB); estado "Pendiente de validación"; reenvío si es rechazado |
| Administración | Resumen (ingresos, citas de hoy, clientes nuevos, gráfico 14 días, ranking); calendario global con filtros por estado y barbero; conciliación de pagos (aprobar / rechazar con motivo); CRUD de servicios, barberos + horarios, promociones; tasa de cambio y datos de cobro |
| Fidelización | Barbero favorito, reseñas 1–5 ★ con comentario, puntos y niveles Bronce / Plata / Oro, insignias |

### Lógica de fidelización

- **Puntos:** 1 por cada dólar de una cita completada + 10 por reseña. **Niveles:** Bronce 0, Plata 200, Oro 500.
- **Barbero favorito:** cada cita completada pesa según su antigüedad (vida media de 120 días) y la calificación que dio el cliente (5★ ×1,5 … 1★ ×0,5). Gana el mayor puntaje; el empate lo desempata la visita más reciente. Ver `src/lib/loyalty.js`.

## Arquitectura de la demo

```
src/
  lib/        Reglas de negocio puras y probadas (disponibilidad, precios, lealtad, validaciones, métricas)
  api/        "Backend" simulado sobre localStorage: valida igual que lo haría un servidor
  context/    Auth, toasts y acceso reactivo a los datos
  components/ Layout, calendario, selector de turnos, formulario de pago, tarjetas
  pages/      Inicio, servicios, promociones, reserva, perfil, auth y admin/*
  styles/     Tokens de diseño + componentes + páginas (CSS plano, sin framework)
tests/        15 pruebas con node:test sobre las reglas de negocio
```

Las pantallas nunca se saltan las reglas: `api.js` vuelve a comprobar disponibilidad, la regla de 2 horas, permisos de admin y validaciones de pago. Al migrar a un backend real solo se reimplementan esas funciones con `fetch`.

## Stack recomendado para producción

| Capa | Recomendación | Motivo |
|---|---|---|
| Frontend | React + Vite, React Router, TanStack Query | Ya está en esta demo; Query aporta caché y refresco de disponibilidad |
| Backend | Node.js + Express (o Fastify) con TypeScript | Mismo lenguaje que el frontend; las reglas de `src/lib` se pueden compartir |
| Base de datos | PostgreSQL + Prisma | Integridad relacional y restricciones para evitar reservas dobles |
| Auth | JWT corto + refresh en cookie `httpOnly`, contraseñas con argon2/bcrypt | Sustituye el hash de demo |
| Archivos | S3 / Cloudinary con URL firmadas | Los comprobantes no deben guardarse en la base |
| Email / recordatorios | Resend o SES + cron/BullMQ | Recuperación de contraseña y avisos 24 h antes |
| Tiempo real | WebSocket/SSE o *polling* con Query | Disponibilidad compartida entre clientes |
| Despliegue | Vercel/Netlify (front) + Render/Railway/Fly (API y DB) | Simple y económico |

Puntos críticos al pasar a producción:

1. **Evitar reservas dobles** con una restricción de exclusión en PostgreSQL sobre `(barbero, rango de tiempo)` o una transacción con bloqueo; la validación del cliente no basta.
2. Guardar fechas en UTC con la zona horaria de la barbería (`America/Caracas`).
3. Mover la tasa de cambio a una fuente actualizada (BCV) o administrarla a diario.
4. Validar comprobantes por tipo real de archivo (no solo extensión) y escanearlos.

## Limitaciones conocidas de la demo

- Los datos son por navegador (no se comparten entre dispositivos; sí se sincronizan entre pestañas).
- No se envían correos ni notificaciones push reales.
- El hash de contraseña de `src/lib/security.js` es solo de demostración.
- Las fotos vienen de Unsplash; sin internet se muestra un ícono de respaldo.
