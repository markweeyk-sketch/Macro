// auth.jsx — AuthSheet (sign-in / sign-up) + MigrateSheet
const { useState, useEffect } = React;

function AuthSheet({ open, onClose }) {
  const [mode, setMode]     = useState('signin');
  const [name, setName]     = useState('');
  const [email, setEmail]   = useState('');
  const [password, setPass] = useState('');
  const [error, setError]   = useState('');
  const [busy, setBusy]     = useState(false);
  const FB = window.MACRO_FIREBASE;

  useEffect(() => {
    if (open) { setError(''); setEmail(''); setPass(''); setName(''); }
  }, [open]);

  if (!open) return null;

  const fmt = (msg) => {
    if (/user-not-found|wrong-password|invalid-credential/i.test(msg))
      return 'Incorrect email or password.';
    if (/email-already-in-use/i.test(msg))
      return 'An account with this email already exists.';
    if (/weak-password/i.test(msg))
      return 'Password must be at least 6 characters.';
    if (/invalid-email/i.test(msg))
      return 'Please enter a valid email address.';
    if (/popup-closed/i.test(msg)) return '';
    return msg.replace('Firebase: ', '').replace(/ \(auth\/[^)]+\)\.?/, '');
  };

  const run = async (fn) => {
    setError(''); setBusy(true);
    try { await fn(); onClose(); }
    catch (e) { const m = fmt(e.message); if (m) setError(m); }
    finally { setBusy(false); }
  };

  const handleEmail  = () => run(() =>
    mode === 'signup'
      ? FB.signUpWithEmail(email, password, name)
      : FB.signInWithEmail(email, password)
  );
  const handleGoogle = () => run(() => FB.signInWithGoogle());

  return (
    <>
      <div className="sheet-bg" onClick={onClose}/>
      <div className="sheet">
        <div className="sheet-grab"/>
        <div className="sheet-hd">
          <div className="serif" style={{ fontSize: 24 }}>
            {mode === 'signin' ? 'Welcome back' : 'Create account'}
          </div>
          <button className="icon-btn" onClick={onClose}>
            <Icon name="close" size={16}/>
          </button>
        </div>

        <div className="sheet-body">
          {/* Google */}
          <button className="btn ghost" style={{ width: '100%', gap: 10, marginBottom: 20 }}
                  onClick={handleGoogle} disabled={busy}>
            <svg width="16" height="16" viewBox="0 0 48 48">
              <path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.6 20-21 0-1.4-.2-2.7-.5-4z"/>
              <path fill="#34A853" d="M6.3 14.7l7 5.1C15 17 19.2 14 24 14c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3c-7.7 0-14.4 4.4-17.7 10.7z"/>
              <path fill="#FBBC05" d="M24 45c5.5 0 10.1-1.8 13.5-4.9l-6.3-5.1C29.4 36.5 26.8 37 24 37c-7.1 0-13.1-4.8-15.3-11.2l-7.2 5.5C5.6 40.2 14.2 45 24 45z"/>
              <path fill="#EA4335" d="M44.5 20H24v8.5h11.8c-.9 2.8-2.8 5.1-5.2 6.6l6.3 5.1c3.7-3.4 5.9-8.4 5.9-14.2 0-1.4-.2-2.7-.5-4z"/>
            </svg>
            Continue with Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--line)' }}/>
            <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>or email</span>
            <div style={{ flex: 1, height: 1, background: 'var(--line)' }}/>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {mode === 'signup' && (
              <AuthField label="Your name" type="text" value={name}
                         onChange={setName} placeholder="Alex Rivera"/>
            )}
            <AuthField label="Email" type="email" value={email}
                       onChange={setEmail} placeholder="you@example.com"/>
            <AuthField label="Password" type="password" value={password}
                       onChange={setPass} placeholder="••••••••"
                       onEnter={handleEmail}/>
          </div>

          {error && (
            <div style={{
              marginTop: 14, padding: '10px 14px', borderRadius: 10,
              background: 'rgba(198,106,58,0.1)', color: 'var(--warn)', fontSize: 13,
            }}>{error}</div>
          )}
        </div>

        <div className="sheet-foot" style={{ flexDirection: 'column', gap: 8 }}>
          <button className="btn" style={{ width: '100%' }}
                  onClick={handleEmail} disabled={busy}>
            {busy ? 'Loading…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
          <button
            onClick={() => { setMode(m => m === 'signin' ? 'signup' : 'signin'); setError(''); }}
            style={{ fontSize: 13, color: 'var(--ink-3)', padding: '6px 0', textAlign: 'center' }}>
            {mode === 'signin'
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </>
  );
}

function AuthField({ label, type, value, onChange, placeholder, onEnter }) {
  return (
    <label style={{
      display: 'block', background: 'var(--surface-2)',
      borderRadius: 14, padding: '10px 14px',
    }}>
      <div style={{
        fontSize: 11, textTransform: 'uppercase',
        letterSpacing: '0.12em', color: 'var(--ink-3)', marginBottom: 4,
      }}>{label}</div>
      <input type={type} value={value}
             onChange={(e) => onChange(e.target.value)}
             placeholder={placeholder}
             onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
             style={{
               background: 'transparent', border: 0, outline: 0,
               padding: 0, width: '100%', fontSize: 15,
             }}/>
    </label>
  );
}

// Shown once for new accounts that have existing local data.
// No backdrop click — user must choose.
function MigrateSheet({ open, onMigrate, onSkip }) {
  if (!open) return null;
  return (
    <>
      <div className="sheet-bg"/>
      <div className="sheet">
        <div className="sheet-grab"/>
        <div className="sheet-hd">
          <div className="serif" style={{ fontSize: 22 }}>Move data to cloud?</div>
        </div>
        <div className="sheet-body">
          <p style={{ fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.65, margin: '0 0 12px' }}>
            You have existing data on this device. Import it into your new account, or start fresh?
          </p>
          <p style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.5, margin: 0 }}>
            Today's food log, your calorie goal, and saved recipes will be moved to the cloud.
          </p>
        </div>
        <div className="sheet-foot">
          <button className="btn ghost" style={{ flex: 1 }} onClick={onSkip}>Start fresh</button>
          <button className="btn"       style={{ flex: 1 }} onClick={onMigrate}>Import my data</button>
        </div>
      </div>
    </>
  );
}

Object.assign(window, { AuthSheet, MigrateSheet });
