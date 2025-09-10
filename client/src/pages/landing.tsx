import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, Shield, FileText, BarChart3, Users, Receipt } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-background sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <div className="flex items-center space-x-3 mb-6 sm:justify-center lg:justify-start">
                  <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                    <Wallet className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">FinanceKids</h1>
                    <p className="text-sm text-muted-foreground">Gestão Financeira para Filhos</p>
                  </div>
                </div>
                
                <h1 className="text-4xl tracking-tight font-extrabold text-foreground sm:text-5xl md:text-6xl">
                  <span className="block xl:inline">Gestão completa de</span>{' '}
                  <span className="block text-primary xl:inline">despesas dos filhos</span>
                </h1>
                
                <p className="mt-3 text-base text-muted-foreground sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Sistema profissional para pais divorciados organizarem, documentarem e comprovarem todas as despesas 
                  relacionadas aos filhos. Ideal para processos jurídicos e prestação de contas.
                </p>
                
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <Button
                      onClick={handleLogin}
                      className="w-full flex items-center justify-center px-8 py-3 text-base font-medium md:py-4 md:text-lg md:px-10"
                      data-testid="button-login"
                    >
                      Entrar na Plataforma
                    </Button>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-primary font-semibold tracking-wide uppercase">Funcionalidades</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-foreground sm:text-4xl">
              Tudo que você precisa para organizar as finanças
            </p>
            <p className="mt-4 max-w-2xl text-xl text-muted-foreground lg:mx-auto">
              Sistema completo com foco em documentação jurídica e relatórios profissionais
            </p>
          </div>

          <div className="mt-10">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              <Card className="hover-elevate">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/90 rounded-lg flex items-center justify-center">
                      <Receipt className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle>Controle de Despesas</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Registre todas as despesas dos filhos com categorização detalhada: 
                    educação, saúde, alimentação, vestuário e muito mais.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-green-600" />
                    </div>
                    <CardTitle>Comprovantes Digitais</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Anexe e organize todos os comprovantes digitalmente. 
                    Upload seguro de imagens e PDFs com backup automático.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                    </div>
                    <CardTitle>Relatórios Profissionais</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Gere relatórios detalhados em PDF prontos para apresentação 
                    em tribunais e processos jurídicos.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-purple-600" />
                    </div>
                    <CardTitle>Segurança e Privacidade</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Dados criptografados e backup seguro. Acesso controlado 
                    para garantir a privacidade das informações familiares.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-background py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-extrabold text-foreground">
              Projetado para pais divorciados
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Especialmente desenvolvido para atender às necessidades de documentação 
              e comprovação de gastos em processos de divórcio e guarda compartilhada.
            </p>
          </div>
          
          <div className="mt-12 space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8">
            <div className="text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary text-primary-foreground mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-foreground">
                Múltiplos Filhos
              </h3>
              <p className="mt-2 text-base text-muted-foreground">
                Gerencie as despesas de todos os seus filhos em um só lugar, 
                com controle individual e relatórios específicos.
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary text-primary-foreground mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-foreground">
                Evidências Sólidas
              </h3>
              <p className="mt-2 text-base text-muted-foreground">
                Todos os gastos ficam documentados com comprovantes, 
                criando um histórico confiável para uso jurídico.
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary text-primary-foreground mx-auto">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-foreground">
                Análises Detalhadas
              </h3>
              <p className="mt-2 text-base text-muted-foreground">
                Visualize gastos por categoria, período e filho, 
                com gráficos e estatísticas completas.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-primary-foreground sm:text-4xl">
            <span className="block">Pronto para começar?</span>
            <span className="block text-primary-foreground/90">Entre na plataforma agora mesmo.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Button
                variant="secondary"
                onClick={handleLogin}
                className="px-8 py-3 text-base font-medium"
                data-testid="button-login-cta"
              >
                Acessar Sistema
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
