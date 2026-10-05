import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, Mail, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useDocumentTitle } from '../hooks.js';
import { requestPasswordReset, resetPassword } from '../api/api.js';
import { Field } from '../components/ui.jsx';

function Shell({ title, sub, children, footer }) {
  return (
    <div className="container auth-wrap">
      <div className="card card-pad auth-card">
        <h1>{title}</h1>
        {sub && <p className="muted" style={{ marginBottom: '1.25rem' }}>{sub}</p>}
        {children}
        {footer}
      </div>
    </div>
  );
}
const Err = ({ children }) => children ? <div className="alert alert-err" role="alert"><AlertCircle size={18} />{children}</div> : null;
const Submit = ({ busy, children }) => <button className="btn btn-gold btn-lg btn-block" disabled={busy}>{busy && <Loader2 size={18} className="spin" />}{children}</button>;

export function Login() {
  useDocumentTitle('Iniciar sesión');
  const { signIn } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      const u = await signIn(form);
      nav(u.role === 'admin' ? '/admin' : loc.state?.from || '/perfil', { replace: true });
    } catch (err) { setError(err.message); setBusy(false); }
  };
  const fill = (email, password) => setForm({ email, password });
  return (
    <Shell title="Iniciar sesión" sub="Entra para ver tus citas y puntos."
      footer={<>
        <p className="muted small center" style={{ marginTop: '1.25rem' }}>¿Aún no tienes cuenta? <Link to="/registro" state={loc.state} className="gold">Crear cuenta</Link></p>
        <div className="demo-box">
          <strong style={{ color: 'var(--text)' }}>Cuentas de demostración</strong>
          <button type="button" onClick={() => fill('cliente@barbapp.com', 'demo123')}><span>Cliente: cliente@barbapp.com / demo123</span><span>Usar</span></button>
          <button type="button" onClick={() => fill('admin@barbapp.com', 'admin123')}><span>Admin: admin@barbapp.com / admin123</span><span>Usar</span></button>
        </div>
      </>}>
      <form className="stack" onSubmit={submit} noValidate>
        <Err>{error}</Err>
        <Field label="Correo electrónico" htmlFor="l-email"><input id="l-email" type="email" className="input" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="Contraseña" htmlFor="l-pw"><input id="l-pw" type="password" className="input" autoComplete="current-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
        <div style={{ textAlign: 'right' }}><Link to="/recuperar" className="small gold">¿Olvidaste tu contraseña?</Link></div>
        <Submit busy={busy}>Iniciar sesión</Submit>
      </form>
    </Shell>
  );
}

export function Register() {
  useDocumentTitle('Crear cuenta');
  const { signUp } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setError(''); setBusy(true);
    try { await signUp(form); toast.ok('Cuenta creada. Tu primera cita tiene 20% de descuento.'); nav(loc.state?.from || '/reservar', { replace: true }); }
    catch (err) { setError(err.message); setBusy(false); }
  };
  return (
    <Shell title="Crea tu cuenta" sub="Tu primera cita tiene 20% de descuento."
      footer={<p className="muted small center" style={{ marginTop: '1.25rem' }}>¿Ya tienes cuenta? <Link to="/login" state={loc.state} className="gold">Inicia sesión</Link></p>}>
      <form className="stack" onSubmit={submit} noValidate>
        <Err>{error}</Err>
        <Field label="Nombre completo" htmlFor="r-name"><input id="r-name" className="input" autoComplete="name" value={form.name} onChange={set('name')} /></Field>
        <Field label="Correo electrónico" htmlFor="r-email"><input id="r-email" type="email" className="input" autoComplete="email" value={form.email} onChange={set('email')} /></Field>
        <Field label="Teléfono" htmlFor="r-phone" hint="Lo usamos para recordatorios de tu cita."><input id="r-phone" inputMode="tel" className="input" placeholder="0414-1234567" autoComplete="tel" value={form.phone} onChange={set('phone')} /></Field>
        <Field label="Contraseña" htmlFor="r-pw" hint="Mínimo 6 caracteres."><input id="r-pw" type="password" className="input" autoComplete="new-password" value={form.password} onChange={set('password')} /></Field>
        <Submit busy={busy}>Crear cuenta</Submit>
      </form>
    </Shell>
  );
}

export function Recover() {
  useDocumentTitle('Recuperar contraseña');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(null);
  const submit = async (e) => {
    e.preventDefault(); setError(''); setBusy(true);
    try { setSent(await requestPasswordReset(email)); } catch (err) { setError(err.message); }
    setBusy(false);
  };
  return (
    <Shell title="Recupera tu contraseña" sub="Te enviaremos un enlace para crear una nueva."
      footer={<p className="muted small center" style={{ marginTop: '1.25rem' }}><Link to="/login" className="gold">Volver a iniciar sesión</Link></p>}>
      {sent ? (
        <div className="stack">
          <div className="alert alert-ok"><Mail size={18} />Si ese correo tiene una cuenta, te enviamos el enlace. Revisa también la carpeta de spam.</div>
          {sent.demoToken && (
            <div className="inbox">
              <strong>Bandeja simulada (solo demo)</strong>
              <span className="small muted">En producción esto llega por email (SendGrid, Resend, Amazon SES…). Aquí puedes abrir el enlace directamente:</span>
              <Link className="btn btn-gold" to={`/restablecer/${sent.demoToken}`}>Abrir enlace del correo</Link>
            </div>
          )}
        </div>
      ) : (
        <form className="stack" onSubmit={submit} noValidate>
          <Err>{error}</Err>
          <Field label="Correo electrónico" htmlFor="rc-email"><input id="rc-email" type="email" className="input" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Submit busy={busy}>Enviar enlace</Submit>
        </form>
      )}
    </Shell>
  );
}

export function ResetPassword() {
  useDocumentTitle('Nueva contraseña');
  const { token } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setError(''); setBusy(true);
    try { await resetPassword({ token, password: pw }); toast.ok('Contraseña actualizada. Ya puedes iniciar sesión.'); nav('/login', { replace: true }); }
    catch (err) { setError(err.message); setBusy(false); }
  };
  return (
    <Shell title="Crea una nueva contraseña">
      <form className="stack" onSubmit={submit} noValidate>
        <Err>{error}</Err>
        <Field label="Nueva contraseña" htmlFor="np" hint="Mínimo 6 caracteres."><input id="np" type="password" className="input" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
        <Submit busy={busy}>Guardar contraseña</Submit>
        {error.includes('venció') && <Link to="/recuperar" className="gold small center">Pedir un enlace nuevo</Link>}
      </form>
    </Shell>
  );
}
