import { useMemo } from 'react';
import { CalendarX } from 'lucide-react';
import MonthCalendar, { maxBookingDate } from './MonthCalendar.jsx';
import { getDaySlots, hasAvailability } from '../lib/availability.js';
import { fmtDate, fmtTime, toISODate } from '../lib/dates.js';
import { useNow } from '../hooks.js';

const GROUPS = [
  { key: 'am', label: 'Mañana', test: (h) => h < 12 },
  { key: 'pm', label: 'Tarde', test: (h) => h >= 12 && h < 18 },
  { key: 'ev', label: 'Noche', test: (h) => h >= 18 },
];

/** Calendario + turnos con disponibilidad calculada en vivo a partir de las citas existentes. */
export default function SlotPicker({ barber, durationMin, appointments, date, time, onChange, ignoreAppointmentId = null }) {
  const now = useNow(30000);
  const args = (dateISO) => ({ barber, durationMin, dateISO, appointments, now, ignoreAppointmentId });
  const slots = useMemo(
    () => (date ? getDaySlots({ barber, durationMin, dateISO: date, appointments, now, ignoreAppointmentId }).filter((s) => s.reason !== 'break' && s.reason !== 'past') : []),
    [barber, durationMin, date, appointments, now, ignoreAppointmentId],
  );

  return (
    <div className="stack-lg">
      <MonthCalendar
        selected={date} minDate={toISODate(now)} maxDate={maxBookingDate()}
        isDisabled={(iso) => !hasAvailability(args(iso))}
        onSelect={(iso) => onChange({ date: iso, time: iso === date ? time : null })}
      />
      <div aria-live="polite">
        {!date && <p className="muted small">Elige un día para ver los horarios de {barber.name.split(' ')[0]}. Los días atenuados no tienen turnos libres.</p>}
        {date && slots.length === 0 && <div className="empty" style={{ padding: '1rem' }}><CalendarX size={26} /><p>No quedan turnos libres este día.</p></div>}
        {date && slots.length > 0 && (
          <>
            <h4 style={{ fontFamily: 'var(--font-body)', fontWeight: 600, marginBottom: '0.75rem' }}>{fmtDate(date)}</h4>
            {GROUPS.map((g) => {
              const list = slots.filter((s) => g.test(Number(s.time.slice(0, 2))));
              if (!list.length) return null;
              return (
                <div className="slot-group" key={g.key}>
                  <h4>{g.label}</h4>
                  <div className="slots">
                    {list.map((s) => (
                      <button key={s.time} type="button" disabled={!s.available} className={`slot ${s.time === time ? 'is-selected' : ''}`} aria-pressed={s.time === time} onClick={() => onChange({ date, time: s.time })}>
                        {fmtTime(s.time)}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
