
# Plano do Projeto: Gestão de Finanças para Filhos de Pais Divorciados

## 1. Arquitetura Geral do Aplicativo

O aplicativo será desenvolvido com uma arquitetura de três camadas, visando modularidade, escalabilidade e manutenibilidade:

### 1.1. Frontend (Camada de Apresentação)

Responsável pela interface do usuário e interação. Será desenvolvido com:

*   **React**: Biblioteca JavaScript para construção de interfaces de usuário reativas e componentizadas.
*   **TypeScript**: Superset do JavaScript que adiciona tipagem estática, melhorando a robustez e a manutenibilidade do código.
*   **Axios/Fetch API**: Para comunicação com o backend via requisições HTTP.
*   **Bibliotecas de UI (Opcional, a ser definida)**: Para acelerar o desenvolvimento da interface e garantir um design consistente (ex: Material-UI, Ant Design, Chakra UI).

### 1.2. Backend (Camada de Lógica de Negócios e API)

Responsável por processar as requisições do frontend, aplicar as regras de negócio, interagir com o banco de dados e fornecer as APIs. Será desenvolvido com:

*   **Node.js**: Ambiente de execução JavaScript no lado do servidor.
*   **Express.js**: Framework web para Node.js, facilitando a criação de APIs RESTful.
*   **TypeScript**: Para tipagem estática no backend, assim como no frontend.
*   **Autenticação**: JWT (JSON Web Tokens) para autenticação segura de usuários.
*   **Upload de Arquivos**: Biblioteca para lidar com upload de comprovantes (ex: Multer).

### 1.3. Banco de Dados (Camada de Dados)

Responsável pelo armazenamento e recuperação dos dados. Será utilizado:

*   **Neon (PostgreSQL compatível)**: Banco de dados relacional escalável e serverless, compatível com PostgreSQL, ideal para o ambiente Replit.
*   **ORM/Query Builder (Opcional, a ser definido)**: Para facilitar a interação com o banco de dados (ex: Prisma, Knex.js, Sequelize).

## 2. Principais Tecnologias a Serem Utilizadas

| Categoria       | Tecnologia Principal | Tecnologias Secundárias / Ferramentas |
| :-------------- | :------------------- | :------------------------------------ |
| **Frontend**    | React                | TypeScript, Axios, (UI Library)       |
| **Backend**     | Node.js              | Express.js, TypeScript, JWT, Multer   |
| **Banco de Dados** | Neon (PostgreSQL)    | (ORM/Query Builder)                   |
| **Hospedagem**  | Replit               |                                       |
| **Controle de Versão** | Git                  |                                       |




## 3. Detalhamento das Funcionalidades por Tela

### 3.1. Tela de Autenticação (Login/Registro)

*   **Registro de Usuário**: Permite que novos usuários criem uma conta com e-mail e senha. Validação de formato de e-mail e força da senha.
*   **Login**: Usuários existentes podem acessar suas contas com e-mail e senha. Autenticação baseada em JWT.
*   **Recuperação de Senha**: Funcionalidade para redefinir a senha caso o usuário a esqueça (via e-mail).

### 3.2. Tela de Cadastro de Usuários (Gerenciamento de Perfis)

*   **Criação de Perfil**: Após o registro, o usuário pode completar seu perfil com informações como nome, sobrenome, e-mail de contato, e informações sobre os filhos (nomes, datas de nascimento).
*   **Edição de Perfil**: Permite que o usuário atualize suas informações pessoais e dos filhos.
*   **Associação de Usuários**: Possibilidade de associar o perfil do outro pai/mãe para compartilhamento de informações financeiras (requer confirmação do outro usuário).

### 3.3. Dashboard Principal

*   **Visão Geral Financeira**: Exibição de um resumo dos gastos totais, gastos por categoria, saldo atual e projeções.
*   **Gráficos e Visualizações**: Representações visuais dos dados financeiros (ex: gráfico de pizza para categorias de gastos, gráfico de barras para gastos mensais).
*   **Filtros**: Opções para filtrar os dados por período (semana, mês, ano), por filho, por categoria de gasto.
*   **Atividade Recente**: Lista dos últimos lançamentos de custos e seus status (pendente, pago, etc.).
*   **Notificações**: Alertas sobre pagamentos pendentes, novos comprovantes adicionados, etc.

### 3.4. Tela de Gestão de Custos

*   **Adicionar Custo**: Formulário para registrar um novo custo, incluindo:
    *   Descrição do custo.
    *   Valor.
    *   Data do custo.
    *   Categoria (ex: educação, saúde, lazer, vestuário, alimentação).
    *   Filho(s) associado(s).
    *   Status (pendente, pago, reembolsado).
    *   Campo para upload de comprovante (imagem/PDF).
*   **Editar Custo**: Permite modificar os detalhes de um custo existente.
*   **Excluir Custo**: Funcionalidade para remover um custo.
*   **Lista de Custos**: Tabela paginada e filtrável de todos os custos, com opções de ordenação.
*   **Visualização de Comprovantes**: Miniatura ou link para visualizar o comprovante anexado.

### 3.5. Tela de Geração de Relatórios

*   **Seleção de Período**: Permite ao usuário escolher o intervalo de datas para o relatório.
*   **Filtros Avançados**: Filtrar por categoria, por filho, por status de pagamento.
*   **Tipos de Relatório**: 
    *   **Relatório Detalhado**: Lista todos os custos dentro do período e filtros selecionados, com todos os detalhes e links para comprovantes.
    *   **Relatório Resumido**: Apresenta totais por categoria, por filho, e um resumo geral.
