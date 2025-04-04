import axios from 'axios';

let emailList = new Set();
let isScrapingActive = false;

async function startScraping() {
    if (isScrapingActive) return;
    
    const keywords = document.getElementById('keywords').value;
    const state = document.getElementById('state').value;
    const city = document.getElementById('city').value;
    
    if (!keywords || !state || !city) {
        alert('Por favor, preencha todos os campos');
        return;
    }

    emailList.clear();
    isScrapingActive = true;
    updateUI(0);
    
    try {
        // Make request to Node.js backend
        const response = await axios.post('/scrape', {
            keywords,
            state,
            city
        });

        if (response.data.emails) {
            emailList = new Set(response.data.emails);
            updateEmailList();
            updateUI(100);
        }
    } catch (error) {
        console.error('Erro durante a busca:', error);
        let errorMessage = 'Ocorreu um erro durante a busca.';
        if (error.response && error.response.data && error.response.data.error) {
            errorMessage += ' Detalhes: ' + error.response.data.error;
            if (error.response.data.details) {
                errorMessage += ' - ' + error.response.data.details;
            }
        } else {
            errorMessage += ' Verifique se o servidor está rodando e se a conexão está estável.';
        }
        alert(errorMessage);
    } finally {
        isScrapingActive = false;
    }
}

function updateUI(progress) {
    document.getElementById('progress-bar').style.width = `${progress}%`;
    document.getElementById('progress-text').textContent = `${Math.round(progress)}%`;
    document.getElementById('email-count').textContent = emailList.size;
    document.getElementById('pages-processed').textContent = Math.ceil(progress / 2);
}

function updateEmailList() {
    document.getElementById('email-list').value = Array.from(emailList).join('\n');
}

function exportToTXT() {
    downloadFile('emails.txt', Array.from(emailList).join('\n'));
}

function exportToCSV() {
    downloadFile('emails.csv', Array.from(emailList).join(','));
}

function copyToClipboard() {
    const textarea = document.getElementById('email-list');
    textarea.select();
    document.execCommand('copy');
    alert('E-mails copiados para a área de transferência!');
}

function downloadFile(filename, content) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

// Expõe funções necessárias globalmente
window.startScraping = startScraping;
window.exportToTXT = exportToTXT;
window.exportToCSV = exportToCSV;
window.copyToClipboard = copyToClipboard;

