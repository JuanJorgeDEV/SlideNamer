document.addEventListener("DOMContentLoaded", () => {
    
    const btnBuscarPasta = document.getElementById("btn-buscar-pasta");
    const btnProcessar = document.getElementById("btn-processar");
    const radiosExtensao = document.querySelectorAll('input[name="tipo_ext"]');
    const btnExtrairPptx = document.getElementById("btn-extrair-pptx");


    btnExtrairPptx.addEventListener("click", async () => {
        const caminho = document.getElementById('caminho').value;
        if (!caminho) {
            alert("Por favor, selecione a pasta primeiro!");
            return;
        }

        btnExtrairPptx.innerText = "⏳ Extraindo...";
        btnExtrairPptx.disabled = true;

        try {
            const response = await fetch('/api/extrair_pptx', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ caminho })
            });

            const data = await response.json();

            if (response.ok) {
               
                document.getElementById('nomes').value = data.titulos.join('\n');
            } else {
                alert("Erro: " + data.erro);
            }
        } catch (error) {
            console.error("Erro ao extrair PPTX:", error);
            alert("Erro de conexão com o servidor.");
        } finally {
            btnExtrairPptx.innerText = "🪄 Extrair Títulos de Apresentações (.pptx)";
            btnExtrairPptx.disabled = false;
        }
    });
    
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

    radiosExtensao.forEach(radio => {
        radio.addEventListener("change", () => {
            const isCustom = document.querySelector('input[name="tipo_ext"]:checked').value === 'custom';
            document.getElementById('extensao_custom_container').style.display = isCustom ? 'block' : 'none';
        });
    });

    btnProcessar.addEventListener("click", async () => {
        const caminho = document.getElementById('caminho').value;
        const dry_run = document.getElementById('dry_run').checked;
        const nomesTxt = document.getElementById('nomes').value;
        
        let extensao = document.querySelector('input[name="tipo_ext"]:checked').value;
        if (extensao === 'custom') {
            extensao = document.getElementById('extensao_custom').value.trim();
        }

        const nomes = nomesTxt.split('\n')
                              .map(n => n.trim())
                              .filter(n => n !== ""); 

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
});


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