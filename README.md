# 📂 SlideNamer (Renomeador Inteligente)

Uma aplicação local em Python + Flask para organizar, renomear arquivos em massa e extrair textos estruturados de apresentações (.pptx) para automação de nomenclatura.

![Interface Principal do Sistema]()

## 📖 O Problema e o Contexto
Projeto desenvolvido para resolver uma dor real de professores: o download de dezenas de aulas em PDF, vídeos e slides que vêm com nomes gerados por sistemas (ex: `1422111.pptx`). A renomeação manual além de demorada, frequentemente quebra a ordem cronológica do curso.

O **SlideNamer** automatiza isso: ele cruza a data de modificação real do sistema operacional (`st_mtime`) com uma lista de nomes fornecida pelo usuário, aplicando a renomeação em lote de forma sequencial.

## ✨ A Evolução: Da V1 à V2 (Mapeamento XML)
Na **V1**, o extrator de PPTX buscava automaticamente a tag nativa de "Título" da Microsoft. No entanto, templates customizados (como os do Governo de SP) utilizam caixas de texto genéricas (*shapes*), o que quebrava a automação.

Para resolver isso, a **V2** implementou uma arquitetura de *Human-in-the-loop*:
1. O backend abre o PPTX em background e faz um "Raio-X" do XML do primeiro slide.
2. O frontend exibe todas as caixas de texto encontradas.
3. O usuário seleciona **quais caixas** contêm a informação (ex: Caixa 4 para "Aula 01" e Caixa 0 para o "Tema").
4. O sistema grava a **ordem dos cliques**, concatena as informações com um hífen e extrai o padrão exato para todos os arquivos da pasta em segundos.

![Demonstração do Raio-X em PPTX]()

## 🛠️ Tecnologias Utilizadas
* **Backend:** Python, Flask, `python-pptx` (Manipulação de XML e ZIP)
* **Manipulação de SO:** Bibliotecas nativas `os`, `pathlib` e `tkinter` (para seleção nativa de pastas)
* **Frontend:** HTML5, CSS3 e Vanilla JavaScript (uso de Fetch API assíncrona)
* **Distribuição:** PyInstaller (Build executável)

## 🚀 Como usar (Versão Executável)
Se você não é desenvolvedor e quer apenas usar a ferramenta:
1. Vá até a aba **Releases** aqui no GitHub.
2. Baixe o arquivo `Renomeador de Aulas.exe`.
3. Dê dois cliques (não precisa instalar nada). O seu navegador abrirá a ferramenta automaticamente.

## 💻 Como rodar o código-fonte (Desenvolvedores)
```bash
# Clone o repositório
git clone [https://github.com/SeuUsuario/SlideNamer.git](https://github.com/SeuUsuario/SlideNamer.git)
cd SlideNamer

# Crie o ambiente virtual e instale as dependências
python -m venv venv
venv\Scripts\activate
pip install Flask python-pptx

# Rode o servidor local
python app.py
'''
Desenvolvido por Juan
