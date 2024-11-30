import { OpenAIService } from '../sdk/OpenAIService';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

async function transferData(task: string, apikey: string) {
    try {
        // Pobieranie danych z pierwszego endpointu
        const response = await fetch('https://poligon.aidevs.pl/dane.txt', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Błąd HTTP: ${response.status}`);
        }

        // Konwersja odpowiedzi na tekst (zakładając, że otrzymujemy dwa ciągi znaków)
        const textData = await response.text();

        // Wykorzystanie OpenAI do przetworzenia tekstu
        const openAIService = new OpenAIService();
        const messages: ChatCompletionMessageParam[] = [
            {
                role: "system",
                content: "Przekształć podany tekst na tablicę dwóch stringów. Zwróć tylko samą tablicę w formacie JSON."
            },
            {
                role: "user",
                content: textData
            }
        ];

        const aiResponse = await openAIService.completion(messages, "gpt-4");
        const processedArray = JSON.parse(aiResponse.choices[0].message.content ?? "[]");

        // Przygotowanie danych do wysłania
        const dataToSend = {
            task: task,
            apikey: apikey,
            answer: processedArray
        };

        
        const sendResponse = await fetch('https://poligon.aidevs.pl/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataToSend)
        });

        if (!sendResponse.ok) {
            throw new Error(`Błąd podczas wysyłania: ${sendResponse.status}`);
        }

        const wynik = await sendResponse.json();
        console.log('Dane zostały pomyślnie przesłane:', wynik);

    } catch (error) {
        console.error('Wystąpił błąd:', error);
    }
}

transferData("POLIGON", "a1f02bd8-1822-48fe-938a-037e1ffbfd84");