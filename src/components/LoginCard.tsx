import { useState } from 'react';
import { Loader2, LogIn } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { jet } from '@/lib/jet';

export function LoginCard({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      await jet.auth.loginViaEmailPassword(email.trim(), password);
      onLoggedIn();
    } catch {
      setError('Correo o contraseña incorrectos.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-sm p-6">
      <h1 className="text-xl font-semibold">Panel de solicitudes</h1>
      <p className="mb-5 text-sm text-muted-foreground">Ingrese con su usuario de Jet Admin.</p>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="login-email">Correo</Label>
          <Input id="login-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="login-password">Contraseña</Label>
          <Input id="login-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? <Loader2 className="animate-spin" /> : <LogIn />} Entrar
        </Button>
      </form>
    </Card>
  );
}
