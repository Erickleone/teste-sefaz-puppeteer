// Importa a ferramenta Puppeteer
const puppeteer = require('puppeteer');

// Esta é a função principal do nosso teste.
async function testarBuscaSefaz() {
    console.log('Iniciando o teste de busca na SEFAZ/RN...');

    // O código de barras (GTIN) de um produto real.
    // Exemplo: LEITE UHT INTEGRAL ITALAC 1L
    const codigoDeBarras = '7898080641699'; 

    let browser; // Declara a variável do browser aqui para que possamos fechá-la no 'finally'

    try {
        // 1. Inicia o "navegador invisível" do Puppeteer
        // Adicionamos argumentos para rodar em ambientes como o Gitpod, que é Linux e sem interface gráfica.
        console.log('Iniciando o navegador Puppeteer...');
        browser = await puppeteer.launch({
            headless: "new",
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
            ],
        });
        
        // 2. Abre uma nova aba nesse navegador
        console.log('Abrindo uma nova página...');
        const page = await browser.newPage();

        // 3. Define um "User-Agent" para parecer um navegador de verdade
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

        // 4. Navega até a página de consulta pública da SEFAZ/RN
        const url = `https://portal.nfce.sefaz.rn.gov.br/consultarNFCe.aspx?p=${codigoDeBarras}|`;
        console.log(`Acessando o URL: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle2' }); // Espera a página carregar

        // 5. Extrai os dados da tabela de resultados da página
        console.log('Página carregada. Tentando extrair os dados da tabela...');
        const resultados = await page.evaluate(() => {
            const tabela = document.querySelector('#grdProdutos');
            if (!tabela) {
                // Se a tabela não for encontrada, retorna um array vazio.
                return []; 
            }
            const linhas = Array.from(tabela.querySelectorAll('tr'));
            linhas.shift(); // Remove o cabeçalho
            
            return linhas.map(linha => {
                const colunas = linha.querySelectorAll('td');
                return {
                    loja: colunas[0]?.innerText.trim(),
                    endereco: colunas[1]?.innerText.trim(),
                    data: colunas[2]?.innerText.trim(),
                    preco: colunas[3]?.innerText.trim()
                };
            });
        });

        // 7. Mostra o resultado do nosso teste
        if (resultados.length > 0) {
            console.log('\n--- SUCESSO! ---');
            console.log(`Dados extraídos com êxito da SEFAZ/RN. Encontrados ${resultados.length} registros.`);
            console.log('Aqui estão os 3 primeiros encontrados:');
            console.log(resultados.slice(0, 3));
        } else {
            console.log('\n--- ALERTA! ---');
            console.log('A conexão funcionou, mas nenhum produto foi encontrado com este código de barras ou a tabela de resultados não foi encontrada na página.');
            console.log('Verifique se o layout do site da SEFAZ mudou.');
        }

    } catch (error) {
        // Se qualquer um dos passos acima der errado, o código virá para cá.
        console.error('\n--- FALHA CRÍTICA! ---');
        console.error('Ocorreu um erro ao tentar acessar ou extrair os dados da SEFAZ/RN.');
        console.error('Detalhes do erro:', error.message);
    } finally {
        // 8. Garante que o navegador seja fechado, mesmo que ocorra um erro.
        if (browser) {
            console.log('Fechando o navegador...');
            await browser.close();
        }
        console.log('Teste finalizado.');
    }
}

// Executa a função de teste que criamos.
testarBuscaSefaz();
