from flask import Flask, render_template, request, jsonify
import os
import sys
import webbrowser
from threading import Timer
from pathlib import Path
import tkinter as tk
from tkinter import filedialog
from main import obter_arquivos_por_data, sanitizar_nome_arquivo, extrair_titulos_de_pptx, mapear_shapes_primeiro_slide, extrair_titulos_por_indices


if getattr(sys, 'frozen', False):
    base_dir = sys._MEIPASS
else:
    base_dir = os.path.abspath(os.path.dirname(__file__))

app = Flask(__name__, 
            template_folder=os.path.join(base_dir, 'templates'),
            static_folder=os.path.join(base_dir, 'static'))


@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/selecionar_pasta', methods=['GET'])
def selecionar_pasta():

    root = tk.Tk()
    root.withdraw()
    root.attributes('-topmost', True) 
    pasta = filedialog.askdirectory(title="Selecione a pasta com as aulas")
    root.destroy()
    
    return jsonify({"pasta": pasta})

@app.route('/api/renomear', methods=['POST'])
def renomear_api():
    dados = request.json
    caminho_pasta = dados.get('caminho')
    extensao_fixa = dados.get('extensao')
    lista_nomes = dados.get('nomes', [])
    dry_run = dados.get('dry_run', True)

    if not caminho_pasta or not os.path.exists(caminho_pasta):
        return jsonify({"erro": "Caminho da pasta inválido ou não existe."}), 400

    if not lista_nomes:
        return jsonify({"erro": "A lista de nomes não pode estar vazia."}), 400

    try:
        arquivos = obter_arquivos_por_data(caminho_pasta)
        pasta_path = Path(caminho_pasta)
        
        resultados = []
        sucessos = 0

        for i, arquivo in enumerate(arquivos):
            if i >= len(lista_nomes):
                break
            
            nome_novo = sanitizar_nome_arquivo(lista_nomes[i])
            ext = extensao_fixa if extensao_fixa else arquivo.suffix
            nome_final = nome_novo + (ext if not nome_novo.endswith(ext) else "")
            
            destino = pasta_path / nome_final
            
            if dry_run:
                resultados.append(f"👀 [Simulação] {arquivo.name} → {nome_final}")
            else:
                try:
                    arquivo.rename(destino)
                    resultados.append(f"✅ {arquivo.name} → {nome_final}")
                    sucessos += 1
                except Exception as e:
                    resultados.append(f"❌ Erro em {arquivo.name}: {e}")

        mensagem_final = "Simulação concluída. Desmarque a caixa para aplicar." if dry_run else f"Concluído! {sucessos} arquivos renomeados."
        
        return jsonify({"mensagem": mensagem_final, "detalhes": resultados})

    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@app.route('/api/extrair_pptx', methods=['POST'])
def extrair_pptx_api():
    dados = request.json
    caminho_pasta = dados.get('caminho')

    if not caminho_pasta or not os.path.exists(caminho_pasta):
        return jsonify({"erro": "Caminho da pasta inválido ou não existe."}), 400

    try:
        titulos = extrair_titulos_de_pptx(caminho_pasta)
        if not titulos:
            return jsonify({"erro": "Nenhum arquivo .pptx válido encontrado."}), 404
        
        return jsonify({"titulos": titulos})
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@app.route('/api/mapear_pptx', methods=['POST'])
def mapear_pptx_api():
    dados = request.json
    caminho_pasta = dados.get('caminho')

    if not caminho_pasta or not os.path.exists(caminho_pasta):
        return jsonify({"erro": "Caminho inválido."}), 400

    mapeamento = mapear_shapes_primeiro_slide(caminho_pasta)
    if not mapeamento:
        return jsonify({"erro": "Nenhum arquivo .pptx válido encontrado para mapear."}), 404
    
    return jsonify(mapeamento)

@app.route('/api/extrair_pptx_indice', methods=['POST'])
def extrair_pptx_indice_api():
    dados = request.json
    caminho_pasta = dados.get('caminho')
    indices = dados.get('indices') # Agora recebe uma lista (array)

    if not indices or not isinstance(indices, list):
        return jsonify({"erro": "Nenhum índice selecionado."}), 400

    try:
        indices_int = [int(i) for i in indices]
        titulos = extrair_titulos_por_indices(caminho_pasta, indices_int)
        return jsonify({"titulos": titulos})
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

def abrir_navegador():
    """Abre a página automaticamente no navegador padrão"""
    webbrowser.open("http://127.0.0.1:5000/")

if __name__ == '__main__':
    # O Timer aguarda 1.5 segundos para dar tempo do servidor ligar
    Timer(1.5, abrir_navegador).start()
    
    # debug=False e use_reloader=False são OBRIGATÓRIOS para o .exe funcionar direito
    app.run(host='127.0.0.1', port=5000, debug=False, use_reloader=False)