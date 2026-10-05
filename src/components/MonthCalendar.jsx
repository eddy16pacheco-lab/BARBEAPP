import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DAY_SHORT, addDays, fmtMonth, fromISODate, startOfDay, toISODate } from '../lib/dates.js';

/**
 * Calendario mensual genérico (semana inicia en lunes).
 * isDisabled(iso) bloquea días; markerCount(iso) dibuja puntos (máx. 3) para ver carga de citas.
 */
export default function MonthCalendar({ selected, onSelect, isDisabled = () => false, markerCount, minDate, maxDate, initialMonth }) {
  const today = startOfDay(new Date());
  const start = initialMonth ? fromISODate(initialMonth) : selected ? fromISODate(selected) : today;
  const [cursor, setCursor] = useState(new Date(start.getFullYear(), start.getMonth(), 1));

  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const lead = (first.getDay() + 6) % 7; // lunes = 0
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells = [...Array(lead).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => new Date(cursor.getFullYear(), cursor.getMonth(), i + 1))];

  const min = minDate ? fromISODate(minDate) : null;
  const max = maxDate ? fromISODate(maxDate) : null;
  const canPrev = !min || new Date(cursor.getFullYear(), cursor.getMonth(), 0) >= min;
  const canNext = !max || new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1) <= max;
  const dows = [1, 2, 3, 4, 5, 6, 0].map((d) => DAY_SHORT[d]);

  return (
    <div className="cal">
      <div className="cal-head">
        <button type="button" className="icon-btn" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} disabled={!canPrev} aria-label="Mes anterior"><ChevronLeft size={20} /></button>
        <strong aria-live="polite">{fmtMonth(cursor)}</strong>
        <button type="button" className="icon-btn" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} disabled={!canNext} aria-label="Mes siguiente"><ChevronRight size={20} /></button>
      </div>
      <div className="cal-grid" role="grid">
        {dows.map((d) => <div key={d} className="cal-dow" role="columnheader">{d}</div>)}
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`} className="cal-day outside" />;
          const iso = toISODate(d);
          const out = (min && d < min) || (max && d > max);
          const disabled = out || isDisabled(iso);
          const n = markerCount ? markerCount(iso) : 0;
          return (
            <button
              key={iso} type="button" role="gridcell" disabled={disabled}
              className={`cal-day ${iso === toISODate(today) ? 'is-today' : ''} ${iso === selected ? 'is-selected' : ''}`}
              aria-pressed={iso === selected} aria-label={`${d.getDate()} de ${fmtMonth(d)}${n ? `, ${n} citas` : ''}`}
              onClick={() => onSelect(iso)}
            >
              {d.getDate()}
              {n > 0 && <span className="cal-count">{Array.from({ length: Math.min(n, 3) }, (_, k) => <i key={k} />)}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const maxBookingDate = () => toISODate(addDays(startOfDay(new Date()), 60));
