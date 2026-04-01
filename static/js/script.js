document.addEventListener("DOMContentLoaded", () => {
    
    // Mapeamento dos botões e inputs
    const btnBuscarPasta = document.getElementById("btn-buscar-pasta");
    const btnProcessar = document.getElementById("btn-processar");
    const radiosExtensao = document.querySelectorAll('input[name="tipo_ext"]');
    
    // Novos botões do Raio-X
    const btnMapearPptx = document.getElementById("btn-mapear-pptx");
    const containerRaioX = document.getElementById("container-raiox");
    const listaOpcoesRaioX = document.getElementById("lista-opcoes-raiox");
    const btnExtrairIndice = document.getElementById("btn-extrair-indice");

    // 1. Evento: Procurar Pasta no Windows
    btnBuscarPasta.addEventListener("click", async () => {
        try {
            const response = await fetch('/api/selecionar_pasta');
            const data = await response.json();
            if (data.pasta) {
                document.getElementById('caminho').value = data.pasta;
            }
        } catch (error) {
            console.error("Erro ao comunicar com o servidor (Pasta):", error);
        }
    });

    // 2. Evento: Mostrar/Ocultar Extensão Customizada
    radiosExtensao.forEach(radio => {
        radio.addEventListener("change", () => {
            const isCustom = document.querySelector('input[name="tipo_ext"]:checked').value === 'custom';
            document.getElementById('extensao_custom_container').style.display = isCustom ? 'block' : 'none';
        });
    });

    // 3. Evento: Botão Principal de Renomear
    btnProcessar.addEventListener("click", async () => {
        const caminho = document.getElementById('caminho').value;
        const dry_run = document.getElementById('dry_run').checked;
        const nomesTxt = document.getElementById('nomes').value;
        
        let extensao = document.querySelector('input[name="tipo_ext"]:checked').value;
        if (extensao === 'custom') {
            extensao = document.getElementById('extensao_custom').value.trim();
        }

        const nomes = nomesTxt.split('\n').map(n => n.trim()).filter(n => n !== ""); 

        try {
            const response = await fetch('/api/renomear', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ caminho, extensao, nomes, dry_run })
            });

            const data = await response.json();
            atualizarInterfaceResultado(response.ok, data, dry_run);

        } catch (error) {
            console.error("Erro na requisição de processamento:", error);
            alert("Erro de conexão com o servidor Python.");
        }
    });

    // Função Auxiliar de Interface
    function atualizarInterfaceResultado(sucesso, data, isDryRun) {
        const divResultado = document.getElementById('resultado');
        const h3Mensagem = document.getElementById('res-mensagem');
        const divDetalhes = document.getElementById('res-detalhes');

        divResultado.style.display = 'block';

        if (sucesso) {
            divResultado.style.backgroundColor = isDryRun ? '#e6fffa' : '#f0fff4';
            divResultado.style.border = `1px solid ${isDryRun ? '#b2f5ea' : '#c6f6d5'}`;
            h3Mensagem.innerText = data.mensagem;
            h3Mensagem.style.color = isDryRun ? '#319795' : '#2f855a';
            divDetalhes.innerHTML = data.detalhes.map(d => `<div>> ${d}</div>`).join('');
        } else {
            divResultado.style.backgroundColor = '#fff5f5';
            divResultado.style.border = '1px solid #fed7d7';
            h3Mensagem.innerText = "Erro durante a execução:";
            h3Mensagem.style.color = '#c53030';
            divDetalhes.innerHTML = `<div>> ${data.erro}</div>`;
        }
    }

// Variável global para guardar a ordem exata dos cliques
    let ordemSelecaoRaioX = [];

    // 4. Evento: Fazer o Raio-X do slide
    btnMapearPptx.addEventListener("click", async () => {
        const caminho = document.getElementById('caminho').value;
        if (!caminho) {
            alert("Por favor, selecione a pasta primeiro!");
            return;
        }

        btnMapearPptx.innerText = "⏳ Analisando slide...";
        btnMapearPptx.disabled = true;
        containerRaioX.style.display = "none";
        listaOpcoesRaioX.innerHTML = ""; 
        ordemSelecaoRaioX = []; // Zera as seleções ao buscar novo arquivo

        try {
            const response = await fetch('/api/mapear_pptx', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ caminho })
            });

            const data = await response.json();

            if (response.ok) {
                let htmlOpcoes = `<div class="raiox-file-base">Arquivo base: <strong>${data.arquivo}</strong></div>`;
                
                for (const [indice, texto] of Object.entries(data.opcoes)) {
                    // Mudamos de type="radio" para type="checkbox"
                    htmlOpcoes += `
                        <label class="raiox-option-item">
                            <input type="checkbox" class="chk-raiox" value="${indice}"> 
                            <div><span class="raiox-option-label">Caixa ${indice}:</span> "${texto}"</div>
                        </label>
                    `;
                }
                
                listaOpcoesRaioX.innerHTML = htmlOpcoes;
                containerRaioX.style.display = "block"; 

                // Adiciona o ouvinte de cliques para gravar a ordem de seleção
                document.querySelectorAll('.chk-raiox').forEach(chk => {
                    chk.addEventListener('change', (e) => {
                        if (e.target.checked) {
                            ordemSelecaoRaioX.push(e.target.value); // Adiciona na ordem do clique
                        } else {
                            ordemSelecaoRaioX = ordemSelecaoRaioX.filter(val => val !== e.target.value); // Remove se desmarcar
                        }
                    });
                });

            } else {
                alert("Erro: " + data.erro);
            }
        } catch (error) {
            console.error("Erro ao mapear PPTX:", error);
            alert("Erro de conexão com o servidor Python.");
        } finally {
            btnMapearPptx.innerText = "🔍 Raio-X de Apresentações (.pptx)";
            btnMapearPptx.disabled = false;
        }
    });

    // 5. Evento: Extrair títulos pelas opções escolhidas
    btnExtrairIndice.addEventListener("click", async () => {
        const caminho = document.getElementById('caminho').value;
        
        if (ordemSelecaoRaioX.length === 0) {
            alert("Por favor, selecione pelo menos uma caixa de texto antes de extrair.");
            return;
        }

        btnExtrairIndice.innerText = "⏳ Extraindo em lote...";
        btnExtrairIndice.disabled = true;

        try {
            const response = await fetch('/api/extrair_pptx_indice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ caminho, indices: ordemSelecaoRaioX }) // Envia a lista ordenada
            });

            const data = await response.json();

            if (response.ok) {
                const txtNomes = document.getElementById('nomes');
                txtNomes.value = data.titulos.join('\n');
                txtNomes.classList.add("textarea-success");
                setTimeout(() => { txtNomes.classList.remove("textarea-success"); }, 800);
            } else {
                alert("Erro na extração: " + data.erro);
            }
        } catch (error) {
            console.error("Erro ao extrair PPTX:", error);
            alert("Erro de conexão com o servidor Python.");
        } finally {
            btnExtrairIndice.innerText = "🪄 Extrair Nomes Usando o Padrão Selecionado";
            btnExtrairIndice.disabled = false;
        }
    });
});