*   **Exportação**: Opção para exportar relatórios em formatos como PDF ou CSV.
*   **Visualizações Gráficas**: Gráficos que complementam os dados tabulares dos relatórios.




## 4. Esboço do Modelo de Dados para o Banco de Dados Neon (PostgreSQL)

O modelo de dados será projetado para armazenar informações de usuários, filhos, custos e comprovantes, estabelecendo as relações necessárias para a gestão financeira.

### 4.1. Tabela `users`

Armazena informações dos pais/mães que utilizarão o sistema.

| Coluna          | Tipo de Dados      | Restrições / Descrição                               |
| :-------------- | :----------------- | :--------------------------------------------------- |
| `id`            | UUID / SERIAL      | Chave primária, identificador único do usuário       |
| `email`         | VARCHAR(255)       | Único, NOT NULL, e-mail do usuário                   |
| `password_hash` | VARCHAR(255)       | NOT NULL, hash da senha do usuário                   |
| `first_name`    | VARCHAR(100)       | NOT NULL, primeiro nome do usuário                   |
| `last_name`     | VARCHAR(100)       | NOT NULL, último nome do usuário                     |
| `created_at`    | TIMESTAMP WITH TIME ZONE | NOT NULL, data e hora de criação do registro       |
| `updated_at`    | TIMESTAMP WITH TIME ZONE | Data e hora da última atualização do registro      |

### 4.2. Tabela `children`

Armazena informações sobre os filhos, com uma relação de muitos para muitos com os usuários (pais/mães).

| Coluna          | Tipo de Dados      | Restrições / Descrição                               |
| :-------------- | :----------------- | :--------------------------------------------------- |\n| `id`            | UUID / SERIAL      | Chave primária, identificador único do filho         |
| `first_name`    | VARCHAR(100)       | NOT NULL, primeiro nome do filho                     |
| `last_name`     | VARCHAR(100)       | Último nome do filho (opcional)                      |
| `date_of_birth` | DATE               | Data de nascimento do filho                          |
| `created_at`    | TIMESTAMP WITH TIME ZONE | NOT NULL, data e hora de criação do registro       |
| `updated_at`    | TIMESTAMP WITH TIME ZONE | Data e hora da última atualização do registro      |

### 4.3. Tabela `user_children` (Tabela de Junção)

Relaciona usuários a filhos, permitindo que múltiplos pais sejam associados a múltiplos filhos.

| Coluna          | Tipo de Dados      | Restrições / Descrição                               |
| :-------------- | :----------------- | :--------------------------------------------------- |
| `user_id`       | UUID / INTEGER     | Chave estrangeira para `users.id`                    |
| `child_id`      | UUID / INTEGER     | Chave estrangeira para `children.id`                 |
| `relationship`  | VARCHAR(50)        | Ex: 'pai', 'mãe', 'guardião'                         |
| `created_at`    | TIMESTAMP WITH TIME ZONE | NOT NULL, data e hora de criação do registro       |
| `PRIMARY KEY`   | (user_id, child_id)| Chave primária composta                              |

### 4.4. Tabela `expenses`

Armazena os detalhes de cada custo.

| Coluna          | Tipo de Dados      | Restrições / Descrição                               |
| :-------------- | :----------------- | :--------------------------------------------------- |
| `id`            | UUID / SERIAL      | Chave primária, identificador único do custo         |
| `user_id`       | UUID / INTEGER     | NOT NULL, chave estrangeira para `users.id` (quem registrou o custo) |
| `child_id`      | UUID / INTEGER     | NOT NULL, chave estrangeira para `children.id` (a qual filho o custo se refere) |
| `description`   | TEXT               | NOT NULL, descrição detalhada do custo               |
| `amount`        | DECIMAL(10, 2)     | NOT NULL, valor do custo                             |
| `expense_date`  | DATE               | NOT NULL, data em que o custo ocorreu                |
| `category`      | VARCHAR(100)       | NOT NULL, categoria do custo (ex: 'educação', 'saúde') |
| `status`        | VARCHAR(50)        | NOT NULL, status do custo (ex: 'pendente', 'pago', 'reembolsado') |
| `created_at`    | TIMESTAMP WITH TIME ZONE | NOT NULL, data e hora de criação do registro       |
| `updated_at`    | TIMESTAMP WITH TIME ZONE | Data e hora da última atualização do registro      |

### 4.5. Tabela `receipts`

Armazena informações sobre os comprovantes anexados aos custos.

| Coluna          | Tipo de Dados      | Restrições / Descrição                               |
| :-------------- | :----------------- | :--------------------------------------------------- |
| `id`            | UUID / SERIAL      | Chave primária, identificador único do comprovante   |
| `expense_id`    | UUID / INTEGER     | NOT NULL, chave estrangeira para `expenses.id`       |
| `file_path`     | VARCHAR(255)       | NOT NULL, caminho/URL do arquivo do comprovante      |
| `file_type`     | VARCHAR(50)        | Tipo do arquivo (ex: 'image/jpeg', 'application/pdf') |
| `uploaded_at`   | TIMESTAMP WITH TIME ZONE | NOT NULL, data e hora do upload do comprovante     |

Este modelo de dados fornece a estrutura básica para as funcionalidades descritas, permitindo o registro de usuários, filhos, custos e seus respectivos comprovantes, além de facilitar a geração de relatórios e o gerenciamento financeiro compartilhado.

