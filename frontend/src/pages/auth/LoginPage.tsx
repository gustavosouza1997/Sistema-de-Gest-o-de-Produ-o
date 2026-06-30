import { useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AlertCircle } from 'lucide-react';
import logo from '@/assets/logo.png';

export function LoginPage() {
  const { login, isLoading, error } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(username, password);
  };

  return (
    <div className="flex min-h-screen bg-background">

      {/* Painel esquerdo — decorativo */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-sidebar p-12">
        <img
          src={logo}
          alt="Calçados Padilha"
          className="max-h-32 w-auto object-contain brightness-0 invert"
        />
        <p className="mt-8 text-center text-lg font-medium leading-snug text-sidebar-foreground/80">
          Sistema de Gestão de Produção
        </p>
      </div>

      {/* Painel direito — formulário */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">

          {/* Logo (mobile) */}
          <div className="mb-8 flex justify-center lg:hidden">
            <img src={logo} alt="Calçados Padilha" className="h-12 w-auto object-contain" />
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Bem-vindo</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Informe suas credenciais para acessar o sistema.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Usuário"
              type="text"
              placeholder="seu.usuario"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" className="mt-1 h-10 w-full" isLoading={isLoading}>
              {isLoading ? 'Autenticando...' : 'Entrar'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
