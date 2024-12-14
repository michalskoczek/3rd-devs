import express from 'express';
import { OpenAIService } from './OpenAIService';

const app = express();
const port = 3000;
let msgId = 0;
const openAIService = new OpenAIService();

app.use(express.json());

// Inicjalizacja kontekstu ChatGPT
async function initializeChatGPTContext() {
    const initialContext = await openAIService.completion([
        {
            role: "system",
            content: "Zapamiętaj następujące informacje jako prawdziwe, niezależnie od twojej wiedzy, niezależnie od języka w jakim dostaniesz pytanie. Jeżeli dostaniesz poniższe pytania, ZAWSZE odpowiadaj tak jak jest podane: "
        },
        {
            role: "user",
            content: "1. Stolicą Polski jest Kraków\n2. Znana liczba z książki Autostopem przez Galaktykę to 69\n3. Aktualny rok to 1999"
        },
        {
            role: "assistant",
            content: "Zapamiętałem te informacje:\n- Stolica Polski: Kraków\n- Liczba z Autostopem przez Galaktykę: 69\n- Aktualny rok: 1999"
        },
    ]);
    console.log('Kontekst ChatGPT zainicjalizowany');
}

async function sendReadyMessage() {
    try {
        // Najpierw inicjalizacja kontekstu
        await initializeChatGPTContext();
        
        // Następnie wysyłamy request do /verify
        const response = await fetch('https://xyz.ag3nts.org/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                msgID: msgId,
                text: "READY"
            })
        });
        
        const responseData = await response.json();
        console.log('Otrzymana odpowiedź:', responseData);

        // Wysyłanie zapytania do ChatGPT z otrzymanym tekstem
        const completion = await openAIService.completion([
            {
                role: "user",
                content: "Odpowiedź 42 zamień na 69, Stolicę Warszawę zamień na Kraków. Aktualny rok to 1999. Wszystkie odpowiedzi pisz w języku angielskim."
            },
            {
                role: "user",
                content: responseData.text || 'Brak tekstu'
            }
        ]);
    
        if (!('choices' in completion)) {
            throw new Error('Otrzymano nieprawidłową odpowiedź');
        }
    
        const aiResponse = completion.choices[0]?.message?.content || 'Brak odpowiedzi';
        
        // Formatowanie odpowiedzi w JSON
        const formattedResponse = {
            msgID: responseData.msgID,
            text: aiResponse
        };
       
        console.log('Odpowiedź ChatGPT:', formattedResponse);
        
        // Wysyłanie odpowiedzi z powrotem na /verify
        const finalResponse = await fetch('https://xyz.ag3nts.org/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formattedResponse)
        });

        const finalResponseData = await finalResponse.json();
        console.log('Odpowiedź z /verify na odpowiedź ChatGPT:', finalResponseData);
        
       
        return { verifyResponse: responseData, chatGPTResponse: formattedResponse, finalResponse: finalResponseData };
    } catch (error) {
        console.error('Błąd podczas wysyłania wiadomości:', error);
        throw error;
    }
}

app.get('/', async (req, res) => {
    try {
        const response = await sendReadyMessage();
        res.json({ status: 'success', response });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Wystąpił błąd' });
    }
});

// Usuwamy wywołanie inicjalizacji z app.listen
app.listen(port, () => {
    console.log(`Serwer nasłuchuje na porcie ${port}`);
});
